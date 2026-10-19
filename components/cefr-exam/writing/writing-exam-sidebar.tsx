"use client"

import { useState } from "react"
import { Clock, FileText, CheckCircle2, Flag, Menu, X } from "lucide-react"
import type { WritingTask } from "@/lib/api/types"

interface WritingExamSidebarProps {
    tasks: WritingTask[]
    activeTaskIndex: number
    onSelectTask: (index: number) => void
    answers: Record<number, string>
    timeLeft: string
    isLowTime?: boolean
    onFinish: () => void
}

function MiniCard({
    icon: Icon,
    title,
    right,
    children,
    className = "",
}: {
    icon: typeof Clock
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

function countWords(value: string) {
    return value.trim() ? value.trim().split(/\s+/).length : 0
}

export default function WritingExamSidebar({
    tasks,
    activeTaskIndex,
    onSelectTask,
    answers,
    timeLeft,
    isLowTime = false,
    onFinish,
}: WritingExamSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    const completedCount = tasks.filter((t, i) => {
        const text = answers[t.id ?? i] || ""
        return text.trim().length > 0
    }).length

    const renderContent = () => (
        <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Time Card */}
            <section
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-colors ${
                    isLowTime ? "border-red-200 bg-red-50" : "border-border bg-white"
                }`}
            >
                <Clock className={`size-4 shrink-0 ${isLowTime ? "text-red-500" : "text-foreground"}`} />
                <span className="font-semibold text-xs sm:text-sm text-foreground">Vaqt</span>
                <span
                    className={`ml-auto text-base sm:text-lg font-bold tabular-nums ${
                        isLowTime ? "animate-pulse text-red-600" : "text-foreground"
                    }`}
                >
                    {timeLeft}
                </span>
            </section>

            {/* Tasks Navigation Matrix */}
            <MiniCard
                icon={FileText}
                title="Topshiriqlar"
                right={
                    <span className="text-[11px] font-bold text-muted-foreground">
                        {completedCount}/{tasks.length} yozildi
                    </span>
                }
                className="flex-1 min-h-0 flex flex-col"
            >
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {tasks.map((task, idx) => {
                        const active = idx === activeTaskIndex
                        const tId = task.id ?? idx
                        const text = answers[tId] || ""
                        const words = countWords(text)
                        const isDone = text.trim().length > 0

                        return (
                            <button
                                key={tId}
                                onClick={() => {
                                    onSelectTask(idx)
                                    setIsOpen(false)
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                    active
                                        ? "border-foreground bg-background ring-1 ring-foreground"
                                        : "border-border hover:border-border-strong bg-white"
                                }`}
                            >
                                <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-foreground">
                                            {idx + 1}-topshiriq
                                        </span>
                                        {isDone && <CheckCircle2 className="size-3.5 text-emerald-600" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                        {task.topic || task.instruction?.slice(0, 30)}
                                    </p>
                                </div>
                                <span className="text-xs font-extrabold tabular-nums shrink-0 text-foreground/80 bg-muted px-2 py-0.5 rounded-md">
                                    {words} so&apos;z
                                </span>
                            </button>
                        )
                    })}
                </div>
            </MiniCard>

            {/* Finish Button */}
            <button
                type="button"
                onClick={onFinish}
                className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-black transition active:scale-[0.99]"
            >
                <Flag className="size-4" />
                <span>Imtihonni yakunlash</span>
            </button>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
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
                <span>Panel ({timeLeft})</span>
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
                            <span className="font-bold text-sm text-foreground">Imtihon ma&apos;lumotlari</span>
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
