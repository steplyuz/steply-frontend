"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, ClipboardList, Eye, Loader2, ThumbsUp } from "lucide-react"
import type { WritingTask } from "@/lib/api/types"

interface WritingFinishModalProps {
    tasks: WritingTask[]
    answers: Record<number, string>
    isSubmitting: boolean
    onConfirm: () => void
    onCancel: () => void
    onJump: (index: number) => void
}

function countWords(value: string) {
    return value.trim() ? value.trim().split(/\s+/).length : 0
}

export default function WritingFinishModal({
    tasks,
    answers,
    isSubmitting,
    onConfirm,
    onCancel,
    onJump,
}: WritingFinishModalProps) {
    const [confirmed, setConfirmed] = useState(false)

    const total = tasks.length
    const done = tasks.filter((t, i) => (answers[t.id ?? i] || "").trim().length > 0).length
    const left = total - done

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) onCancel()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onCancel, isSubmitting])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="writing-finish-title"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
            onClick={() => {
                if (!isSubmitting) onCancel()
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center gap-3 bg-foreground p-6 text-white">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                        <ClipboardList className="size-6 text-[#E4F70A]" />
                    </div>
                    <div>
                        <h2 id="writing-finish-title" className="text-lg font-bold leading-tight">
                            Yozish bo&apos;limi (Writing)
                        </h2>
                        <p className="text-xs text-white/80">
                            {done} / {total} topshiriqqa javob yozildi
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {left > 0 ? (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900">
                            <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-bold">
                                    {left} ta topshiriq javobsiz qolgan.
                                </p>
                                <p className="mt-1 text-amber-800 text-xs">
                                    Davom etsangiz, javobsiz topshiriqlar bo&apos;sh javob sifatida saqlanadi.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                            <p className="font-semibold text-xs sm:text-sm">
                                Barcha topshiriqlar uchun javoblar kiritildi!
                            </p>
                        </div>
                    )}

                    {/* Tasks Table */}
                    <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-background text-foreground/80 font-bold border-b border-border">
                                <tr>
                                    <th className="p-3">Topshiriq</th>
                                    <th className="p-3">So&apos;zlar soni</th>
                                    <th className="p-3">Holat</th>
                                    <th className="p-3 text-right">O&apos;tish</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tasks.map((task, idx) => {
                                    const text = answers[task.id ?? idx] || ""
                                    const words = countWords(text)
                                    const isDone = text.trim().length > 0

                                    return (
                                        <tr key={task.id ?? idx} className="hover:bg-background transition-colors">
                                            <td className="p-3 font-semibold text-foreground">
                                                {idx + 1}-topshiriq
                                                <p className="text-[11px] font-normal text-muted-foreground truncate max-w-[200px]">
                                                    {task.topic || task.instruction?.slice(0, 30)}
                                                </p>
                                            </td>
                                            <td className="p-3 font-bold tabular-nums text-foreground">
                                                {words} ta so&apos;z
                                            </td>
                                            <td className="p-3">
                                                {isDone ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                                        <CheckCircle2 className="size-3" /> Tayyor
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                                        Kutilmoqda
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onJump(idx)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
                                                >
                                                    <Eye className="size-3.5" />
                                                    Ko&apos;rish
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground/80 cursor-pointer select-none hover:bg-muted transition">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="size-4 rounded border-border-strong text-foreground focus:ring-foreground"
                        />
                        <span>
                            Topshirgan javoblarimni tekshirdim va bo&apos;limni yakunlashga roziman.
                        </span>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border bg-background p-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-xl border border-border-strong px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground/80 hover:bg-muted transition disabled:opacity-50"
                    >
                        Davom etish
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!confirmed || isSubmitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground hover:bg-black px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition disabled:opacity-40"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" /> Yuborilmoqda...
                            </>
                        ) : (
                            <>
                                <ThumbsUp className="size-4" /> Yakunlash va yuborish
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
