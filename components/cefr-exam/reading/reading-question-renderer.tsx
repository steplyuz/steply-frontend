"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, LayoutList, X } from "lucide-react"
import type { Question } from "@/lib/cefr-types/reading"

interface QuestionRendererProps {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    onInputChange: (value: string) => void
    fontSize?: number
    /**
     * Foydalanuvchi shu savol bilan ishlaganda chaqiriladi (variant bosildi, dropdown ochildi, input fokus oldi).
     * Variantlar `stopPropagation` qiladi, shuning uchun karta onClick'i ishlamaydi: joriy savol shu orqali yangilanadi.
     */
    onSelect?: () => void
    /** Shu qismdagi BOSHQA savollarda tanlangan qiymatlar (faqat ko'rsatma uchun, bloklamaydi). */
    usedValues?: string[]
}

/** Foydalanuvchi tanlagan matn o'lchamini variantlarga ham qo'llaymiz. */
const optionFont = (fs: number) => Math.min(Math.max(fs - 2, 14), 17)

/** Doira ichiga sig'adigan qisqa kalit (A, B, C, 1...) */
const isShortLetter = (v?: string) => !!v && /^[A-Za-z0-9]{1,2}$/.test(v.trim())

/**
 * Backend ba'zan value=matn, label=harf (teskari) yuboradi. Faqat KO'RSATISH uchun to'g'rilaymiz;
 * saqlanadigan javob qiymati (option.value / option.label) o'zgarmaydi.
 */
function optionView(o: { value: string; label: string }, idx: number) {
    const swapped = !isShortLetter(o.value) && isShortLetter(o.label)
    const rawKey = swapped ? o.label : o.value
    return {
        key: isShortLetter(rawKey) ? rawKey.trim().toUpperCase() : String.fromCharCode(65 + idx),
        text: swapped ? o.value : o.label,
    }
}

