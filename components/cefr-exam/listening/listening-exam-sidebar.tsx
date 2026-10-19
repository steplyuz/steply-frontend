"use client"

import { useState } from "react"
import {
    CheckCheck, Circle, CircleCheck, Clock, Flag, ListOrdered, Menu,
    Minus, Plus, TextCursorInput, Video, Volume2, VolumeX, X,
} from "lucide-react"
import { CameraFeed } from "@/components/exam-prep/camera-feed"

export interface SidebarQuestion {
    id: string
    number: number
}

interface SidebarProps {
    cameraEnabled?: boolean
    /** Faqat joriy qismdagi savollar (referensdagidek). */
    questions: SidebarQuestion[]
    /** question id -> javob berilganmi */
    answered: Record<string, boolean>
    currentQuestion: number
    partNumber: number
    /** Zaxira qiymat: audio vaqti berilmaganda ko'rsatiladi. */
    timeLeft: string
    /**
     * UMUMIY audio vaqti (soniya), ListeningExamContent'ning onTimeUpdate(current, duration) qiymatlari.
     * Ikkalasi ham berilsa, "Vaqt" kartasi `duration - current` bo'yicha orqaga sanaydi.
     */
    audioCurrent?: number
    audioDuration?: number
    volume: number
    onSelectQuestion: (num: number) => void
    onFinish: () => void
    onIncreaseFontSize: () => void
    onDecreaseFontSize: () => void
    onVolumeChange: (val: number) => void
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

/** Oxirgi shuncha soniya qolganda taymer qizil bo'ladi */
const URGENT_SECONDS = 15

const formatClock = (totalSeconds: number) =>
    `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`

export default function ListeningExamSidebar({
    questions, answered, currentQuestion, partNumber, timeLeft, audioCurrent, audioDuration, volume, cameraEnabled = false,
    onSelectQuestion, onFinish, onIncreaseFontSize, onDecreaseFontSize, onVolumeChange,
}: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false) // mobil bottom-sheet
    const doneCount = questions.filter((q) => answered[q.id]).length

    // Butun audio bo'yicha orqaga sanash: qolgan soniyalar = duration - current
    const secondsLeft =
        audioDuration && audioDuration > 0 && audioCurrent != null
            ? Math.max(0, Math.ceil(audioDuration - audioCurrent))
            : null
    const shownTime = secondsLeft != null ? formatClock(secondsLeft) : timeLeft
    const isUrgent = secondsLeft != null && secondsLeft <= URGENT_SECONDS
    const timeColor = isUrgent ? "text-red-600" : "text-foreground"

    // Oddiy funksiya (komponent emas) — har renderda remount bo'lmasligi uchun.
    const renderContent = () => (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            {/* Vaqt */}
            <section className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <Clock className={`size-4 shrink-0 ${timeColor}`} />
                <span className={`font-semibold ${timeColor}`}>Vaqt</span>
                <span className={`ml-auto text-lg font-bold tabular-nums transition-colors ${timeColor} ${isUrgent ? "animate-pulse" : ""}`} aria-live="off">{shownTime}</span>
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

            {/* Matn hajmi */}
            <MiniCard
                icon={TextCursorInput}
                title="Matn hajmi"
                right={
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onDecreaseFontSize} aria-label="Matnni kichraytirish"
                            className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-[#374151] transition hover:border-foreground active:scale-95">
                            <Minus className="size-4" />
                        </button>
                        <button type="button" onClick={onIncreaseFontSize} aria-label="Matnni kattalashtirish"
                            className="flex size-8 items-center justify-center rounded-lg bg-[#E4F70A] text-foreground transition hover:brightness-105 active:scale-95">
                            <Plus className="size-4" />
                        </button>
                    </div>
                }
            />

            {/* Tovush */}
            <MiniCard
                icon={volume === 0 ? VolumeX : Volume2}
                title="Tovush"
                right={<span className="text-xs font-bold tabular-nums text-foreground">{volume}%</span>}
            >
                <div className="p-3">
                    <input
                        type="range" min={0} max={100} step={1} value={volume}
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        aria-label="Tovush balandligi"
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e5e7eb] accent-[#0B0B0D]"
                    />
                </div>
            </MiniCard>

            {/* Savollar — faqat joriy qism */}
            <MiniCard
                icon={ListOrdered}
                title="Savollar"
                right={
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
                        {doneCount}/{questions.length}
                    </span>
                }
                className="shrink-0"
            >
                <div className="p-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{partNumber}-qism</p>
                    <div className="flex flex-wrap gap-2">
                        {questions.map(({ id, number }) => {
                            const isActive = number === currentQuestion
                            const isDone = !!answered[id]
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => { onSelectQuestion(number); setIsOpen(false) }}
                                    aria-label={`${number}-savol${isDone ? ", javob berilgan" : ""}`}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`relative inline-flex h-[34px] min-w-10 items-center justify-center rounded-full border-[1.5px] pl-7 pr-2.5 text-[12.5px] font-semibold tabular-nums shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200
                                        hover:-translate-y-px hover:border-foreground hover:shadow-[0_6px_16px_rgba(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/25 active:scale-95
                                        ${isActive
                                            ? "border-foreground/40 bg-foreground/[0.12] text-foreground"
                                            : isDone
                                                ? "border-emerald-500/35 bg-emerald-500/[0.15] text-emerald-700"
                                                : "border-border-strong bg-transparent text-[#374151]"}`}
                                >
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2" aria-hidden>
                                        {isActive ? (
                                            <span className="block size-[14px] rounded-full border-[1.5px] border-foreground p-[3px]">
                                                <span className="block size-full rounded-full bg-foreground" />
                                            </span>
                                        ) : isDone ? (
                                            <CircleCheck className="size-[14px] text-emerald-600" />
                                        ) : (
                                            <Circle className="size-[14px] text-muted-foreground" />
                                        )}
                                    </span>
                                    {number}
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
            {/* MOBIL: chapda vaqt + menyu, o'ngda "Yakunlash" */}
            {!isOpen && (
                <>
                    <div className="fixed bottom-4 left-3 z-[60] flex items-center gap-2.5 rounded-full border border-border bg-white/95 py-1.5 pl-3.5 pr-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden">
                        <Clock size={15} className={timeColor} />
                        <span className={`text-sm font-bold tabular-nums transition-colors ${timeColor} ${isUrgent ? "animate-pulse" : ""}`}>{shownTime}</span>
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
                <div className="flex flex-col items-center pb-1 pt-3 lg:hidden">
                    <div className="mb-2 h-1.5 w-12 rounded-full bg-border-strong" />
                    <div className="flex w-full items-center justify-between px-5 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">Savollar</span>
                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Yopish"
                            className="rounded-full bg-border/70 p-1.5 text-muted-foreground transition active:scale-90">
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