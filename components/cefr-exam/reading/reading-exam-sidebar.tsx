"use client"

import { useMemo, useState } from "react"
import { CheckCheck, Clock, Flag, ListOrdered, Menu, Video, X } from "lucide-react"
import { CameraFeed } from "@/components/exam-prep/camera-feed"
import type { NavGroup } from "@/components/cefr-exam/reading/reading-finish-modal"

interface ExamSidebarProps {
    cameraEnabled?: boolean
    currentQuestion: number
    totalQuestions: number
    answered: Record<number, boolean>
    groups: NavGroup[]
    timeLeft: string
    isLowTime?: boolean
    onSelectQuestion: (q: number) => void
    onFinish: () => void
}

/** Referensdagi `.mini-card` */
function MiniCard({ icon: Icon, title, right, children, className = "" }: {
    icon: typeof Clock
    title: string
    right?: React.ReactNode
    children?: React.ReactNode
    className?: string
}) {
    return (
        <section className={`overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${className}`}>
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 font-semibold text-foreground ${children ? "border-b border-border" : ""}`}>
                <Icon className="size-4 shrink-0 text-foreground" />
                <span className="flex-1">{title}</span>
                {right}
            </div>
            {children}
        </section>
    )
}

export default function ReadingExamSidebar({
    currentQuestion, totalQuestions, answered, groups, timeLeft, isLowTime = false, cameraEnabled = false,
    onSelectQuestion, onFinish,
}: ExamSidebarProps) {
    const [isOpen, setIsOpen] = useState(false) // mobil bottom-sheet
    const doneCount = Object.values(answered).filter(Boolean).length

    // Barcha qismlardagi savollar bitta ro'yxatga birlashtiriladi (1..35), qism sarlavhalarisiz.
    const allNumbers = useMemo(
        () => Array.from(new Set(groups.flatMap((g) => g.numbers))).sort((a, b) => a - b),
        [groups],
    )

    // Eslatma: bu komponent emas, oddiy funksiya — aks holda har renderda remount bo'lib,
    // navigator scroll holati yo'qoladi.
    const renderContent = () => (
        <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Vaqt */}
            <section className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-colors ${isLowTime ? "border-red-200 bg-red-50" : "border-border bg-white"}`}>
                <Clock className={`size-4 shrink-0 ${isLowTime ? "text-red-500" : "text-foreground"}`} />
                <span className="font-semibold text-foreground">Vaqt</span>
                <span
                    className={`ml-auto text-lg font-bold tabular-nums ${isLowTime ? "animate-pulse text-red-600" : "text-foreground"}`}
                    aria-live="off"
                >
                    {timeLeft}
                </span>
            </section>

            {/* Yakunlash */}
            <section className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <Flag className="size-4 shrink-0 text-foreground" />
                <button
                    type="button"
                    onClick={onFinish}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-foreground to-foreground py-2 font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/25 active:translate-y-px"
                >
                    <CheckCheck className="size-4" /> Yakunlash
                </button>
            </section>

            {/* Savollar */}
            <MiniCard
                icon={ListOrdered}
                title="Savollar"
                right={
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
                        {doneCount}/{totalQuestions}
                    </span>
                }
                className="flex min-h-0 flex-col"
            >
                <div className="min-h-0 overflow-y-auto p-3">
                    {/* 5 ustun: 35 savol = 7 qator */}
                    <div className="grid grid-cols-5 gap-2">
                        {allNumbers.map((q) => {
                            const isActive = q === currentQuestion
                            const isDone = !!answered[q]
                            return (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => {
                                        onSelectQuestion(q)
                                        setIsOpen(false)
                                    }}
                                    aria-label={`${q}-savol${isDone ? ", javob berilgan" : ""}`}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`flex h-9 min-w-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-semibold tabular-nums transition-all duration-200
                                        hover:-translate-y-px hover:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/25 active:scale-95
                                        ${isActive
                                            ? "border-foreground bg-foreground text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                                            : isDone
                                                ? "border-emerald-500/40 bg-emerald-500/[0.18] text-emerald-700"
                                                : "border-border-strong bg-transparent text-[#374151]"}`}
                                >
                                    {q}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </MiniCard>

            {/* Kuzatuv */}
            <MiniCard icon={Video} title="Kuzatuv" className="hidden shrink-0 lg:block">
                <div className="p-3">
                    <CameraFeed enabled={cameraEnabled} fallbackText={cameraEnabled ? "Kamera mavjud emas yoki ruxsat berilmagan" : "Practice rejimida kamera talab qilinmaydi"} className="aspect-video w-full rounded-lg border border-border" />
                </div>
            </MiniCard>
        </div>
    )

    return (
        <>
            {/* MOBIL: chapda vaqt + navigator, o'ngda "Yakunlash" (referensdagi .fab-finish) */}
            {!isOpen && (
                <>
                    <div className="fixed bottom-4 left-3 z-[60] flex items-center gap-2.5 rounded-full border border-border bg-white/95 py-1.5 pl-3.5 pr-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden">
                        <Clock size={15} className={isLowTime ? "text-red-500" : "text-foreground"} />
                        <span className={`text-sm font-bold tabular-nums ${isLowTime ? "text-red-600" : "text-foreground"}`}>{timeLeft}</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            aria-label="Savollar ro'yxatini ochish"
                            className="flex size-9 items-center justify-center rounded-full bg-[#E4F70A] text-foreground transition-transform active:scale-90"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onFinish}
                        className="fixed bottom-4 right-3 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-br from-foreground to-foreground px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:brightness-105 active:translate-y-px lg:hidden"
                    >
                        <CheckCheck className="size-4" /> Yakunlash
                    </button>
                </>
            )}

            <aside
                className={`fixed inset-x-0 bottom-0 z-[100] flex h-[85vh] shrink-0 flex-col rounded-t-[28px] border-t border-border bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.12)] transition-transform duration-300
                    lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-[260px] lg:translate-y-0 lg:rounded-none lg:border-t-0 lg:bg-transparent lg:py-3 lg:pr-3 lg:shadow-none
                    ${isOpen ? "translate-y-0" : "translate-y-full"}`}
            >
                {/* Mobil handle */}
                <div className="flex flex-col items-center pb-1 pt-3 lg:hidden">
                    <div className="mb-2 h-1.5 w-12 rounded-full bg-border-strong" />
                    <div className="flex w-full items-center justify-between px-5 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">Savollar</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Yopish"
                            className="rounded-full bg-border/70 p-1.5 text-muted-foreground transition active:scale-90"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 p-4 lg:p-0">{renderContent()}</div>
            </aside>

            {isOpen && (
                <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-[90] bg-foreground/60 backdrop-blur-sm lg:hidden" />
            )}
        </>
    )
}