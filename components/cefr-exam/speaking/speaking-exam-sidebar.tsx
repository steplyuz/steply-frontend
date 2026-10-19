"use client"

import { useState } from "react"
import { Mic, Headphones, CheckCircle2, Flag, Video, Menu, X, Circle } from "lucide-react"
import { CameraFeed } from "@/components/exam-prep/camera-feed"
import type { SpeakingPromptItem } from "./speaking-exam-content"

interface SpeakingExamSidebarProps {
    cameraEnabled?: boolean
    prompts: SpeakingPromptItem[]
    currentIndex: number
    onSelectIndex: (index: number) => void
    uploadedStatus: Record<string, boolean>
    onFinish: () => void
    busy?: boolean
}

function MiniCard({
    icon: Icon,
    title,
    right,
    children,
    className = "",
}: {
    icon: typeof Mic
    title: string
    right?: React.ReactNode
    children?: React.ReactNode
    className?: string
}) {
    return (
        <section
            className={`overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${className}`}
        >
            <div
                className={`flex items-center gap-2.5 px-3.5 py-2.5 font-semibold text-foreground ${
                    children ? "border-b border-border" : ""
                }`}
            >
                <Icon className="size-4 shrink-0 text-foreground" />
                <span className="flex-1 text-xs sm:text-sm">{title}</span>
                {right}
            </div>
            {children}
        </section>
    )
}

export default function SpeakingExamSidebar({
    prompts,
    currentIndex,
    onSelectIndex,
    uploadedStatus,
    onFinish,
    busy = false,
    cameraEnabled = false,
}: SpeakingExamSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    const uploadedCount = prompts.filter(
        (p) => uploadedStatus[`${p.partId}-${p.questionId}`]
    ).length

    // Group prompts by partKey
    const groups = [
        { key: "part_1_1", title: "Part 1.1 · Savol-javob" },
        { key: "part_1_2", title: "Part 1.2 · Rasm tasviri" },
        { key: "part_2", title: "Part 2 · Mavzu va savollar" },
        { key: "part_3", title: "Part 3 · Munozara" },
    ]

    const renderContent = () => (
        <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Status card */}
            <section className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <Headphones className="size-4 shrink-0 text-foreground" />
                <span className="font-semibold text-xs sm:text-sm text-foreground">Holat</span>
                <span className="ml-auto text-xs sm:text-sm font-extrabold text-foreground bg-muted px-2 py-0.5 rounded-md">
                    {uploadedCount} / {prompts.length} yuborildi
                </span>
            </section>

            {/* Camera Feed */}
            <MiniCard icon={Video} title="Kamera nazorati">
                <div className="p-2.5">
                    <CameraFeed enabled={cameraEnabled} fallbackText={cameraEnabled ? "Kamera mavjud emas yoki ruxsat berilmagan" : "Practice rejimida kamera talab qilinmaydi"} />
                </div>
            </MiniCard>

            {/* Questions Grid Matrix */}
            <MiniCard
                icon={Mic}
                title="Savollar ro'yxati"
                className="flex-1 min-h-0 flex flex-col"
            >
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {groups.map((group) => {
                        const groupPrompts = prompts
                            .map((p, idx) => ({ ...p, originalIndex: idx }))
                            .filter((p) => p.partKey === group.key)

                        if (!groupPrompts.length) return null

                        return (
                            <div key={group.key} className="space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 block px-1">
                                    {group.title}
                                </span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {groupPrompts.map((p) => {
                                        const active = p.originalIndex === currentIndex
                                        const done = uploadedStatus[`${p.partId}-${p.questionId}`]

                                        return (
                                            <button
                                                key={`${p.partId}-${p.questionId}`}
                                                type="button"
                                                onClick={() => {
                                                    if (busy) return
                                                    onSelectIndex(p.originalIndex)
                                                    setIsOpen(false)
                                                }}
                                                disabled={busy}
                                                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold border transition ${
                                                    active
                                                        ? "border-foreground bg-foreground text-white shadow-sm"
                                                        : done
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                        : "border-border bg-white text-foreground/80 hover:bg-muted"
                                                }`}
                                            >
                                                <span>{p.label.split("·").pop()?.trim() || `S${p.originalIndex + 1}`}</span>
                                                {done && <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </MiniCard>

            {/* Finish Button */}
            <button
                type="button"
                onClick={onFinish}
                disabled={busy}
                className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-black transition active:scale-[0.99]"
            >
                <Flag className="size-4" />
                <span>Imtihonni yakunlash</span>
            </button>
        </div>
    )

    return (
        <>
            <aside className="hidden h-full w-[280px] shrink-0 border-l border-border bg-background p-3 xl:w-[320px] lg:flex lg:flex-col">
                {renderContent()}
            </aside>

            {/* Mobile Open Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-white shadow-xl lg:hidden"
            >
                <Menu className="size-4" />
                <span>Savollar ({uploadedCount}/{prompts.length})</span>
            </button>

            {/* Mobile Bottom-sheet */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="max-h-[85vh] rounded-t-2xl bg-background p-4 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                            <span className="font-bold text-sm text-foreground">Speaking savollari</span>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-border">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
                    </div>
                </div>
            )}
        </>
    )
}
