"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Check, CheckCircle2, CircleHelp, FileQuestion, FileText, Folder, FolderOpen, HelpCircle, Highlighter, Info, ListChecks, ListTree, TextCursorInput, Trash2, CaseSensitive, SquareCheckBig, TriangleAlert } from "lucide-react"
import QuestionRenderer, { GapFillFillRenderer } from "@/components/cefr-exam/reading/reading-question-renderer"
import HighlightText, { type TextHighlight } from "@/components/highlight-text"
import { resolveAssetUrl } from "@/lib/api/config"
import type { ReadingExam, Question } from "@/lib/cefr-types/reading"

interface ReadingExamContentProps {
    examData: ReadingExam
    currentQuestion: number
    /** Ishlatilmaydi (javoblar `answers`dan hisoblanadi). Eski parent'lar uchun ixtiyoriy qoldirildi. */
    answered?: Record<number, boolean>
    answers: Record<number, string>
    onAnswer: (questionId: number, value: string) => void
    onSelectQuestion: (dbId: number) => void
    fontSize?: number
    revMap?: Record<number, number>
    onIncreaseFontSize?: () => void
    onDecreaseFontSize?: () => void
    onPrev?: () => void
    onNext?: () => void
    canPrev?: boolean
    canNext?: boolean
    currentNumber?: number
    totalQuestions?: number
}

// highlight-text.tsx dagi qat'iy tip: { id, start, end, color }
type Highlight = TextHighlight

// Referensdagi ranglar: Red / Green / Yellow. "transparent" — o'chirgich rejimi.
const HIGHLIGHT_COLORS = [
    { value: "#ff0000", label: "Red" },
    { value: "#00ff00", label: "Green" },
    { value: "#ffff00", label: "Yellow" },
]

const MIN_Q_WIDTH = 28
const MAX_Q_WIDTH = 70
const DEFAULT_Q_WIDTH = 42
const WIDTH_KEY = "reading-questions-width"

// Default `revMap = {}` har renderda YANGI obyekt bo'lib, useMemo'larni bekor qilardi: bitta doimiy obyekt.
const EMPTY_REV: Record<number, number> = {}

// Blank belgilari: ___, [30], {{30}}. Capture group split natijasida markerni ham saqlaydi.
const BLANK_SPLIT = /(_{2,}|\[\s*\d+\s*\]|\{\{\s*\d+\s*\}\})/
const NUMBERED_BLANK = /^(?:\[|\{\{)\s*(\d+)/

const isGapType = (t: string) => t === "GAP_FILL" || t === "GAP_FILL_FILL"

function isPartFiveForExam(examData: ReadingExam, partIndex: number): boolean {
    const part = examData.parts?.[partIndex]
    if (!part) return false
    if (examData.practice_part_number === 5 && examData.parts.length === 1) return true
    if (partIndex === 4 || /\bpart\s*5\b/i.test(String(part.title || ""))) return true
    const numbers = (part.questions || []).map((q) => Number(q.question_number || 0))
    return numbers.length > 0 && numbers.every((number) => number >= 30 && number <= 35)
}

/** Rasm: yuklanmasa aniq xabar chiqadi, bosilsa kattalashadi (Esc yoki bosish bilan yopiladi). */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false)
    const [zoom, setZoom] = useState(false)

    useEffect(() => setFailed(false), [src])

    useEffect(() => {
        if (!zoom) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoom(false) }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [zoom])

    if (failed) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                <div className="min-w-0 text-sm">
                    <p className="font-semibold">Rasm yuklanmadi. Administratorga xabar bering.</p>
                    <p className="mt-1 break-all text-xs opacity-70">{src}</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                onError={() => setFailed(true)}
                onClick={() => setZoom(true)}
                className="mx-auto max-h-[420px] max-w-full cursor-zoom-in rounded-xl border border-border object-contain"
            />
            {zoom && (
                <div className="fixed inset-0 z-[120] flex cursor-zoom-out items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
                </div>
            )}
        </>
    )
}

