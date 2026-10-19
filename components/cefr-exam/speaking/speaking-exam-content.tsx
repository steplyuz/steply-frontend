"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    Mic,
    Square,
    RotateCcw,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Headphones,
    Sparkles,
    Volume2,
    AlertCircle,
    Play,
    Pause,
} from "lucide-react"
import { resolveAudioUrl } from "@/lib/api"
import { getMicStream } from "@/components/exam/preflight"

export interface SpeakingPromptItem {
    partId: string
    partKey: "part_1_1" | "part_1_2" | "part_2" | "part_3"
    partName: string
    questionId: string
    label: string
    text: string
    image?: string | string[] | null
    prepSeconds?: number
    answerSeconds?: number
    forPoints?: string[]
    againstPoints?: string[]
}

interface SpeakingExamContentProps {
    prompts: SpeakingPromptItem[]
    currentIndex: number
    onSelectIndex: (index: number) => void
    uploadedStatus: Record<string, boolean>
    audioUrls: Record<string, string>
    onRecordComplete: (prompt: SpeakingPromptItem, file: File, audioUrl: string) => Promise<void>
    fontSize?: number
    onIncreaseFontSize?: () => void
    onDecreaseFontSize?: () => void
    onBusyChange?: (busy: boolean) => void
    autoStart?: boolean
}

function AudioPlayerInline({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    return (
        <div className="flex items-center gap-3 rounded-2xl bg-background border border-border p-3 max-w-md">
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => setIsPlaying(false)}
            />
            <button
                type="button"
                onClick={togglePlay}
                className="size-10 rounded-xl bg-foreground text-white flex items-center justify-center hover:bg-black transition shadow-sm shrink-0"
            >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
                    <span>Yozib olingan javobingiz</span>
                    <span className="tabular-nums">
                        {Math.floor(currentTime)}s / {Math.floor(duration || 0)}s
                    </span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-foreground transition-[width] duration-200"
                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                    />
                </div>
            </div>
        </div>
    )
}

