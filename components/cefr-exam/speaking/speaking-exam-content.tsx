"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Headphones, Loader2, Mic, RotateCcw, Volume2 } from "lucide-react"
import { resolveAudioUrl } from "@/lib/api"
import { getMicStream } from "@/components/exam/preflight"
import { PART_INSTRUCTIONS, PART_ORDER, type SpeakingPartKey } from "@/lib/speaking/instructions"
import { cancelExaminer, playChime, speakExaminer } from "@/lib/speaking/examiner"
import { formatClock } from '@/lib/format'

export interface SpeakingPromptItem {
    partId: string
    partKey: SpeakingPartKey
    partName: string
    questionId: string
    label: string
    text: string
    image?: string | string[] | null
    prepSeconds?: number
    answerSeconds?: number
    forPoints?: string[]
    againstPoints?: string[]
}

interface SpeakingExamContentProps {
    prompts: SpeakingPromptItem[]
    currentIndex: number
    /** Faqat avtomatik o'tishda chaqiriladi — foydalanuvchi qo'lda o'tolmaydi */
    onSelectIndex: (index: number) => void
    uploadedStatus: Record<string, boolean>
    /** Eski API bilan moslik uchun; ishlatilmaydi */
    audioUrls?: Record<string, string>
    onRecordComplete: (prompt: SpeakingPromptItem, file: File, audioUrl: string) => Promise<void>
    onAllDone?: () => void
    fontSize?: number
    onIncreaseFontSize?: () => void
    onDecreaseFontSize?: () => void
    onBusyChange?: (busy: boolean) => void
    /** Eski API bilan moslik uchun; oqim endi doim avtomatik */
    autoStart?: boolean
}

type Phase = "examiner" | "prep" | "chime" | "recording" | "saving" | "gap" | "done" | "error"

const BUSY_PHASES: Phase[] = ["examiner", "prep", "chime", "recording", "saving"]

function pickMimeType(): string {
    if (typeof MediaRecorder === "undefined") return ""
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]) {
        if (MediaRecorder.isTypeSupported(m)) return m
    }
    return ""
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function waitUntil(end: number, token: { alive: boolean }) {
    return new Promise<void>((resolve) => {
        const tick = () => {
            if (!token.alive || Date.now() >= end) return resolve()
            window.setTimeout(tick, 150)
        }
        tick()
    })
}

