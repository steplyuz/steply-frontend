"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { WritingTask } from "@/lib/api/types"

type ApiTask = WritingTask & {
    part_number?: number | null
    sub_part?: number | null
}

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

interface PartGroup {
    part: string
    indices: number[]
}

const MIN_FONT = 13
const MAX_FONT = 26

function countWords(value: string) {
    return value.trim() ? value.trim().split(/\s+/).length : 0
}

function getLimits(task?: WritingTask) {
    const wl = task?.word_limit
    if (!wl) return { min: null as number | null, max: null as number | null }
    if (typeof wl === "object") return { min: wl.min ?? null, max: wl.max ?? null }
    if (typeof wl === "number") return { min: null, max: wl }
    return { min: null, max: null }
}

const norm = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim()

// part_number bo'yicha guruhlash
function buildGroups(tasks: WritingTask[]): PartGroup[] {
    const groups: PartGroup[] = []
    tasks.forEach((t, idx) => {
        const pn = (t as ApiTask).part_number
        const part = pn != null ? String(pn) : String(groups.length + 1)
        const last = groups[groups.length - 1]
        if (last && last.part === part) last.indices.push(idx)
        else groups.push({ part, indices: [idx] })
    })
    return groups
}

// Gap o'rtasidagi \n ni birlashtiradi (oldingi qator tinish belgisi bilan tugamasa)
function unwrap(text: string): string[] {
    const out: string[] = []
    for (const raw of text.trim().split("\n")) {
        const l = raw.trim()
        if (!l) {
            out.push("")
            continue
        }
        const prev = out[out.length - 1]
        if (prev && !/[.?!:”"]$/.test(prev)) out[out.length - 1] = `${prev} ${l}`
        else out.push(l)
    }
    return out
}

function renderLine(line: string) {
    return line
        .split(/(“[^”]+”|"[^"]+")/g)
        .map((p, j) => (/^[“"]/.test(p) && p.length > 2 ? <strong key={j}>{p}</strong> : p))
}

interface DocTextProps {
    lines: string[]
    boldFirst?: boolean
    spaced?: boolean
    italicLimit?: boolean
}

function DocText({ lines, boldFirst = false, spaced = false, italicLimit = false }: DocTextProps) {
    let firstDone = false
    return (
        <>
            {lines.map((line, i) => {
                if (!line.trim()) return spaced ? null : <div key={i} className="h-[1em]" />
                const isFirst = !firstDone
                firstDone = true
                const isLimit = italicLimit && /^write\s.*words\.?$/i.test(line.trim())
                return (
                    <p
                        key={i}
                        className={`${spaced ? "mb-4" : ""} ${isLimit ? "italic" : ""} ${boldFirst && isFirst ? "font-bold" : ""
                            }`}
                    >
                        {renderLine(line)}
                    </p>
                )
            })}
        </>
    )
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
}: WritingExamContentProps) {
    const [splitWidth, setSplitWidth] = useState(DEFAULT_SPLIT_WIDTH)
    const [isResizing, setIsResizing] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
    const [fontSizes, setFontSizes] = useState<Record<number, number>>({})

    const containerRef = useRef<HTMLDivElement>(null)
    const questionsRef = useRef<HTMLDivElement>(null)
    const partRefs = useRef<(HTMLDivElement | null)[]>([])
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])
    const lastFocusedRef = useRef<number | null>(null)
    const mountedRef = useRef(false)

    const groups = useMemo(() => buildGroups(tasks), [tasks])
    const activeGroupIndex = Math.max(
        0,
        groups.findIndex((g) => g.indices.includes(activeTaskIndex))
    )

    const getId = (idx: number) => tasks[idx]?.id ?? idx

    const sizeOf = (id: number) => fontSizes[id] ?? fontSize
    const changeSize = (id: number, delta: number) =>
        setFontSizes((prev) => ({
            ...prev,
            [id]: Math.min(MAX_FONT, Math.max(MIN_FONT, (prev[id] ?? fontSize) + delta)),
        }))

    const taskLabel = (g: PartGroup, idx: number) => {
        const sub = (tasks[idx] as ApiTask).sub_part
        if (sub != null) return `Task ${g.part}.${sub}`
        return g.indices.length > 1
            ? `Task ${g.part}.${g.indices.indexOf(idx) + 1}`
            : `Task ${g.part}`
    }

    const labelFor = (idx: number) => {
        const g = groups.find((gr) => gr.indices.includes(idx))
        return g ? taskLabel(g, idx) : `Task ${idx + 1}`
    }

    // Desktop detect (SSR-safe)
    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // Sidebar'dan tanlanganda: kerakli yozish maydoniga o'tish
    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true
            return
        }
        // Matn maydoniga bosilganda scroll qilmaymiz
        if (lastFocusedRef.current === activeTaskIndex) {
            lastFocusedRef.current = null
            return
        }
        const id = tasks[activeTaskIndex]?.id ?? activeTaskIndex
        setCollapsed((prev) => (prev[id] ? { ...prev, [id]: false } : prev))
        requestAnimationFrame(() => {
            sectionRefs.current[activeTaskIndex]?.scrollIntoView({ behavior: "smooth", block: "start" })
            textareaRefs.current[activeTaskIndex]?.focus({ preventScroll: true })
        })
    }, [activeTaskIndex, tasks])

    // O'ng tomonda tegishli partga scroll (faqat desktop)
    useEffect(() => {
        if (!isDesktop) return
        const el = partRefs.current[activeGroupIndex]
        const box = questionsRef.current
        if (el && box) box.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" })
    }, [activeGroupIndex, isDesktop])

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
            const pct = ((e.clientX - rect.left) / rect.width) * 100
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

    const toggleCollapsed = (id: number) =>
        setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

    if (groups.length === 0) return null

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* SPLIT CONTAINER */}
            <div
                ref={containerRef}
                className="relative flex flex-1 min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
            >
                {/* LEFT PANE: UCHALA YOZISH MAYDONI BIR JOYDA */}
                <div
                    style={{ width: isDesktop ? `${splitWidth}%` : "100%" }}
                    className="order-2 flex shrink-0 flex-col bg-white lg:order-1 lg:h-full lg:min-h-0 lg:overflow-hidden"
                >
                    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                        {tasks.map((task, idx) => {
                            const id = getId(idx)
                            const value = answers[id] || ""
                            const words = countWords(value)
                            const { min, max } = getLimits(task)
                            const isActive = idx === activeTaskIndex
                            const isCollapsed = !!collapsed[id]
                            const size = sizeOf(id)

                            const badge =
                                max && words > max
                                    ? "bg-red-100 text-red-800"
                                    : min && words < min
                                        ? "bg-amber-100 text-amber-800"
                                        : min && words >= min
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-muted text-foreground/80"

                            const height = max && max <= 60 ? 150 : max && max <= 160 ? 230 : 300

                            return (
                                <div
                                    key={id}
                                    ref={(el) => {
                                        sectionRefs.current[idx] = el
                                    }}
                                    className={`shrink-0 overflow-hidden rounded-xl border bg-white transition ${isActive ? "border-foreground shadow-sm" : "border-border"
                                        }`}
                                >
                                    {/* Sarlavha: nom, so'zlar soni, shrift, kichraytirish */}
                                    <div
                                        className={`flex flex-wrap items-center gap-x-3 gap-y-2 bg-background px-3 py-2 ${isCollapsed ? "" : "border-b border-border"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{labelFor(idx)}</span>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${badge}`}
                                            >
                                                {words} ta so&apos;z
                                            </span>
                                            <span className="hidden text-xs text-muted-foreground xl:inline">
                                                {min && max ? `${min}–${max}` : max ? `~${max}` : ""}
                                            </span>
                                        </div>

                                        <div className="ml-auto flex items-center gap-2">
                                            {/* Shrift boshqaruvi */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="hidden text-xs font-medium text-muted-foreground 2xl:inline">
                                                    Shrift:
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => changeSize(id, -1)}
                                                    disabled={size <= MIN_FONT}
                                                    className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                                                    title="Shriftni kichraytirish"
                                                >
                                                    A-
                                                </button>
                                                <span className="w-5 text-center text-xs font-semibold tabular-nums text-foreground/80">
                                                    {size}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => changeSize(id, 1)}
                                                    disabled={size >= MAX_FONT}
                                                    className="flex size-7 items-center justify-center rounded border border-border bg-white text-xs font-bold hover:bg-background disabled:opacity-40"
                                                    title="Shriftni kattalashtirish"
                                                >
                                                    A+
                                                </button>
                                            </div>

                                            {/* Yig'ish / ochish */}
                                            <button
                                                type="button"
                                                onClick={() => toggleCollapsed(id)}
                                                aria-expanded={!isCollapsed}
                                                title={isCollapsed ? "Ochish" : "Yig'ish"}
                                                className="flex size-7 items-center justify-center rounded border border-border bg-white text-foreground/80 transition hover:bg-muted"
                                            >
                                                {isCollapsed ? (
                                                    <ChevronDown className="size-4" />
                                                ) : (
                                                    <ChevronUp className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="p-3">
                                            <textarea
                                                ref={(el) => {
                                                    textareaRefs.current[idx] = el
                                                }}
                                                value={value}
                                                onFocus={() => {
                                                    if (idx !== activeTaskIndex) {
                                                        lastFocusedRef.current = idx
                                                        onSelectTask(idx)
                                                    }
                                                }}
                                                onChange={(e) => onAnswer(id, e.target.value)}
                                                placeholder="Javobingizni shu yerga yozing..."
                                                style={{ fontSize: `${size}px`, height }}
                                                className="w-full resize-y rounded-lg border border-border bg-[#FDFCFB] p-3 font-sans leading-relaxed text-foreground shadow-inner outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground"
                                                spellCheck
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* RESIZE HANDLE */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`order-2 hidden w-2 shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-border-strong lg:flex ${isResizing ? "bg-foreground" : "bg-border"
                        }`}
                >
                    <div className="h-8 w-0.5 rounded-full bg-muted-foreground" />
                </div>

                {/* RIGHT PANE: HUJJAT KO'RINISHI */}
                <div
                    ref={questionsRef}
                    className="relative order-1 border-b border-border bg-white px-6 py-8 sm:px-12 lg:order-3 lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:border-b-0"
                >
                    <div
                        className="mx-auto max-w-[640px] leading-[1.6] text-black"
                        style={{
                            fontSize: `${fontSize - 2}px`,
                            fontFamily: "Calibri, Carlito, Arial, sans-serif",
                        }}
                    >
                        {groups.map((g, gi) => (
                            <div
                                key={gi}
                                ref={(el) => {
                                    partRefs.current[gi] = el
                                }}
                                className={gi === 0 ? "" : "mt-14"}
                            >
                                <h2 className="mb-6 text-center font-bold">PART {g.part}</h2>

                                {g.indices.map((idx, n) => {
                                    const task = tasks[idx]
                                    const prev = n > 0 ? tasks[g.indices[n - 1]] : undefined
                                    const single = g.indices.length === 1

                                    // Umumiy matn (email) guruhda faqat bir marta
                                    const showContext =
                                        !!task.context_text &&
                                        norm(task.context_text) !== norm(prev?.context_text)

                                    // question instruction yoki context_text ichida bo'lsa, takrorlamaymiz
                                    const q = norm(task.question)
                                    const showQuestion =
                                        !!q &&
                                        !norm(task.instruction).includes(q) &&
                                        !norm(task.context_text).includes(q)

                                    return (
                                        <div key={task.id ?? idx} className={n > 0 ? "mt-10" : ""}>
                                            {showContext && (
                                                <div className="mb-10">
                                                    <DocText
                                                        lines={task.context_text!.trim().split("\n")}
                                                        boldFirst
                                                        spaced
                                                    />
                                                </div>
                                            )}

                                            {!single && <p className="mb-3 font-bold">{taskLabel(g, idx)}</p>}

                                            {task.instruction && (
                                                <DocText lines={unwrap(task.instruction)} italicLimit={single} />
                                            )}

                                            {showQuestion && (
                                                <div className="mt-3">
                                                    <DocText lines={unwrap(task.question!)} italicLimit={single} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}