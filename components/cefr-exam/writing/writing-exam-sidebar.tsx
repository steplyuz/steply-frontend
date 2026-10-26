"use client"

import { useState } from "react"
import { CheckCircle2, Menu, X } from "lucide-react"
import type { WritingTask } from "@/lib/api/types"

type ApiTask = WritingTask & {
    part_number?: number | null
    sub_part?: number | null
}

interface WritingExamSidebarProps {
    tasks: WritingTask[]
    activeTaskIndex: number
    onSelectTask: (index: number) => void
    answers: Record<number, string>
}

function taskLabel(task: WritingTask, idx: number) {
    const { part_number, sub_part } = task as ApiTask
    if (part_number != null && sub_part != null) return `${part_number}.${sub_part}`
    if (part_number != null) return `${part_number}`
    return `${idx + 1}`
}

export default function WritingExamSidebar({
    tasks,
    activeTaskIndex,
    onSelectTask,
    answers,
}: WritingExamSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    const renderButtons = () => (
        <div className="flex flex-col items-center gap-2.5">
            {tasks.map((task, idx) => {
                const active = idx === activeTaskIndex
                const tId = task.id ?? idx
                const isDone = (answers[tId] || "").trim().length > 0

                return (
                    <button
                        key={tId}
                        type="button"
                        onClick={() => {
                            onSelectTask(idx)
                            setIsOpen(false)
                        }}
                        className={`relative flex size-14 items-center justify-center rounded-lg border-2 text-base font-bold tabular-nums text-foreground transition ${active
                                ? "border-foreground bg-[#c8ff00] shadow-md"
                                : "border-border bg-white hover:bg-background"
                            }`}
                    >
                        {taskLabel(task, idx)}
                        {isDone && <CheckCircle2 className="absolute right-1 top-1 size-3 text-foreground" />}
                    </button>
                )
            })}
        </div>
    )

    return (
        <>
            {/* Desktop: markazda, bir-birining ostida */}
            <aside className="hidden h-full w-[100px] shrink-0 items-center justify-center border-l border-border bg-background p-3 lg:flex">
                {renderButtons()}
            </aside>

            {/* Mobile Open Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-[#c8ff00] px-4 py-2.5 text-xs font-bold text-foreground shadow-xl lg:hidden"
            >
                <Menu className="size-4" />
                <span className="tabular-nums">
                    {tasks[activeTaskIndex] ? taskLabel(tasks[activeTaskIndex], activeTaskIndex) : ""}
                </span>
            </button>

            {/* Mobile Bottom-sheet */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="flex flex-col rounded-t-2xl bg-background p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex justify-end">
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-border">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="pb-2">{renderButtons()}</div>
                    </div>
                </div>
            )}
        </>
    )
}