export default function SpeakingExamContent({
    prompts,
    currentIndex,
    onSelectIndex,
    uploadedStatus,
    onRecordComplete,
    onAllDone,
    fontSize = 17,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onBusyChange,
}: SpeakingExamContentProps) {
    const prompt = prompts[currentIndex]
    const key = prompt ? `${prompt.partId}-${prompt.questionId}` : ""

    const [phase, setPhase] = useState<Phase>("examiner")
    const [deadline, setDeadline] = useState<number | null>(null)
    const [now, setNow] = useState(() => Date.now())
    const [error, setError] = useState("")
    const [attempt, setAttempt] = useState(0)

    // Effekt ichida eng so'nggi props'ni o'qish uchun
    const latest = useRef({ prompts, currentIndex, onSelectIndex, uploadedStatus, onRecordComplete, onAllDone, onBusyChange })
    useEffect(() => {
        latest.current = { prompts, currentIndex, onSelectIndex, uploadedStatus, onRecordComplete, onAllDone, onBusyChange }
    })

    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const stopTimerRef = useRef<number | null>(null)

    const releaseAudio = useCallback(() => {
        if (stopTimerRef.current !== null) {
            window.clearTimeout(stopTimerRef.current)
            stopTimerRef.current = null
        }
        const rec = recorderRef.current
        recorderRef.current = null
        if (rec && rec.state !== "inactive") {
            try {
                rec.stop()
            } catch {}
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
    }, [])

    // Band holatini ota-ona sahifaga xabar qilish (yakunlashni bloklash uchun)
    useEffect(() => {
        latest.current.onBusyChange?.(BUSY_PHASES.includes(phase))
    }, [phase])

    // Tayyorgarlik/yozuv paytida sanoqni yangilash
    useEffect(() => {
        if (phase !== "prep" && phase !== "recording") return
        const id = window.setInterval(() => setNow(Date.now()), 200)
        return () => window.clearInterval(id)
    }, [phase])

    // ASOSIY OQIM: imtihonchi gapiradi -> (tayyorgarlik) -> signal -> avtomatik yozuv -> saqlash -> keyingi savol
    useEffect(() => {
        const current = latest.current
        const p = current.prompts[current.currentIndex]
        if (!p) return

        const token = { alive: true }
        const isLast = current.currentIndex >= current.prompts.length - 1
        const isFirstOfPart =
            current.currentIndex === 0 || current.prompts[current.currentIndex - 1].partKey !== p.partKey
        const k = `${p.partId}-${p.questionId}`

        const fail = (e: unknown) => {
            if (!token.alive) return
            releaseAudio()
            setError(e instanceof Error ? e.message : "Xatolik yuz berdi")
            setPhase("error")
        }

        const goNext = async () => {
            setPhase("gap")
            await wait(1500)
            if (!token.alive) return
            if (isLast) {
                setPhase("done")
                latest.current.onAllDone?.()
            } else {
                latest.current.onSelectIndex(current.currentIndex + 1)
            }
        }

        const recordAnswer = (seconds: number) =>
            new Promise<Blob | null>((resolve, reject) => {
                const stream = streamRef.current
                if (!stream) return reject(new Error("Mikrofon oqimi topilmadi"))
                const mime = pickMimeType()
                const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
                const chunks: BlobPart[] = []
                recorderRef.current = rec
                rec.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data)
                }
                rec.onerror = () => reject(new Error("Audio yozishda xatolik yuz berdi"))
                rec.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: rec.mimeType || "audio/webm" }) : null)
                setDeadline(Date.now() + seconds * 1000)
                setPhase("recording")
                rec.start(1000)
                stopTimerRef.current = window.setTimeout(() => {
                    if (rec.state === "recording") rec.stop()
                }, seconds * 1000)
            })

        const run = async () => {
            setError("")
            if (current.uploadedStatus[k]) {
                await goNext()
                return
            }
            try {
                streamRef.current = await getMicStream()
            } catch (e) {
                return fail(e)
            }
            if (!token.alive) return releaseAudio()

            // 1) Imtihonchi matnini ovozli o'qiydi
            setPhase("examiner")
            const script = [isFirstOfPart ? PART_INSTRUCTIONS[p.partKey].examinerEn : "", p.text]
                .filter(Boolean)
                .join(" ")
            await speakExaminer(script)
            if (!token.alive) return releaseAudio()

            // 2) Tayyorgarlik vaqti (agar bor bo'lsa)
            const prep = Math.max(0, Math.floor(p.prepSeconds ?? 0))
            if (prep > 0) {
                const end = Date.now() + prep * 1000
                setDeadline(end)
                setPhase("prep")
                await waitUntil(end, token)
                if (!token.alive) return releaseAudio()
            }

            // 3) "Gapirishni boshlang" signali
            setPhase("chime")
            await playChime()
            if (!token.alive) return releaseAudio()

            // 4) Avtomatik yozuv; vaqt tugasa o'zi to'xtaydi
            const answer = Math.max(5, Math.floor(p.answerSeconds ?? 30))
            const blob = await recordAnswer(answer)
            releaseAudio()
            if (!token.alive) return
            if (!blob || blob.size === 0) throw new Error("Audio yozuvi bo'sh. Qayta urinib ko'ring.")

            // 5) Saqlash, so'ng keyingi savolga avtomatik o'tish
            setPhase("saving")
            const ext = (blob.type || "").includes("ogg") ? "ogg" : "webm"
            const file = new File([blob], `${p.questionId}.${ext}`, { type: blob.type || "audio/webm" })
            await latest.current.onRecordComplete(p, file, URL.createObjectURL(blob))
            if (!token.alive) return
            await goNext()
        }

        run().catch(fail)

        return () => {
            token.alive = false
            cancelExaminer()
            releaseAudio()
        }
    }, [currentIndex, key, attempt, releaseAudio])

    const retry = () => {
        setError("")
        setAttempt((n) => n + 1)
    }

    if (!prompt) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-muted-foreground">
                Savol topilmadi
            </div>
        )
    }

    const partsStatus = PART_ORDER.map((code) => {
        const items = prompts.filter((p) => p.partKey === code)
        if (!items.length) return null
        const done = items.every((p) => uploadedStatus[`${p.partId}-${p.questionId}`])
        const state: "done" | "active" | "pending" = done ? "done" : prompt.partKey === code ? "active" : "pending"
        return { code, label: PART_INSTRUCTIONS[code].shortTitle, state }
    }).filter((x): x is NonNullable<typeof x> => x !== null)

    const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0
    const answered = prompts.filter((p) => uploadedStatus[`${p.partId}-${p.questionId}`]).length
    const images = (Array.isArray(prompt.image) ? prompt.image : prompt.image ? [prompt.image] : [])
        .filter((u): u is string => Boolean(u))

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* Vazifalar holati (namuna: Task / Status) */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-4 py-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {partsStatus.map((s) => (
                        <div
                            key={s.code}
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                                s.state === "active"
                                    ? "border-foreground bg-foreground text-white"
                                    : s.state === "done"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-border bg-background text-muted-foreground"
                            }`}
                        >
                            {s.state === "done" ? <CheckCircle2 className="size-3.5" /> : <Headphones className="size-3.5" />}
                            {s.label}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Shrift:</span>
                    <button
                        onClick={onDecreaseFontSize}
                        disabled={fontSize <= 13}
                        className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                    >
                        A-
                    </button>
                    <button
                        onClick={onIncreaseFontSize}
                        disabled={fontSize >= 26}
                        className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                    >
                        A+
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-5">
                    {/* Nomzod uchun yo'riqnoma */}
                    <div className="rounded-2xl border border-border bg-white px-5 py-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{PART_INSTRUCTIONS[prompt.partKey].title}. </span>
                        {PART_INSTRUCTIONS[prompt.partKey].candidateUz}
                    </div>

                    {/* Savol kartasi */}
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-extrabold text-foreground">
                                <Headphones className="size-3.5" />
                                {prompt.label}
                            </span>
                            {uploadedStatus[key] && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 className="size-3.5" /> Yozildi
                                </span>
                            )}
                        </div>

                        <div
                            className="font-bold text-foreground leading-relaxed whitespace-pre-wrap"
                            style={{ fontSize: `${fontSize + 1}px` }}
                        >
                            {prompt.text}
                        </div>

                        {images.length > 0 && (
                            <div className={`grid gap-3 pt-2 ${images.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                                {images.map((url, index) => (
                                    <img
                                        key={`${url}-${index}`}
                                        src={resolveAudioUrl(url)}
                                        alt={`Speaking topshirig'i rasmi ${index + 1}`}
                                        className="max-h-80 w-full rounded-xl border border-border object-contain shadow-sm"
                                    />
                                ))}
                            </div>
                        )}

                        {(prompt.forPoints?.length || prompt.againstPoints?.length) ? (
                            <div className="grid gap-3 pt-3 border-t border-border text-xs sm:grid-cols-2 sm:text-sm">
                                {prompt.forPoints && prompt.forPoints.length > 0 && (
                                    <div className="space-y-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5">
                                        <div className="font-bold text-emerald-900">Qo&apos;llab-quvvatlovchi fikrlar:</div>
                                        <ul className="list-disc space-y-1 pl-4 text-emerald-800">
                                            {prompt.forPoints.map((pt, i) => (
                                                <li key={i}>{pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {prompt.againstPoints && prompt.againstPoints.length > 0 && (
                                    <div className="space-y-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5">
                                        <div className="font-bold text-rose-900">Qarshi fikrlar:</div>
                                        <ul className="list-disc space-y-1 pl-4 text-rose-800">
                                            {prompt.againstPoints.map((pt, i) => (
                                                <li key={i}>{pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Holat paneli: avtomatik oqim */}
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
                        <PhaseBanner phase={phase} remaining={remaining} answerSeconds={prompt.answerSeconds ?? 30} prepSeconds={prompt.prepSeconds ?? 0} />

                        {phase === "error" && (
                            <>
                                <div className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                                    <span>{error}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={retry}
                                    className="flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-black"
                                >
                                    <RotateCcw className="size-4" />
                                    Qayta urinish
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Orqaga qaytish mumkin emas. Savollar va yozuv avtomatik almashadi.
                    </p>
                </div>
            </div>

            <div className="flex h-12 shrink-0 items-center justify-center border-t border-border bg-white px-4 text-xs font-semibold text-muted-foreground">
                Javoblar: {answered} / {prompts.length}
            </div>
        </div>
    )
}

function PhaseBanner({
    phase,
    remaining,
    answerSeconds,
    prepSeconds,
}: {
    phase: Phase
    remaining: number
    answerSeconds: number
    prepSeconds: number
}) {
    if (phase === "examiner") {
        return (
            <div className="flex flex-col items-center gap-3 py-4 text-sm font-semibold text-foreground/80">
                <Volume2 className="size-8 text-foreground" />
                Imtihonchi gapirmoqda...
                <p className="max-w-sm text-xs font-normal text-muted-foreground">Savolni diqqat bilan tinglang.</p>
            </div>
        )
    }
    if (phase === "prep") {
        return (
            <div className="flex w-full flex-col items-center gap-3 py-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tayyorgarlik vaqti</div>
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-[#C8FF00] bg-background text-3xl font-black tabular-nums text-foreground">
                    {remaining}
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                    Javobingizni rejalashtiring. Vaqt tugagach signal eshitiladi va yozuv avtomatik boshlanadi.
                </p>
                <span className="text-xs text-muted-foreground">Tayyorgarlik: {prepSeconds} soniya</span>
            </div>
        )
    }
    if (phase === "chime") {
        return (
            <div className="flex flex-col items-center gap-3 py-4 text-sm font-extrabold text-foreground">
                <Mic className="size-8 text-foreground" />
                Gapirishni boshlang
            </div>
        )
    }
    if (phase === "recording") {
        return (
            <div className="flex w-full flex-col items-center gap-4 py-2">
                <div className="flex h-12 items-center gap-1.5">
                    <span className="h-6 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:-0.3s]" />
                    <span className="h-10 w-1.5 animate-bounce rounded-full bg-red-600 [animation-delay:-0.15s]" />
                    <span className="h-12 w-1.5 animate-bounce rounded-full bg-red-500" />
                    <span className="h-8 w-1.5 animate-bounce rounded-full bg-red-600 [animation-delay:-0.2s]" />
                    <span className="h-5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:-0.35s]" />
                </div>
                <div className="flex items-center gap-2 text-sm font-extrabold text-red-600">
                    <span className="size-2.5 animate-ping rounded-full bg-red-600" />
                    Ovoz yozilmoqda
                </div>
                <div className="text-3xl font-black tabular-nums text-foreground">
                    {formatClock(remaining)}
                </div>
                <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-border">
                    <div
                        className="h-full bg-red-500 transition-[width] duration-200"
                        style={{ width: `${Math.max(0, Math.min(100, (remaining / answerSeconds) * 100))}%` }}
                    />
                </div>
            </div>
        )
    }
    if (phase === "saving") {
        return (
            <div className="flex flex-col items-center gap-3 py-4 text-sm font-semibold text-foreground/80">
                <Loader2 className="size-7 animate-spin text-foreground" />
                Javob saqlanmoqda...
            </div>
        )
    }
    if (phase === "gap") {
        return (
            <div className="flex flex-col items-center gap-3 py-4 text-sm font-semibold text-foreground/80">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                Keyingi savol tayyorlanmoqda...
            </div>
        )
    }
    if (phase === "done") {
        return (
            <div className="flex flex-col items-center gap-3 py-4 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="size-8" />
                Barcha javoblar yozildi. Yakunlash tugmasi orqali tasdiqlang.
            </div>
        )
    }
    return null
}
