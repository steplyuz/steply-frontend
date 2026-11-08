"use client"

import { useEffect, useRef, useState } from "react"
import { VideoOff } from "lucide-react"

export type CameraState = "idle" | "loading" | "ready" | "denied" | "unavailable"

/** Veb-kamera oqimini ochadi va komponent yopilganda to'xtatadi. */
export function useCamera(enabled = true) {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [state, setState] = useState<CameraState>("idle")

    useEffect(() => {
        if (!enabled) return
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
            setState("unavailable")
            return
        }
        let cancelled = false
        let active: MediaStream | null = null
        setState("loading")
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false })
            .then((s) => {
                if (cancelled) {
                    s.getTracks().forEach((t) => t.stop())
                    return
                }
                active = s
                setStream(s)
                setState("ready")
            })
            .catch((err: DOMException) => {
                if (cancelled) return
                setState(err?.name === "NotAllowedError" ? "denied" : "unavailable")
            })
        return () => {
            cancelled = true
            active?.getTracks().forEach((t) => t.stop())
            setStream(null)
        }
    }, [enabled])

    return { stream, state }
}

interface CameraFeedProps {
    className?: string
    /** Kamera ishlamasa yoki ataylab o'chirilgan bo'lsa ko'rsatiladigan matn */
    fallbackText?: string
    /** Practice rejimida false; kamera faqat aniq ruxsat berilgan imtihon oqimida yoqiladi. */
    enabled?: boolean
    live?: boolean
}

/** Nomzodning jonli kamera ko'rinishi (oynasi ko'zgudek aks etadi). */
export function CameraFeed({ className = "", fallbackText = "Kamera o'chiq", enabled = false, live = true }: CameraFeedProps) {
    const { stream, state } = useCamera(enabled)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        if (stream) v.play().catch(() => {})
    }, [stream])

    return (
        <div className={`relative overflow-hidden bg-foreground ${className}`}>
            {state === "ready" ? (
                <>
                    <video ref={videoRef} muted playsInline autoPlay className="h-full w-full -scale-x-100 object-cover" />
                    {live && (
                        <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                            <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> Live
                        </span>
                    )}
                </>
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-foreground px-3 text-center text-muted-foreground/70">
                    <VideoOff className="size-6" />
                    <span className="text-[11px] font-medium">
                        {!enabled ? fallbackText : state === "loading" ? "Kamera ulanmoqda..." : state === "denied" ? "Kameraga ruxsat berilmagan" : fallbackText}
                    </span>
                </div>
            )}
        </div>
    )
}