export default function ReadingExamContent({
    examData,
    currentQuestion,
    answers,
    onAnswer,
    onSelectQuestion,
    fontSize = 18,
    revMap = EMPTY_REV,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onPrev,
    onNext,
    canPrev = false,
    canNext = false,
    currentNumber,
    totalQuestions,
}: ReadingExamContentProps) {
    const [activePartIndex, setActivePartIndex] = useState(0)
    const [highlightsByPart, setHighlightsByPart] = useState<Record<number, Highlight[]>>({})
    const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[2].value)
    const [questionsWidth, setQuestionsWidth] = useState(DEFAULT_Q_WIDTH) // % — faqat lg+ da ishlaydi
    const [isResizing, setIsResizing] = useState(false)
    const [activeView, setActiveView] = useState<"passage" | "questions">("passage")
    const [colorOpen, setColorOpen] = useState(false)
    const colorRef = useRef<HTMLDivElement>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})
    const gapRefs = useRef<Record<number, HTMLInputElement | null>>({})
    const prevQuestionRef = useRef<number | null>(null)
    const widthRef = useRef(questionsWidth)
    widthRef.current = questionsWidth

    // Effect'lar examData identitetiga bog'lanib qolmasligi uchun (parent har renderda yangi obyekt bersa,
    // har bir harf kiritilganda scroll + fokus qayta ishlab ketardi).
    const examRef = useRef(examData)
    examRef.current = examData

    const currentPart = examData.parts?.[activePartIndex]
    const isPartFive = isPartFiveForExam(examData, activePartIndex)
    const currentHighlights = highlightsByPart[activePartIndex] || []
    // Part 5 da gap-fill javoblari o'ng panelda. Mini-testda (bitta part) ham ishlaydi.
    const partFiveHasGaps = isPartFive && !!currentPart?.questions.some((q) => isGapType(q.type))
    // Savol matni o'lchami: har joyda qayta hisoblamaslik uchun bitta qiymat
    const qTextSize = Math.min(Math.max(fontSize - 2, 14), 17)

    const isAnswered = useCallback(
        (id?: number) => {
            const v = answers[Number(id)]
            return !!v && v.trim() !== ""
        },
        [answers]
    )

    // Har bir qism bo'yicha statistika (tab'larda ko'rsatiladi)
    const partStats = useMemo(
        () =>
            (examData.parts ?? []).map((part) => {
                const total = part.questions.length
                const done = part.questions.filter((q) => isAnswered(q.id)).length
                const nums = part.questions.map((q) => revMap[Number(q.id)]).filter(Boolean)
                return {
                    total,
                    done,
                    complete: total > 0 && done === total,
                    from: nums.length ? Math.min(...nums) : null,
                    to: nums.length ? Math.max(...nums) : null,
                }
            }),
        [examData.parts, isAnswered, revMap]
    )

    // Matn ichidagi gap-fill joylashuvi. Faqat qism/matn/raqamlash o'zgarganda qayta hisoblanadi.
    const gapLayout = useMemo(() => {
        if (!currentPart || isPartFive) return null
        const text = currentPart.passage || ""
        const gapFillQs = currentPart.questions
            .filter((q) => isGapType(q.type))
            .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
        if (!text) return { text, gapFillQs, segments: [] as string[], offsets: [] as number[], assigned: [] as (Question | null)[], fallbackQuestions: gapFillQs }

        // tokens: [segment, marker, segment, marker, ..., segment]
        const tokens = text.split(BLANK_SPLIT)
        const segments: string[] = []
        const markers: string[] = []
        tokens.forEach((tk, i) => (i % 2 === 0 ? segments.push(tk) : markers.push(tk)))

        // Belgilash (highlight) uchun segmentning ASL matndagi boshlanish indeksi (haqiqiy marker uzunligi bilan).
        const offsets: number[] = []
        let acc = 0
        segments.forEach((seg, i) => {
            offsets.push(acc)
            acc += seg.length + (markers[i]?.length ?? 0)
        })

        // 1) Raqamli markerlar ([30], {{30}}) raqami bo'yicha savolga bog'lanadi
        // 2) "____" markerlar qolgan savollarga tartib bo'yicha bog'lanadi
        const used = new Set<number>()
        const assigned: (Question | null)[] = markers.map((m) => {
            const n = NUMBERED_BLANK.exec(m)?.[1]
            if (!n) return null
            const num = Number(n)
            const q = gapFillQs.find((x) => Number(x.question_number) === num) ?? gapFillQs.find((x) => revMap[Number(x.id)] === num)
            if (q) used.add(Number(q.id))
            return q ?? null
        })
        const remaining = gapFillQs.filter((q) => !used.has(Number(q.id)))
        let ri = 0
        markers.forEach((m, i) => {
            if (!NUMBERED_BLANK.test(m) && ri < remaining.length) {
                const q = remaining[ri++]
                assigned[i] = q
                used.add(Number(q.id))
            }
        })
        const fallbackQuestions = gapFillQs.filter((q) => !used.has(Number(q.id)))

        return { text, gapFillQs, segments, offsets, assigned, fallbackQuestions }
    }, [currentPart, isPartFive, revMap])

    // Joriy savol qaysi qismda bo'lsa, o'sha qismga o'tamiz.
    // Faqat currentQuestion o'zgarganda ishlaydi: qism tabini bosganda eski savol bilan "qaytarib yubormaydi".
    useEffect(() => {
        const parts = examRef.current.parts
        if (!parts) return
        const pIdx = parts.findIndex((p) => p.questions.some((q) => Number(q.id) === Number(currentQuestion)))
        if (pIdx !== -1) setActivePartIndex((prev) => (prev === pIdx ? prev : pIdx))
    }, [currentQuestion])

    useEffect(() => {
        setActiveView(partFiveHasGaps ? "questions" : "passage")
    }, [activePartIndex, partFiveHasGaps])

    // Savol tanlanganda: kartaga scroll / gap inputga fokus / mobilda mos ko'rinishga o'tish.
    // Birinchi render'da (mount) scroll qilmaymiz (oldingi qiymat solishtiriladi: StrictMode'da ham xavfsiz).
    useEffect(() => {
        if (prevQuestionRef.current === null) {
            prevQuestionRef.current = currentQuestion
            return
        }
        if (prevQuestionRef.current === currentQuestion) return
        prevQuestionRef.current = currentQuestion

        const exam = examRef.current
        const q = exam.parts.flatMap((p) => p.questions).find((x) => Number(x.id) === Number(currentQuestion))
        if (!q) return
        const id = Number(q.id)
        const qPartIndex = exam.parts.findIndex((part) => part.questions.some((item) => Number(item.id) === id))
        const qPartIsPartFive = qPartIndex >= 0 && isPartFiveForExam(exam, qPartIndex)
        const inlineGap = isGapType(q.type) && !qPartIsPartFive

        // Qism almashgan bo'lsa, DOM yangilanishini kutamiz
        const t = setTimeout(() => {
            if (inlineGap) {
                setActiveView("passage")
                const input = gapRefs.current[id]
                if (input && document.activeElement !== input) {
                    input.scrollIntoView({ behavior: "smooth", block: "center" })
                    input.focus({ preventScroll: true })
                }
            } else {
                setActiveView("questions")
                cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                const input = gapRefs.current[id]
                if (isGapType(q.type) && input && document.activeElement !== input) input.focus({ preventScroll: true })
            }
        }, 60)
        return () => clearTimeout(t)
    }, [currentQuestion])

    // Alt + ← / → : oldingi / keyingi savol. preventDefault brauzerning "orqaga/oldinga" harakatini to'sadi.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!e.altKey) return
            if (e.key === "ArrowRight" && canNext) { e.preventDefault(); onNext?.() }
            else if (e.key === "ArrowLeft" && canPrev) { e.preventDefault(); onPrev?.() }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [canNext, canPrev, onNext, onPrev])

    // Yangi highlight qo'shilganda eskilarning kesishgan qismi kesib tashlanadi (matn ikki marta chiqmasligi uchun).
    // "transparent" = o'chirgich: faqat kesib tashlaydi, yangi highlight qo'shmaydi.
    const handleAddHighlight = useCallback(
        (newHl: Highlight) => {
            setHighlightsByPart((prev) => {
                const list = prev[activePartIndex] || []
                const next: Highlight[] = []
                const uid = () => Math.random().toString(36).slice(2, 7)

                for (const h of list) {
                    if (h.end <= newHl.start || h.start >= newHl.end) {
                        next.push(h)
                        continue
                    }
                    if (h.start < newHl.start) next.push({ ...h, id: `hl-${uid()}`, end: newHl.start })
                    if (h.end > newHl.end) next.push({ ...h, id: `hl-${uid()}`, start: newHl.end })
                }

                if (newHl.color !== "transparent") next.push(newHl)

                return { ...prev, [activePartIndex]: next }
            })
        },
        [activePartIndex]
    )

    const handleRemoveHighlight = useCallback(
        (id: string) => {
            setHighlightsByPart((prev) => ({
                ...prev,
                [activePartIndex]: (prev[activePartIndex] || []).filter((h) => h.id !== id),
            }))
        },
        [activePartIndex]
    )

    const clearHighlights = () => setHighlightsByPart((prev) => ({ ...prev, [activePartIndex]: [] }))

    useEffect(() => {
        if (!colorOpen) return
        const onDown = (e: MouseEvent) => { if (!colorRef.current?.contains(e.target as Node)) setColorOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setColorOpen(false) }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [colorOpen])

    // --- Panel kengligini eslab qolish (faqat o'zgartirilganda yoziladi, mount'da emas) ---
    const saveWidth = (w: number) => {
        try { localStorage.setItem(WIDTH_KEY, String(Math.round(w))) } catch { /* private mode */ }
    }
    useEffect(() => {
        try {
            const v = Number(localStorage.getItem(WIDTH_KEY))
            if (v >= MIN_Q_WIDTH && v <= MAX_Q_WIDTH) setQuestionsWidth(v)
        } catch { /* ignore */ }
    }, [])

    // --- Resizer (pointer events) ---
    useEffect(() => {
        if (!isResizing) return
        const onMove = (e: PointerEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            const next = ((rect.right - e.clientX) / rect.width) * 100
            setQuestionsWidth(Math.min(MAX_Q_WIDTH, Math.max(MIN_Q_WIDTH, next)))
        }
        const onUp = () => {
            setIsResizing(false)
            saveWidth(widthRef.current)
        }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }
    }, [isResizing])

    // Qismlar bo'sh bo'lsa (backend xatosi) crash o'rniga hech narsa ko'rsatmaymiz
    if (!currentPart) return null

    // "(30) ____ is ..." ko'rinishidagi savol matnini [oldin, keyin] ga ajratadi
    const splitQuestionText = (text?: string) => {
        const [before = "", ...rest] = String(text || "").split(/(?:\(\d+\)\s*)?_{2,}/)
        return { before, after: rest.join(" "), hasGap: rest.length > 0 }
    }

    // Matn uchun umumiy stil: ingliz tilida bo'g'inlab ko'chirish (justify'da katta bo'shliqlar kamayadi)
    const passageClass = "select-text whitespace-pre-wrap text-justify font-serif leading-[2.1] text-foreground md:leading-[2.3]"
    const passageStyle = { fontSize: `${fontSize}px`, hyphens: "auto" as const, overflowWrap: "anywhere" as const }

    // Matnda joyi bo'lmagan gap-fill savollar: har biri o'z matni bilan input oladi.
    const renderGapList = (questions: Question[]) => (
        <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Gap filling — javoblarni yozing</p>
            <div className="space-y-3">
                {questions.map((q) => {
                    const qId = Number(q.id)
                    const displayNum = revMap[qId] ?? q.question_number
                    const { before, after, hasGap } = splitQuestionText(q.text)
                    return (
                        <div key={qId} className="font-semibold leading-[2.4] text-foreground/80" style={{ fontSize: `${qTextSize}px` }}>
                            <span className="mr-1.5 tabular-nums">{displayNum}.</span>
                            {before}
                            <input
                                ref={(el) => { gapRefs.current[qId] = el }}
                                type="text"
                                value={answers[qId] ?? ""}
                                onChange={(e) => onAnswer(qId, e.target.value)}
                                onFocus={() => onSelectQuestion(qId)}
                                placeholder={hasGap ? `(${displayNum})` : "Javobni yozing..."}
                                autoComplete="off"
                                spellCheck={false}
                                aria-label={`${displayNum}-savol`}
                                className={`h-9 min-w-0 rounded-lg border border-border-strong bg-white px-3 font-medium outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 ${hasGap ? "mx-1 w-32 text-center md:w-40" : "mt-1 block w-full"}`}
                            />
                            {hasGap && after}
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const renderPassage = () => {
        if (isPartFive) {
            const text = currentPart.passage || ""
            if (!text) return null
            return (
                <div className="space-y-4">
                    <div lang="en" className={passageClass} style={passageStyle}>
                        <HighlightText text={text} highlights={currentHighlights} onAddHighlight={handleAddHighlight} onRemoveHighlight={handleRemoveHighlight} offset={0} activeColor={activeColor} />
                    </div>
                </div>
            )
        }

        if (!gapLayout) return null
        const { text, gapFillQs, segments, offsets, assigned, fallbackQuestions } = gapLayout

        // Matn yo'q, lekin gap-fill savollar bor: ularni baribir ko'rsatamiz
        if (!text) return gapFillQs.length > 0 ? renderGapList(gapFillQs) : null

        return (
            <div className="space-y-4">
                <div lang="en" className={passageClass} style={passageStyle}>
                    {segments.map((segment, i) => {
                        const q = i < assigned.length ? assigned[i] : null
                        const qId = q ? Number(q.id) : null
                        const displayNum = q ? (revMap[Number(q.id)] ?? q.question_number) : ""
                        const isActive = qId !== null && Number(currentQuestion) === qId
                        const filled = qId !== null && isAnswered(qId)

                        return (
                            <span key={i} className="inline">
                                <HighlightText
                                    text={segment}
                                    highlights={currentHighlights}
                                    onAddHighlight={handleAddHighlight}
                                    onRemoveHighlight={handleRemoveHighlight}
                                    offset={offsets[i]}
                                    activeColor={activeColor}
                                />
                                {qId !== null && (
                                    <input
                                        ref={(el) => {
                                            gapRefs.current[qId] = el
                                        }}
                                        type="text"
                                        value={answers[qId] ?? ""}
                                        onChange={(e) => onAnswer(qId, e.target.value)}
                                        onFocus={() => onSelectQuestion(qId)}
                                        placeholder={`(${displayNum})`}
                                        autoComplete="off"
                                        spellCheck={false}
                                        aria-label={`${displayNum}-savol`}
                                        className={`mx-1 h-8 w-28 rounded-md border-b-2 px-2 text-center font-sans text-[0.8em] font-bold text-foreground outline-none transition-all placeholder:font-semibold placeholder:text-foreground/60 md:w-36
                                            ${isActive
                                                ? "border-foreground bg-foreground/10 ring-4 ring-foreground/10"
                                                : filled
                                                    ? "border-foreground/60 bg-foreground/10"
                                                    : "border-border-strong bg-muted/70 hover:border-foreground/60"}`}
                                    />
                                )}
                            </span>
                        )
                    })}
                </div>
                {fallbackQuestions.length > 0 && renderGapList(fallbackQuestions)}
            </div>
        )
    }

    const questionRange = partStats[activePartIndex]
    const eraser = activeColor === "transparent"

    return (
        <div
            ref={containerRef}
            className={`relative flex h-full flex-col gap-3 overflow-hidden bg-background p-3 ${isResizing ? "select-none" : ""}`}
            style={{ ["--q-w" as string]: `${questionsWidth}%` }}
        >
            {/* ===== QISMLAR ===== */}
            <nav
                aria-label="Qismlar"
                className="flex shrink-0 items-center justify-center gap-2 overflow-x-auto rounded-2xl border border-border bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
                {(examData.parts ?? []).map((_, idx) => {
                    const stat = partStats[idx]
                    const active = activePartIndex === idx
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                setActivePartIndex(idx)
                                const firstQ = examData.parts[idx].questions[0]
                                if (firstQ) onSelectQuestion(Number(firstQ.id))
                            }}
                            aria-current={active ? "true" : undefined}
                            title={`${idx + 1}-qism · ${stat.done}/${stat.total}${stat.from !== null ? ` · ${stat.from}–${stat.to}` : ""}`}
                            className={`flex h-9 min-w-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 text-sm font-semibold transition-all duration-200
                                ${active
                                    ? "border-foreground bg-[#E4F70A] text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                                    : stat.complete
                                        ? "border-emerald-500/40 bg-emerald-500/10 text-foreground hover:border-foreground hover:bg-foreground/[0.08]"
                                        : "border-border bg-white text-foreground hover:border-foreground hover:bg-foreground/[0.08]"}`}
                        >
                            {active ? <FolderOpen size={14} /> : stat.complete ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Folder size={14} className="text-foreground" />}
                            <span>{idx + 1}</span>
                        </button>
                    )
                })}
            </nav>

            {/* ===== MOBIL: MATN / SAVOLLAR ===== */}
            <div className="flex shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:hidden">
                {([
                    { key: "passage", label: "Matn", icon: BookOpen },
                    { key: "questions", label: "Savollar", icon: HelpCircle },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveView(key)}
                        className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-xs font-bold transition-all
                            ${activeView === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground/70"}`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            <div className="flex min-h-0 flex-1 gap-0">
                {/* ===== CHAP: MATN ===== */}
                <section
                    className={`min-w-0 flex-1 flex-col rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:flex
                        ${activeView === "passage" ? "flex" : "hidden"} ${isResizing ? "pointer-events-none" : ""}`}
                >
                    <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-border bg-white px-4 py-3.5">
                        <h2 className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                            <FileText size={16} className="shrink-0 text-foreground" />
                            <span className="truncate">{currentPart.title || "Matn"}</span>
                        </h2>

                        <div className="flex items-center gap-2" role="toolbar" aria-label="Matn asboblari">
                            {/* Matn o'lchami (A- / A+) */}
                            <div className="inline-flex overflow-hidden rounded-lg border border-border-strong text-[13px] font-semibold text-[#4b5563]" role="group" aria-label="Matn o'lchami">
                                <button type="button" onClick={onDecreaseFontSize} aria-label="Matnni kichraytirish" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 transition hover:bg-foreground/[0.08] hover:text-foreground">
                                    <CaseSensitive size={15} /> A-
                                </button>
                                <span className="w-px bg-[#d1d5db]" />
                                <button type="button" onClick={onIncreaseFontSize} aria-label="Matnni kattalashtirish" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 transition hover:bg-foreground/[0.08] hover:text-foreground">
                                    <CaseSensitive size={15} /> A+
                                </button>
                            </div>

                            {/* Belgilash */}
                            <div ref={colorRef} className="relative flex items-center gap-2">
                                <Highlighter size={16} className="text-amber-500" />
                                <button
                                    type="button"
                                    onClick={() => setColorOpen((v) => !v)}
                                    aria-haspopup="listbox"
                                    aria-expanded={colorOpen}
                                    aria-label="Belgilash rangi"
                                    className="flex h-[34px] w-12 items-center gap-1 rounded-lg border border-border bg-white p-1 transition hover:border-foreground/50"
                                >
                                    <span
                                        className={`h-5 flex-1 rounded-md ${eraser ? "border border-dashed border-[#9ca3af]" : ""}`}
                                        style={{ backgroundColor: eraser ? "transparent" : activeColor }}
                                    />
                                    <ChevronDown size={11} className={`shrink-0 text-muted-foreground transition-transform ${colorOpen ? "rotate-180" : ""}`} />
                                </button>

                                {colorOpen && (
                                    <div
                                        role="listbox"
                                        className="absolute right-0 top-full z-50 mt-1.5 w-[210px] rounded-xl border border-border bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        <div className="flex flex-wrap items-center gap-1 p-1">
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={eraser}
                                                title="O'chirish"
                                                onClick={() => { setActiveColor("transparent"); setColorOpen(false) }}
                                                className={`size-[30px] rounded-lg border border-dashed transition ${eraser ? "border-foreground bg-foreground/10" : "border-border-strong hover:border-foreground"}`}
                                            />
                                            {HIGHLIGHT_COLORS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={activeColor === c.value}
                                                    title={c.label}
                                                    onClick={() => { setActiveColor(c.value); setColorOpen(false) }}
                                                    className="flex h-[22px] w-[30px] items-center justify-center rounded-lg border border-black/10 transition hover:scale-110"
                                                    style={{
                                                        backgroundColor: c.value,
                                                        outline: activeColor === c.value ? "2px solid #0B0B0D" : "none",
                                                        outlineOffset: "2px",
                                                    }}
                                                >
                                                    {activeColor === c.value && <Check size={11} strokeWidth={3} className="text-foreground/80" />}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { clearHighlights(); setColorOpen(false) }}
                                            disabled={currentHighlights.length === 0}
                                            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-35"
                                        >
                                            <Trash2 size={12} /> Barcha belgilashni tozalash
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="no-copy min-h-0 flex-1 overflow-y-auto rounded-b-2xl px-5 pb-32 pt-6 md:px-8 lg:pb-10">
                        <div className="mx-auto max-w-3xl space-y-4">
                            {currentPart.image_url && (
                                <ZoomableImage
                                    src={resolveAssetUrl(currentPart.image_url)}
                                    alt={`${currentPart.title || "Reading part"} rasmi`}
                                />
                            )}
                            {renderPassage()}
                        </div>
                    </div>
                </section>

                {/* ===== RESIZER ===== */}
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Panel kengligini o'zgartirish"
                    aria-valuenow={Math.round(questionsWidth)}
                    aria-valuemin={MIN_Q_WIDTH}
                    aria-valuemax={MAX_Q_WIDTH}
                    tabIndex={0}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        setIsResizing(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
                        const delta = e.key === "ArrowLeft" ? 2 : -2
                        const next = Math.min(MAX_Q_WIDTH, Math.max(MIN_Q_WIDTH, widthRef.current + delta))
                        setQuestionsWidth(next)
                        saveWidth(next)
                    }}
                    onDoubleClick={() => {
                        setQuestionsWidth(DEFAULT_Q_WIDTH)
                        saveWidth(DEFAULT_Q_WIDTH)
                    }}
                    className="group hidden w-3 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none lg:flex"
                >
                    <div className={`h-12 w-1 rounded-full transition-colors group-focus-visible:bg-foreground ${isResizing ? "bg-foreground" : "bg-border-strong group-hover:bg-foreground"}`} />
                </div>

                {/* ===== O'NG: JAVOBLAR ===== */}
                <section
                    className={`min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:w-[var(--q-w)] lg:flex-none lg:shrink-0 lg:flex
                        ${activeView === "questions" ? "flex" : "hidden"} ${isResizing ? "pointer-events-none" : ""}`}
                >
                    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-4 py-3.5">
                        <h2 className="flex items-center gap-2 font-semibold text-foreground">
                            <ListChecks size={16} className="text-foreground" /> Javoblar
                            {questionRange?.from != null && (
                                <span className="text-xs font-medium text-muted-foreground">{questionRange.from}–{questionRange.to}</span>
                            )}
                        </h2>
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
                            {questionRange?.done ?? 0}/{questionRange?.total ?? 0}
                        </span>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto bg-background px-3 pb-24 pt-3 lg:pb-4">
                        <div className="mx-auto max-w-xl space-y-3 lg:max-w-none">
                            {/* Ko'rsatma */}
                            {currentPart.description?.trim() ? (
                                <div className="flex gap-3 rounded-xl border border-foreground/15 bg-foreground/[0.06] px-4 py-3">
                                    <Info size={16} className="mt-0.5 shrink-0 text-foreground" />
                                    <p className="whitespace-pre-line text-[13px] font-medium leading-relaxed text-foreground/80">
                                        {currentPart.description}
                                    </p>
                                </div>
                            ) : null}

                            {currentPart.questions.map((q) => {
                                const qId = Number(q.id)
                                if (isGapType(q.type) && !isPartFive) return null
                                const displayNum = revMap[qId] ?? q.question_number ?? q.id
                                const isActive = Number(currentQuestion) === qId
                                const done = isAnswered(qId)
                                const isRadioKind = q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "MULTIPLE_CHOICE"
                                const isRightSideGapFill = isPartFive && isGapType(q.type)
                                const HeadIcon = isRadioKind ? CircleHelp : isRightSideGapFill ? TextCursorInput : ListTree

                                // Shu qismdagi BOSHQA savollarda tanlangan qiymatlar (dropdownda "ishlatilgan" yorlig'i uchun)
                                const usedValues = currentPart.questions
                                    .filter((o) => Number(o.id) !== qId && o.type === q.type)
                                    .map((o) => answers[Number(o.id)])
                                    .filter((v): v is string => !!v && v.trim() !== "")

                                return (
                                    <div
                                        key={q.id}
                                        ref={(el) => {
                                            cardRefs.current[qId] = el
                                        }}
                                        onClick={() => onSelectQuestion(qId)}
                                        className={`scroll-mt-2 overflow-hidden border bg-white transition-all duration-200
                                            ${isRadioKind ? "rounded-xl" : "rounded-2xl"}
                                            ${isActive
                                                ? "border-foreground/60 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-4 ring-foreground/10"
                                                : "border-border shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-foreground/30"}`}
                                    >
                                        <div className={`flex items-start gap-2.5 border-b border-border px-4 py-3 font-semibold text-foreground ${isRadioKind ? "bg-background" : "bg-white"}`}>
                                            <HeadIcon size={16} className="mt-1 shrink-0 text-foreground" />
                                            <p className="min-w-0 flex-1 leading-relaxed" style={{ fontSize: `${qTextSize}px` }}>
                                                <span className="mr-1.5 tabular-nums text-foreground">{displayNum}.</span>
                                                {q.text}
                                            </p>
                                            {done && <SquareCheckBig size={16} className="mt-1 shrink-0 text-emerald-600" aria-label="Javob berilgan" />}
                                        </div>
                                        <div className="px-4 py-3.5">
                                            {isRightSideGapFill ? (
                                                <GapFillFillRenderer
                                                    answer={answers[qId] || ""}
                                                    onInputChange={(v) => onAnswer(qId, v)}
                                                    onSelect={() => onSelectQuestion(qId)}
                                                    fontSize={fontSize}
                                                    inputRef={(el) => { gapRefs.current[qId] = el }}
                                                />
                                            ) : (
                                                <QuestionRenderer
                                                    question={q}
                                                    answer={answers[qId] || ""}
                                                    onAnswer={(v) => onAnswer(qId, v)}
                                                    onInputChange={(v) => onAnswer(qId, v)}
                                                    onSelect={() => onSelectQuestion(qId)}
                                                    usedValues={usedValues}
                                                    fontSize={fontSize}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {currentPart.questions.length > 0 && currentPart.questions.every((q) => isGapType(q.type)) && !isPartFive && (
                                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-white px-6 py-10 text-center">
                                    <FileQuestion className="text-muted-foreground/60" size={32} />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Bu qismdagi javoblar chap tomondagi matn ichiga yoziladi.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Oldingi / keyingi savol (Alt + ← / →) */}
                    <footer className="hidden shrink-0 items-center justify-between gap-3 border-t border-border bg-white px-3 py-2.5 lg:flex">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={!canPrev}
                            title="Alt + ←"
                            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                        >
                            <ChevronLeft size={15} /> Oldingi
                        </button>
                        {currentNumber && totalQuestions ? (
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{currentNumber} / {totalQuestions}</span>
                        ) : <span />}
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!canNext}
                            title="Alt + →"
                            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-bold text-white transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-35"
                        >
                            Keyingi <ChevronRight size={15} />
                        </button>
                    </footer>
                </section>
            </div>
        </div>
    )
}