// ----------------------------------------------------------------------
// Umumiy radio-variant
// `letter` berilsa, harf (A/B/C) doira ICHIDA ko'rsatiladi; tanlanganda doira to'ladi.
// ----------------------------------------------------------------------
function RadioOption({
    selected, onClick, children, fontSize = 16, letter,
}: {
    selected: boolean
    onClick: () => void
    children: React.ReactNode
    fontSize?: number
    letter?: string
}) {
    const showLetter = isShortLetter(letter)
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className={`flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200
                ${selected
                    ? "border-transparent bg-foreground/[0.12] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                    : "border-border bg-white hover:border-foreground/40 hover:bg-foreground/[0.04]"}`}
        >
            {showLetter ? (
                <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200
                        ${selected ? "bg-foreground text-background" : "bg-[#d9d9d9] text-foreground"}`}
                >
                    {letter!.trim().toUpperCase()}
                </span>
            ) : (
                <span
                    className={`relative size-5 shrink-0 rounded-full transition-all duration-200 ${selected ? "border border-foreground bg-white" : "bg-[#d9d9d9]"}`}
                    aria-hidden
                >
                    <span className={`absolute inset-0 m-auto size-2.5 rounded-full bg-foreground transition-transform duration-200 ${selected ? "scale-100" : "scale-0"}`} />
                </span>
            )}
            <span className="min-w-0 flex-1 break-words leading-snug text-foreground" style={{ fontSize: `${optionFont(fontSize)}px` }}>
                {children}
            </span>
        </button>
    )
}

// ----------------------------------------------------------------------
// 1. TRUE / FALSE / NOT GIVEN
// (qiymatlar A/B/C, lekin foydalanuvchiga TRUE/FALSE/NOT GIVEN ko'rsatiladi: nuqtali doira)
// ----------------------------------------------------------------------
export function TrueFalseNotGivenRenderer({
    answer,
    onAnswer,
    fontSize = 16,
    onSelect,
}: {
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
    onSelect?: () => void
}) {
    const options = [
        { label: "TRUE", value: "A" },
        { label: "FALSE", value: "B" },
        { label: "NOT GIVEN", value: "C" },
    ]

    return (
        <div role="radiogroup" className="w-full space-y-2">
            {options.map((option) => {
                const isActive = answer === option.value
                return (
                    <RadioOption
                        key={option.value}
                        selected={isActive}
                        // Qayta bosilsa javob bekor qilinadi
                        onClick={() => { onSelect?.(); onAnswer(isActive ? "" : option.value) }}
                        fontSize={fontSize}
                    >
                        <span className={isActive ? "font-semibold" : ""}>{option.label}</span>
                    </RadioOption>
                )
            })}
        </div>
    )
}

// ----------------------------------------------------------------------
// 2. MULTIPLE CHOICE
// Javob sifatida option.label saqlanadi (o'zgartirilmagan). Ko'rsatish `optionView` orqali
// to'g'rilanadi: backend value/label ni teskari yuborsa ham harf doirada, matn yonida chiqadi.
// ----------------------------------------------------------------------
export function MultipleChoiceRenderer({
    question,
    answer,
    onAnswer,
    fontSize = 16,
    onSelect,
}: {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
    onSelect?: () => void
}) {
    return (
        <div role="radiogroup" className="w-full max-w-full space-y-2">
            {question.options?.map((option, idx) => {
                const { key, text } = optionView(option, idx)
                // Saqlangan javob harf ko'rinishida qaytsa ham tanlangan holat to'g'ri ko'rinadi
                const isSelected = !!answer && (answer === option.label || answer === option.value)
                return (
                    <RadioOption
                        key={`${option.value}-${idx}`}
                        selected={isSelected}
                        letter={key}
                        onClick={() => { onSelect?.(); onAnswer(isSelected ? "" : option.label) }}
                        fontSize={fontSize}
                    >
                        <span className={isSelected ? "font-semibold" : ""}>{text}</span>
                    </RadioOption>
                )
            })}
        </div>
    )
}

// ----------------------------------------------------------------------
// 3. GAP FILL (matn kiritish)
// ----------------------------------------------------------------------
export function GapFillFillRenderer({
    answer,
    onInputChange,
    fontSize = 16,
    inputRef,
    onSelect,
}: {
    answer: string
    onInputChange: (value: string) => void
    fontSize?: number
    /** Savol tanlanganda inputga fokus berish uchun (Part 5). */
    inputRef?: React.Ref<HTMLInputElement>
    onSelect?: () => void
}) {
    return (
        <div className="w-full max-w-full">
            <input
                ref={inputRef}
                type="text"
                placeholder="Javobni yozing..."
                value={answer ?? ""}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={() => onSelect?.()}
                onClick={(e) => e.stopPropagation()}
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full min-w-0 rounded-xl border border-border bg-white px-3.5 font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-foreground focus:ring-4 focus:ring-foreground/10"
                style={{ fontSize: `${optionFont(fontSize)}px` }}
            />
        </div>
    )
}

// ----------------------------------------------------------------------
// 4. SELECT (TEXT_MATCH / HEADINGS_MATCH) — portal dropdown
// Javob sifatida option.value saqlanadi (o'zgartirilmagan).
// ----------------------------------------------------------------------
export function SelectRenderer({
    question,
    answer,
    onAnswer,
    fontSize = 16,
    placeholder = "Tanlang...",
    onSelect,
    usedValues = [],
}: {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
    placeholder?: string
    onSelect?: () => void
    usedValues?: string[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const optionRefs = useRef<(HTMLDivElement | null)[]>([])

    const selectedOption = question.options?.find((opt) => opt.value === answer)
    const selectedView = selectedOption
        ? optionView(selectedOption, (question.options ?? []).indexOf(selectedOption))
        : null

    const updatePosition = () => {
        if (!buttonRef.current) return
        const rect = buttonRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const spaceBelow = viewportHeight - rect.bottom
        const menuHeight = Math.min((question.options?.length || 0) * 44 + 44, 320)
        const opensUpwards = spaceBelow < menuHeight + 10 && rect.top > spaceBelow

        setMenuStyle({
            position: "fixed",
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            maxWidth: `${viewportWidth - 20}px`,
            top: opensUpwards ? "auto" : `${rect.bottom + 6}px`,
            bottom: opensUpwards ? `${viewportHeight - rect.top + 6}px` : "auto",
            zIndex: 99999,
        })
    }

    useLayoutEffect(() => {
        if (!isOpen) return
        updatePosition()
        // Menyuning o'z ichidagi scroll pozitsiyani qayta hisoblamasin
        const onScroll = (e: Event) => {
            if (menuRef.current?.contains(e.target as Node)) return
            updatePosition()
        }
        // capture: scroll hodisasi bubbling qilmaydi
        window.addEventListener("scroll", onScroll, { capture: true })
        window.addEventListener("resize", updatePosition)
        return () => {
            window.removeEventListener("scroll", onScroll, { capture: true })
            window.removeEventListener("resize", updatePosition)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const onDown = (event: MouseEvent) => {
            const t = event.target as Node
            if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return
            setIsOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false)
                buttonRef.current?.focus()
            }
        }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [isOpen])

    // Menyu ochilganda fokus tanlangan (yoki birinchi) variantga o'tadi va u ko'rinadigan joyga scroll qilinadi.
    useEffect(() => {
        if (!isOpen) return
        const opts = question.options ?? []
        const idx = Math.max(0, opts.findIndex((o) => o.value === answer))
        const raf = requestAnimationFrame(() => {
            const el = optionRefs.current[idx]
            el?.focus({ preventScroll: true })
            el?.scrollIntoView({ block: "nearest" })
        })
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        const items = optionRefs.current.filter(Boolean) as HTMLDivElement[]
        if (!items.length) return
        const i = items.indexOf(document.activeElement as HTMLDivElement)
        if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus() }
        else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus() }
        else if (e.key === "Home") { e.preventDefault(); items[0].focus() }
        else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus() }
        else if (e.key === "Tab") setIsOpen(false)
    }

    const pick = (value: string) => {
        onSelect?.()
        onAnswer(value)
        setIsOpen(false)
        buttonRef.current?.focus()
    }

    const DropdownMenu = (
        <div
            ref={menuRef}
            role="listbox"
            onKeyDown={onMenuKeyDown}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            style={{ ...menuStyle, maxHeight: "320px" }}
        >
            {answer && (
                <div className="flex shrink-0 justify-end border-b border-border bg-background/70 px-2 py-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            pick("")
                        }}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                        <X size={11} /> Tozalash
                    </button>
                </div>
            )}

            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1">
                {question.options?.map((option, idx) => {
                    const { key, text } = optionView(option, idx)
                    const isSelected = answer === option.value
                    const usedElsewhere = !isSelected && usedValues.includes(option.value)
                    return (
                        <div
                            key={`${option.value}-${idx}`}
                            ref={(el) => { optionRefs.current[idx] = el }}
                            role="option"
                            tabIndex={-1}
                            aria-selected={isSelected}
                            onClick={() => pick(option.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    pick(option.value)
                                }
                            }}
                            className={`grid shrink-0 cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-2.5 rounded-lg border px-2.5 py-2 outline-none transition-colors focus-visible:border-foreground focus-visible:bg-background
                                ${isSelected ? "border-foreground/25 bg-foreground/10" : "border-transparent hover:bg-background"}`}
                        >
                            <div
                                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition-colors
                                    ${isSelected ? "border-[#E4F70A] bg-[#E4F70A] text-foreground" : "border-border bg-background text-muted-foreground"}`}
                            >
                                {isSelected ? <Check size={11} strokeWidth={3} /> : key}
                            </div>
                            <span
                                className={`block min-w-0 whitespace-normal break-words leading-snug ${isSelected ? "font-bold text-foreground" : usedElsewhere ? "font-medium text-muted-foreground/60" : "font-medium text-muted-foreground"}`}
                                style={{ fontSize: `${optionFont(fontSize)}px` }}
                            >
                                {text}
                            </span>
                            {usedElsewhere && (
                                <span className="mt-0.5 shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    ishlatilgan
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )

    return (
        <>
            <div className="relative w-full max-w-full">
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!isOpen) onSelect?.()
                        setIsOpen((v) => !v)
                    }}
                    onKeyDown={(e) => {
                        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isOpen) {
                            e.preventDefault()
                            onSelect?.()
                            setIsOpen(true)
                        }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    className={`flex min-h-[58px] w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-2 text-left transition-all duration-150
                        ${isOpen
                            ? "border-foreground ring-4 ring-foreground/10"
                            : selectedOption
                                ? "border-foreground/50"
                                : "border-border hover:border-foreground/40"}`}
                >
                    <LayoutList size={18} className="shrink-0 text-foreground" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <span className="block text-[11px] font-semibold leading-none text-muted-foreground">Javobni tanlang</span>
                        {selectedView ? (
                            <div className="mt-1.5 flex items-center gap-2">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-white">
                                    {selectedView.key}
                                </span>
                                <span
                                    className="block truncate font-semibold text-foreground"
                                    style={{ fontSize: `${optionFont(fontSize)}px` }}
                                    title={selectedView.text}
                                >
                                    {selectedView.text}
                                </span>
                            </div>
                        ) : (
                            <span className="mt-1.5 block truncate text-sm font-medium text-muted-foreground/70">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown
                        size={16}
                        className={`shrink-0 text-muted-foreground/70 transition-transform duration-200 ${isOpen ? "rotate-180 text-foreground" : ""}`}
                    />
                </button>
            </div>

            {isOpen && typeof document !== "undefined" && createPortal(DropdownMenu, document.body)}
        </>
    )
}

// ----------------------------------------------------------------------
// ASOSIY RENDER
// ----------------------------------------------------------------------
export default function QuestionRenderer({
    question,
    answer = "",
    onAnswer,
    onInputChange,
    fontSize = 16,
    onSelect,
    usedValues,
}: QuestionRendererProps) {
    if (!question) return null

    const commonProps = { question, answer, onAnswer, onInputChange, fontSize, onSelect }

    switch (question.type) {
        case "TRUE_FALSE_NOT_GIVEN":
            return <TrueFalseNotGivenRenderer {...commonProps} />

        case "MULTIPLE_CHOICE":
            return <MultipleChoiceRenderer {...commonProps} />

        case "GAP_FILL_FILL":
            return <GapFillFillRenderer {...commonProps} />

        case "TEXT_MATCH":
            return <SelectRenderer {...commonProps} usedValues={usedValues} placeholder="Paragrafni tanlang..." />

        case "HEADINGS_MATCH":
            return <SelectRenderer {...commonProps} usedValues={usedValues} placeholder="Sarlavhani tanlang..." />

        case "GAP_FILL":
            return null

        default:
            return (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] font-medium text-red-600">
                    Qo&apos;llab-quvvatlanmaydi: {question.type}
                </div>
            )
    }
}