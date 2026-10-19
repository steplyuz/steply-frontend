"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, ClipboardList, Eye, Loader2, ThumbsUp } from "lucide-react"

export interface NavGroup {
    label: string
    numbers: number[]
}

interface ReadingFinishModalProps {
    groups: NavGroup[]
    answered: Record<number, boolean>
    /** Savol raqami (virtual) -> kiritilgan javob matni */
    answerTexts: Record<number, string>
    isSubmitting: boolean
    onConfirm: () => void
    onCancel: () => void
    onJump: (virtualId: number) => void
}

export default function ReadingFinishModal({
    groups, answered, answerTexts, isSubmitting, onConfirm, onCancel, onJump,
}: ReadingFinishModalProps) {
    const [confirmed, setConfirmed] = useState(false)

    const total = groups.reduce((s, g) => s + g.numbers.length, 0)
    const done = groups.reduce((s, g) => s + g.numbers.filter((n) => answered[n]).length, 0)
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
            aria-labelledby="finish-title"
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
                        <ClipboardList className="size-6" />
                    </div>
                    <div>
                        <h2 id="finish-title" className="text-lg font-bold leading-tight">O&apos;qib tushunish bo&apos;limi</h2>
                        <p className="text-xs text-white/80">{done} / {total} savolga javob berildi</p>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 sm:p-8">
                    {left > 0 ? (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p><strong>{left} ta savol</strong> javobsiz qoldi. &quot;Ko&apos;rish&quot; tugmasi orqali savolga qaytishingiz mumkin.</p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                            <p>Barcha savollarga javob berildi.</p>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-background text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <th className="w-14 px-4 py-2.5">№</th>
                                    <th className="px-4 py-2.5">Javoblar</th>
                                    <th className="w-32 px-4 py-2.5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => (
                                    <GroupRows key={group.label} group={group} showLabel={groups.length > 1} answered={answered} answerTexts={answerTexts} onJump={onJump} />
                                ))}
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
                        O&apos;qib tushunish bo&apos;limini yakunlashni tasdiqlayman.
                    </label>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-[#f9fafb] p-5 sm:px-8">
                    <button
                        onClick={onConfirm}
                        disabled={!confirmed || isSubmitting}
                        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-foreground to-foreground px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
                        Tasdiqlayman
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-lg border border-border-strong bg-white px-6 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                        Yo&apos;q
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function GroupRows({ group, showLabel, answered, answerTexts, onJump }: {
    group: NavGroup
    showLabel: boolean
    answered: Record<number, boolean>
    answerTexts: Record<number, string>
    onJump: (n: number) => void
}) {
    return (
        <>
            {showLabel && (
                <tr>
                    <td colSpan={3} className="bg-foreground/10 px-4 py-2 text-center text-xs font-bold text-foreground">{group.label}</td>
                </tr>
            )}
            {group.numbers.map((n) => {
                const isDone = !!answered[n]
                return (
                    <tr key={n} className="border-t border-border">
                        <td className="px-4 py-2.5 font-bold tabular-nums text-foreground/80">{n}</td>
                        <td className="max-w-0 px-4 py-2.5">
                            <span className={`block truncate ${isDone ? "text-foreground" : "text-white/70"}`} title={answerTexts[n] || undefined}>
                                {isDone ? answerTexts[n] : "—"}
                            </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
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
                        </td>
                    </tr>
                )
            })}
        </>
    )
}
