"use client"

import { PenTool, Clock, Flag, User } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { resolveMediaUrl } from "@/lib/media"

interface WritingTopBarProps {
    title?: string
    timeLeft?: string | number | null
    isLowTime?: boolean
    onFinish?: () => void
}

function formatTime(value?: string | number | null) {
    if (value == null || value === "") return "--:--"
    if (typeof value === "number") {
        const total = Math.max(0, Math.floor(value))
        const h = Math.floor(total / 3600)
        const m = Math.floor((total % 3600) / 60)
        const s = total % 60
        const mm = String(m).padStart(2, "0")
        const ss = String(s).padStart(2, "0")
        return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
    }
    return value
}

export default function WritingTopBar({ title, timeLeft, isLowTime = false, onFinish }: WritingTopBarProps) {
    const { user } = useAuth()
    const photo = resolveMediaUrl(user?.profile?.avatar_url || (user as any)?.photo_url)
    const name = user?.profile?.full_name || (user as any)?.full_name || "Candidate"

    return (
        <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-white">
            <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
                {/* Chap: sarlavha */}
                <div
                    className="flex min-w-0 items-center gap-2.5 font-bold tracking-[0.3px] text-foreground"
                    title={title}
                >
                    <PenTool className="size-[18px] shrink-0 text-foreground" />
                    <span className="truncate">
                        <span className="hidden sm:inline">Yozish bo&apos;limi </span>(Writing)
                    </span>
                </div>

                {/* O'rta: timer */}
                <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors ${isLowTime ? "border-red-200 bg-red-50" : "border-border bg-background"
                        }`}
                >
                    <Clock className={`size-4 shrink-0 ${isLowTime ? "text-red-500" : "text-foreground"}`} />
                    <span
                        className={`text-base font-bold tabular-nums ${isLowTime ? "animate-pulse text-red-600" : "text-foreground"
                            }`}
                    >
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* O'ng: foydalanuvchi + yakunlash */}
                <div className="flex min-w-0 items-center justify-end gap-2">
                    <span className="hidden min-w-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[13.6px] text-muted-foreground md:inline-flex">
                        {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" className="size-5 shrink-0 rounded-full object-cover" />
                        ) : (
                            <User className="size-3.5 shrink-0" />
                        )}
                        <span className="max-w-[140px] truncate xl:max-w-[220px]" title={name}>
                            {name}
                        </span>
                    </span>

                    <button
                        type="button"
                        onClick={onFinish}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-black active:scale-[0.98] sm:text-sm"
                    >
                        <Flag className="size-4" />
                        <span className="hidden sm:inline">Yakunlash</span>
                    </button>
                </div>
            </div>
        </header>
    )
}