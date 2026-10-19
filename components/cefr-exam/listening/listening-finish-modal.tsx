"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye, Loader2, ThumbsUp } from "lucide-react"
import type { ListeningPart, ListeningQuestion } from "@/lib/cefr-types/listening"

interface ListeningFinishModalProps {
    parts: ListeningPart[]
    /** question id -> kiritilgan javob */
    answers: Record<string, string>
    activePartIndex: number
    isSubmitting: boolean
    onConfirm: () => void
    onCancel: () => void
    /** Faqat joriy qismdagi savolga o'tish mumkin (audio qismga bog'langan). */
    onJump: (questionNumber: number) => void
}

/** Javobni ko'rsatish uchun: variant bo'lsa — matni, aks holda kiritilgan qiymat. */
function answerText(part: ListeningPart, q: ListeningQuestion, value: string | undefined): string {
    const v = (value || "").trim()
    if (!v) return ""
    const opts = q.options && q.options.length ? q.options : part.options || []
    const opt = opts.find((o) => o.value === v)
    if (opt && opt.label && opt.label !== opt.value) return `${opt.value} — ${opt.label}`
    return v
}

/** Referensdagi "Finish Section" oynasi (Modal12345) */
export default function ListeningFinishModal({
    parts, answers, activePartIndex, isSubmitting, onConfirm, onCancel, onJump,
}: ListeningFinishModalProps) {
    const [confirmed, setConfirmed] = useState(false)

    const all = parts.flatMap((p) => p.questions)
    const total = all.length
    const done = all.filter((q) => (answers[String(q.id)] || "").trim() !== "").length
    const left = total - done

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSubmitting) onCancel() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onCancel, isSubmitting])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="listening-finish-title"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
            onClick={() => { if (!isSubmitting) onCancel() }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center gap-3 bg-gradient-to-br from-foreground to-foreground p-6 text-white">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
                        <ClipboardCheck className="size-6" />
                    </div>
                    <div>
                        <h2 id="listening-finish-title" className="text-lg font-bold leading-tight">Tinglab tushunish bo&apos;limi</h2>
                        <p className="text-xs text-white/80">{done} / {total} savolga javob berildi</p>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 sm:p-8">
                    {left > 0 ? (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p>
                                <strong>{left} ta savol</strong> javobsiz qoldi. Joriy qismdagi savolga &quot;Ko&apos;rish&quot; orqali qaytishingiz mumkin.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                            <p>Barcha savollarga javob berildi.</p>
                        </div>
                    )}

                    <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-background text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <th className="w-14 px-4 py-2.5">№</th>
                                    <th className="px-4 py-2.5">Javoblar</th>
                                    <th className="w-32 px-4 py-2.5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.map((part, pIdx) => {
                                    const isActive = pIdx === activePartIndex
                                    return (
                                        <PartRows
                                            key={part.id ?? pIdx}
                                            part={part}
                                            label={`${part.partNumber || pIdx + 1}-qism`}
                                            showLabel={parts.length > 1}
                                            canJump={isActive}
                                            answers={answers}
                                            onJump={onJump}
                                        />
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <label className="flex cursor-pointer select-none items-center justify-center gap-3 rounded-xl border-2 border-[#fbbf24] bg-gradient-to-br from-[#fef3c7] to-[#fde68a] p-4 text-sm font-bold text-[#92400e] transition hover:brightness-[0.98]">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="size-4 accent-[#0B0B0D]"
                        />
                        Bo&apos;limni yakunlashni tasdiqlayman.
                    </label>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-[#f9fafb] p-5 sm:px-8">
                    <button
                        onClick={onConfirm}
                        disabled={!confirmed || isSubmitting}
                        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-foreground to-foreground px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
                        Tasdiqlash
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-lg border border-border-strong bg-white px-6 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                        Bekor qilish
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function PartRows({ part, label, showLabel, canJump, answers, onJump }: {
    part: ListeningPart
    label: string
    showLabel: boolean
    canJump: boolean
    answers: Record<string, string>
    onJump: (n: number) => void
}) {
    return (
        <>
            {showLabel && (
                <tr>
                    <td colSpan={3} className="bg-foreground/10 px-4 py-2 text-center text-xs font-bold text-foreground">{label}</td>
                </tr>
            )}
            {part.questions.map((q) => {
                const n = Number(q.questionNumber)
                const text = answerText(part, q, answers[String(q.id)])
                const isDone = text !== ""
                return (
                    <tr key={q.id} className="border-t border-border">
                        <td className="px-4 py-2.5 font-bold tabular-nums text-foreground/80">{n}</td>
                        <td className="max-w-0 px-4 py-2.5">
                            <span className={`block truncate ${isDone ? "text-foreground" : "text-white/70"}`} title={text || undefined}>
                                {isDone ? text : "—"}
                            </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                            {canJump ? (
                                <button
                                    onClick={() => onJump(n)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                                        isDone
                                            ? "border-foreground/30 text-foreground hover:bg-foreground/10"
                                            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    }`}
                                >
                                    {isDone ? <CheckCircle2 className="size-3.5" /> : <Eye className="size-3.5" />}
                                    Ko&apos;rish
                                </button>
                            ) : (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isDone ? "text-foreground" : "text-amber-700"}`}>
                                    {isDone ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                                    {isDone ? "Javob berilgan" : "Javobsiz"}
                                </span>
                            )}
                        </td>
                    </tr>
                )
            })}
        </>
    )
}
