"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
    ChevronLeft,
    ChevronRight,
    CaseSensitive,
    FileText,
    CheckCircle2,
    Info,
    AlignLeft,
} from "lucide-react"
import type { WritingTask } from "@/lib/api/types"

interface WritingExamContentProps {
    tasks: WritingTask[]
    activeTaskIndex: number
    onSelectTask: (index: number) => void
    answers: Record<number, string>
    onAnswer: (taskId: number, text: string) => void
    fontSize?: number
    onIncreaseFontSize?: () => void
    onDecreaseFontSize?: () => void
}

function countWords(value: string) {
    return value.trim() ? value.trim().split(/\s+/).length : 0
}

const MIN_SPLIT_WIDTH = 30
const MAX_SPLIT_WIDTH = 70
const DEFAULT_SPLIT_WIDTH = 45

export default function WritingExamContent({
    tasks,
    activeTaskIndex,
    onSelectTask,
    answers,
    onAnswer,
    fontSize = 17,
    onIncreaseFontSize,
    onDecreaseFontSize,
}: WritingExamContentProps) {
    const [splitWidth, setSplitWidth] = useState(DEFAULT_SPLIT_WIDTH)
    const [isResizing, setIsResizing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const activeTask = tasks[activeTaskIndex]
    const currentTaskId = activeTask?.id ?? activeTaskIndex
    const currentValue = answers[currentTaskId] || ""
    const currentWords = useMemo(() => countWords(currentValue), [currentValue])

    const minWords = useMemo(() => {
        if (!activeTask?.word_limit) return null
        if (typeof activeTask.word_limit === "object") return activeTask.word_limit.min
        return null
    }, [activeTask])

    const maxWords = useMemo(() => {
        if (!activeTask?.word_limit) return null
        if (typeof activeTask.word_limit === "object") return activeTask.word_limit.max
        if (typeof activeTask.word_limit === "number") return activeTask.word_limit
        return null
    }, [activeTask])

    const isTaskDone = useCallback(
        (task: WritingTask, index: number) => {
            const tId = task.id ?? index
            const text = answers[tId] || ""
            return text.trim().length > 0
        },
        [answers]
    )

    // Resizing
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    useEffect(() => {
        if (!isResizing) return
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const offsetX = e.clientX - rect.left
            const pct = (offsetX / rect.width) * 100
            setSplitWidth(Math.min(MAX_SPLIT_WIDTH, Math.max(MIN_SPLIT_WIDTH, pct)))
        }
        const handleMouseUp = () => setIsResizing(false)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isResizing])

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* TOP BAR / TABS & CONTROLS */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-white px-4">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {tasks.map((task, idx) => {
                        const active = idx === activeTaskIndex
                        const done = isTaskDone(task, idx)
                        return (
                            <button
                                key={task.id ?? idx}
                                onClick={() => onSelectTask(idx)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    active
                                        ? "bg-foreground text-white shadow-sm"
                                        : done
                                        ? "bg-[#E4F70A] text-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-border"
                                }`}
                            >
                                <FileText className="size-3.5" />
                                <span>{idx + 1}-topshiriq</span>
                                {done && <CheckCircle2 className="size-3" />}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Shrift:</span>
                    <button
                        onClick={onDecreaseFontSize}
                        disabled={fontSize <= 13}
                        className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                        title="Shriftni kichraytirish"
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
                        title="Shriftni kattalashtirish"
                    >
                        A+
                    </button>
                </div>
            </div>

            {/* SPLIT CONTAINER */}
            <div ref={containerRef} className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden relative">
                {/* LEFT PANE: TASK PROMPT / INSTRUCTIONS */}
                <div
                    style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${splitWidth}%` : "100%" }}
                    className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border bg-white overflow-y-auto p-5 sm:p-6"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                                Topshiriq {activeTaskIndex + 1}
                            </span>
                            {maxWords && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/80">
                                    <AlignLeft className="size-3" />
                                    {minWords ? `${minWords}–${maxWords}` : `Maksimum ${maxWords}`} ta so&apos;z
                                </span>
                            )}
                        </div>

                        {activeTask?.topic && (
                            <h2 className="text-lg font-bold text-foreground leading-snug">
                                {activeTask.topic}
                            </h2>
                        )}

                        {activeTask?.instruction && (
                            <div
                                className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap bg-background p-4 rounded-xl border border-border"
                                style={{ fontSize: `${fontSize - 1}px` }}
                            >
                                {activeTask.instruction}
                            </div>
                        )}

                        {activeTask?.context_text && (
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Matn / Ma&apos;lumot:
                                </span>
                                <div
                                    className="rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap shadow-sm"
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    {activeTask.context_text}
                                </div>
                            </div>
                        )}

                        {activeTask?.question && (
                            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 text-sm font-semibold text-amber-900 leading-relaxed">
                                {activeTask.question}
                            </div>
                        )}
                    </div>
                </div>

                {/* RESIZE HANDLE */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`hidden lg:flex w-2 items-center justify-center cursor-col-resize hover:bg-border-strong transition-colors ${
                        isResizing ? "bg-foreground" : "bg-border"
                    }`}
                >
                    <div className="h-8 w-0.5 rounded-full bg-muted-foreground" />
                </div>

                {/* RIGHT PANE: WRITING WORKSPACE */}
                <div
                    style={{
                        width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - splitWidth}%` : "100%",
                    }}
                    className="flex flex-1 min-h-0 flex-col bg-white overflow-hidden"
                >
                    {/* STATS BAR */}
                    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-foreground">
                                <span className="text-sm font-extrabold">{currentWords}</span> ta so&apos;z
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({currentValue.trim().length} belgi)
                            </span>
                        </div>

                        <div>
                            {minWords && currentWords < minWords ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                    Kamida {minWords} ta so&apos;z talab qilinadi
                                </span>
                            ) : minWords && currentWords >= minWords ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" /> Yetarli
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* ESSAY TEXTAREA */}
                    <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden flex flex-col">
                        <textarea
                            value={currentValue}
                            onChange={(e) => onAnswer(currentTaskId, e.target.value)}
                            placeholder="Javobingizni shu yerga yozing..."
                            style={{ fontSize: `${fontSize}px` }}
                            className="w-full flex-1 resize-none rounded-xl border border-border bg-[#FDFCFB] p-4 text-foreground leading-relaxed outline-none focus:border-foreground focus:ring-1 focus:ring-foreground shadow-inner transition font-sans"
                            spellCheck
                        />
                    </div>

                    {/* BOTTOM NAV */}
                    <div className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-white px-4">
                        <button
                            type="button"
                            onClick={() => onSelectTask(Math.max(0, activeTaskIndex - 1))}
                            disabled={activeTaskIndex === 0}
                            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground/80 hover:bg-background disabled:opacity-40 transition"
                        >
                            <ChevronLeft className="size-4" />
                            Oldingi topshiriq
                        </button>

                        <span className="text-xs font-semibold text-muted-foreground">
                            {activeTaskIndex + 1} / {tasks.length}
                        </span>

                        <button
                            type="button"
                            onClick={() => onSelectTask(Math.min(tasks.length - 1, activeTaskIndex + 1))}
                            disabled={activeTaskIndex === tasks.length - 1}
                            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground/80 hover:bg-background disabled:opacity-40 transition"
                        >
                            Keyingi topshiriq
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