export default function SpeakingExamContent({
    prompts,
    currentIndex,
    onSelectIndex,
    uploadedStatus,
    audioUrls,
    onRecordComplete,
    fontSize = 17,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onBusyChange,
    autoStart = false,
}: SpeakingExamContentProps) {
    const currentPrompt = prompts[currentIndex]
    const currentKey = currentPrompt ? `${currentPrompt.partId}-${currentPrompt.questionId}` : ""
    const isUploaded = uploadedStatus[currentKey]
    const localAudioUrl = audioUrls[currentKey]

    // Recording states
    const recorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<BlobPart[]>([])
    const [recording, setRecording] = useState(false)
    const [startingMic, setStartingMic] = useState(false)
    const [preparing, setPreparing] = useState(false)
    const [prepSecondsLeft, setPrepSecondsLeft] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [seconds, setSeconds] = useState(0)
    const [error, setError] = useState("")
    const pendingPromptRef = useRef<SpeakingPromptItem | null>(null)
    const prepDeadlineRef = useRef<number | null>(null)
    const recordingStartedAtRef = useRef<number | null>(null)
    const autoStartedKeyRef = useRef<string | null>(null)

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
    }, [])

    useEffect(() => {
        return () => {
            try {
                if (recorderRef.current?.state === "recording") recorderRef.current.stop()
            } catch {}
            stopStream()
        }
    }, [stopStream])

    useEffect(() => {
        onBusyChange?.(recording || preparing || uploading || startingMic)
    }, [recording, preparing, uploading, startingMic, onBusyChange])

    const beginRecording = useCallback((prompt: SpeakingPromptItem, stream: MediaStream) => {
        try {
            chunksRef.current = []
            let mimeType = ""
            for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]) {
                if (MediaRecorder.isTypeSupported(m)) {
                    mimeType = m
                    break
                }
            }
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
            recorderRef.current = recorder
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data)
            }
            recorder.onerror = () => setError("Audio yozishda xatolik yuz berdi.")
            recorder.onstop = async () => {
                stopStream()
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
                if (!blob.size) {
                    setError("Audio yozuvi bo'sh. Qaytadan urinib ko'ring.")
                    return
                }
                setUploading(true)
                try {
                    const ext = (recorder.mimeType || "audio/webm").includes("ogg") ? "ogg" : "webm"
                    const file = new File([blob], `${prompt.questionId}.${ext}`, { type: blob.type })
                    const blobUrl = URL.createObjectURL(blob)
                    await onRecordComplete(prompt, file, blobUrl)
                } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Audio yuklanmadi")
                } finally {
                    setUploading(false)
                }
            }
            recordingStartedAtRef.current = Date.now()
            recorder.start()
            setSeconds(0)
            setRecording(true)
        } catch (e: unknown) {
            stopStream()
            setError(e instanceof Error ? e.message : "Audio yozishni boshlashda xatolik yuz berdi")
        }
    }, [onRecordComplete, stopStream])

    // Savol ko'rsatiladi, foydalanuvchi tugmani bosadi, tayyorgarlik tugagach yozuv boshlanadi.
    useEffect(() => {
        if (!preparing) return
        const timer = window.setInterval(() => {
            const deadline = prepDeadlineRef.current
            if (deadline === null) return
            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
            setPrepSecondsLeft(remaining)
            if (remaining === 0) {
                window.clearInterval(timer)
                setPreparing(false)
                const prompt = pendingPromptRef.current
                const stream = streamRef.current
                prepDeadlineRef.current = null
                if (prompt && stream) beginRecording(prompt, stream)
                else setError("Mikrofon oqimi uzildi. Qaytadan boshlang.")
            }
        }, 200)
        return () => window.clearInterval(timer)
    }, [preparing, beginRecording])

    // Javob vaqti tugasa, yozuv avtomatik to'xtaydi.
    useEffect(() => {
        if (!recording) return
        const maxSeconds = currentPrompt?.answerSeconds
        const timer = window.setInterval(() => {
            const started = recordingStartedAtRef.current ?? Date.now()
            const elapsed = Math.floor((Date.now() - started) / 1000)
            setSeconds(elapsed)
            if (maxSeconds && maxSeconds > 0 && elapsed >= maxSeconds) {
                const recorder = recorderRef.current
                if (recorder?.state === "recording") {
                    setRecording(false)
                    recorder.stop()
                }
            }
        }, 200)
        return () => window.clearInterval(timer)
    }, [recording, currentPrompt?.answerSeconds])

    const startRecording = useCallback(async () => {
        if (!currentPrompt || recording || preparing || uploading || startingMic) return
        setError("")
        setSeconds(0)
        setStartingMic(true)
        try {
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
                throw new Error("Brauzeringiz audio yozishni qo'llab-quvvatlamaydi.")
            }
            const stream = await getMicStream()
            streamRef.current = stream
            pendingPromptRef.current = currentPrompt
            const prepSeconds = Math.max(0, Math.floor(currentPrompt.prepSeconds ?? 0))
            if (prepSeconds > 0) {
                prepDeadlineRef.current = Date.now() + prepSeconds * 1000
                setPrepSecondsLeft(prepSeconds)
                setPreparing(true)
            } else {
                beginRecording(currentPrompt, stream)
            }
        } catch (e: unknown) {
            stopStream()
            setError(e instanceof Error ? e.message : "Mikrofonni yoqib bo'lmadi")
        } finally {
            setStartingMic(false)
        }
    }, [currentPrompt, recording, preparing, uploading, startingMic, stopStream, beginRecording])

    // Imtihon boshlangach yangi savol uchun tayyorgarlik va yozuv avtomatik boshlanadi.
    // Mikrofon ruxsati birinchi marta so'ralishi mumkin; ruxsat berilmasa qo'lda qayta urinish mumkin.
    useEffect(() => {
        if (!autoStart || !currentPrompt || isUploaded || recording || preparing || uploading || startingMic) return
        if (autoStartedKeyRef.current === currentKey) return
        autoStartedKeyRef.current = currentKey
        void startRecording()
    }, [autoStart, currentPrompt, currentKey, isUploaded, recording, preparing, uploading, startingMic, startRecording])

    const stopRecording = () => {
        if (preparing) {
            setPreparing(false)
            prepDeadlineRef.current = null
            pendingPromptRef.current = null
            stopStream()
            return
        }
        const recorder = recorderRef.current
        if (!recorder || recorder.state !== "recording") return
        setRecording(false)
        recorder.stop()
    }

    if (!currentPrompt) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-muted-foreground">
                Savol topilmadi
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* TOP BAR / TABS & CONTROLS */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-white px-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {currentPrompt.partName}:
                    </span>
                    <span className="text-xs font-extrabold text-foreground bg-muted px-2.5 py-1 rounded-lg">
                        {currentPrompt.label}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Shrift:</span>
                    <button
                        onClick={onDecreaseFontSize}
                        disabled={fontSize <= 13}
                        className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                    >
                        A-
                    </button>
                    <span className="w-5 text-center text-xs font-semibold tabular-nums text-foreground/80">
                        {fontSize}
                    </span>
                    <button
                        onClick={onIncreaseFontSize}
                        disabled={fontSize >= 26}
                        className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                    >
                        A+
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6">
                    {/* PROMPT CARD */}
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-extrabold text-foreground">
                                <Headphones className="size-3.5" />
                                {currentPrompt.label}
                            </span>
                            {isUploaded && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="size-3.5" /> Yozildi
                                </span>
                            )}
                        </div>

                        {/* QUESTION / PROMPT TEXT */}
                        <div
                            className="font-bold text-foreground leading-relaxed whitespace-pre-wrap"
                            style={{ fontSize: `${fontSize + 1}px` }}
                        >
                            {currentPrompt.text}
                        </div>

                        {/* IMAGE (if available) */}
                        {currentPrompt.image && (
                            <div className={`grid gap-3 pt-2 ${Array.isArray(currentPrompt.image) && currentPrompt.image.filter(Boolean).length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {(Array.isArray(currentPrompt.image) ? currentPrompt.image : [currentPrompt.image]).filter((url): url is string => Boolean(url)).map((url, index) => (
                                    <img
                                        key={`${url}-${index}`}
                                        src={resolveAudioUrl(url)}
                                        alt={`Speaking topshirig'i rasmi ${index + 1}`}
                                        className="max-h-80 w-full rounded-xl border border-border shadow-sm object-contain"
                                    />
                                ))}
                            </div>
                        )}

                        {/* FOR / AGAINST POINTS (Part 3) */}
                        {(currentPrompt.forPoints?.length || currentPrompt.againstPoints?.length) ? (
                            <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-border text-xs sm:text-sm">
                                {currentPrompt.forPoints && currentPrompt.forPoints.length > 0 && (
                                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 space-y-1.5">
                                        <div className="font-bold text-emerald-900">Qo&apos;llab-quvvatlovchi fikrlar:</div>
                                        <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                                            {currentPrompt.forPoints.map((pt, i) => (
                                                <li key={i}>{pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {currentPrompt.againstPoints && currentPrompt.againstPoints.length > 0 && (
                                    <div className="rounded-xl bg-rose-50/70 border border-rose-200/80 p-3.5 space-y-1.5">
                                        <div className="font-bold text-rose-900">Qarshi fikrlar:</div>
                                        <ul className="list-disc pl-4 space-y-1 text-rose-800">
                                            {currentPrompt.againstPoints.map((pt, i) => (
                                                <li key={i}>{pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* RECORDING CONSOLE */}
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4 text-center flex flex-col items-center justify-center">
                        {startingMic ? (
                            <div className="flex flex-col items-center gap-3 py-6 text-sm font-semibold text-foreground/80">
                                <Loader2 className="size-7 animate-spin text-foreground" />
                                Mikrofon yoqilmoqda...
                                <p className="max-w-sm text-center text-xs font-normal text-muted-foreground">Brauzer mikrofon ruxsatini so‘rasa, ruxsat bering. Shundan so‘ng tayyorgarlik va yozuv avtomatik boshlanadi.</p>
                            </div>
                        ) : preparing ? (
                            <div className="space-y-4 w-full flex flex-col items-center py-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tayyorgarlik vaqti</div>
                                <div className="flex size-20 items-center justify-center rounded-full border-4 border-[#E4F70A] bg-background text-3xl font-black tabular-nums text-foreground">{prepSecondsLeft}</div>
                                <p className="max-w-md text-sm text-muted-foreground">Savolni o‘qing va javobingizni rejalashtiring. Vaqt tugagach audio yozish avtomatik boshlanadi.</p>
                                <button type="button" onClick={stopRecording} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground/80 hover:bg-background">Bekor qilish</button>
                            </div>
                        ) : recording ? (
                            <div className="space-y-4 w-full flex flex-col items-center py-2">
                                {/* Pulsing recording visualizer */}
                                <div className="flex items-center gap-1.5 h-12">
                                    <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-10 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-12 bg-red-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-8 bg-red-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                                    <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.35s]" />
                                </div>
                                <div className="flex items-center gap-2 text-sm font-extrabold text-red-600">
                                    <span className="size-2.5 rounded-full bg-red-600 animate-ping" />
                                    Ovoz yozilmoqda: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                                </div>
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm"
                                >
                                    <Square className="size-4 fill-current" />
                                    Yozishni to&apos;xtatish
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 w-full flex flex-col items-center py-2">
                                {localAudioUrl && (
                                    <div className="w-full flex justify-center pb-2">
                                        <AudioPlayerInline url={localAudioUrl} />
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        disabled={uploading || startingMic}
                                        className="px-7 py-3.5 bg-foreground hover:bg-black text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Saqlanmoqda...
                                            </>
                                        ) : isUploaded ? (
                                            <>
                                                <RotateCcw className="size-4" />
                                                Qayta yozish
                                            </>
                                        ) : currentPrompt.prepSeconds && currentPrompt.prepSeconds > 0 ? (
                                            <>
                                                <Sparkles className="size-4 text-[#E4F70A]" />
                                                Tayyorgarlikni boshlash
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="size-4 text-[#E4F70A]" />
                                                Javobni yozish
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {isUploaded
                                        ? "Javobingiz saqlandi. Istasangiz qayta yozib ko'rishingiz mumkin."
                                        : currentPrompt.prepSeconds && currentPrompt.prepSeconds > 0
                                        ? `Tugmani bosing. Sizga ${currentPrompt.prepSeconds} soniya tayyorgarlik beriladi, so‘ng yozuv boshlanadi.`
                                        : autoStart
                                            ? "Yozuv avtomatik boshlanadi. Qayta yozish kerak bo‘lsa tugmani bosing."
                                            : "Tugmani bosing va aniq talaffuz bilan javobingizni gapiring."}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="w-full flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                <AlertCircle className="size-4 shrink-0 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM NAV */}
            <div className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-white px-4">
                <button
                    type="button"
                    onClick={() => onSelectIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0 || recording || preparing || uploading}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground/80 hover:bg-background disabled:opacity-40 transition"
                >
                    <ChevronLeft className="size-4" />
                    Oldingi savol
                </button>

                <span className="text-xs font-semibold text-muted-foreground">
                    {currentIndex + 1} / {prompts.length}
                </span>

                <button
                    type="button"
                    onClick={() => onSelectIndex(Math.min(prompts.length - 1, currentIndex + 1))}
                    disabled={currentIndex === prompts.length - 1 || recording || preparing || uploading}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground/80 hover:bg-background disabled:opacity-40 transition"
                >
                    Keyingi savol
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    )
}
