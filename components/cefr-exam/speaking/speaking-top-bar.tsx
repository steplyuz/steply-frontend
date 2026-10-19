"use client"

import { Mic, Group, User, Flag } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { resolveMediaUrl } from "@/lib/media"

interface SpeakingTopBarProps {
    title?: string
    currentPartName?: string
    onFinish?: () => void
    finishDisabled?: boolean
}

export default function SpeakingTopBar({ title, currentPartName = "Part 1", onFinish, finishDisabled = false }: SpeakingTopBarProps) {
    const { user } = useAuth()
    const photo = resolveMediaUrl(user?.profile?.avatar_url || (user as any)?.photo_url)
    const name = user?.profile?.full_name || (user as any)?.full_name || "Candidate"

    return (
        <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-white">
            <div className="grid h-14 grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
                <div className="flex min-w-0 items-center gap-2.5 font-bold tracking-[0.3px] text-foreground">
                    <Mic className="size-[18px] shrink-0 text-foreground" />
                    <span className="truncate">Gapirish bo&apos;limi (Speaking)</span>
                </div>

                <div
                    className="hidden max-w-[40vw] items-center gap-1.5 truncate rounded-full border border-border bg-background px-3 py-1.5 text-[13.6px] text-muted-foreground lg:inline-flex"
                    title={title}
                >
                    <Group className="size-3.5 shrink-0" />
                    <span className="truncate">{currentPartName}</span>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-2">
                    {onFinish && <button type="button" onClick={onFinish} disabled={finishDisabled} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"><Flag className="size-3.5" /><span className="hidden sm:inline">Yakunlash</span></button>}
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-[13.6px] text-muted-foreground">
                        {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" className="size-5 shrink-0 rounded-full object-cover" />
                        ) : (
                            <User className="size-3.5 shrink-0" />
                        )}
                        <span className="max-w-[160px] truncate sm:max-w-[260px]" title={name}>
                            {name}
                        </span>
                    </span>
                </div>
            </div>
        </header>
    )
}
