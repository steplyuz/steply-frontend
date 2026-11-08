'use client'

/* shared/ui/language-switch.tsx
 *
 * Til/alifbo tanlagich: o‘z · öz · Ўз · EN · RU.
 *
 *  • Standart: pastga tortiladigan menyu (dropdown) — bayroq + qisqa nom + ▾
 *  • `inline`: variantlar ochiq ro‘yxat bo‘lib turadi (mobil menyu / drawer ichida
 *    popover scroll konteynerida kesilib qolmasligi uchun)
 *  • `align`: dropdown qaysi chetga yopishadi ('right' — o‘ng, 'left' — chap; sidebar uchun)
 *
 * Bayroqlar SVG (emoji bayroqlar Windows'da harf bo‘lib ko‘rinadi).
 * Butun komponent data-no-i18n ichida: aks holda "o‘z" tugmasi o‘zi "öz" ga aylanib qoladi.
 * Shu sababli ichidagi yozuvlar tilga bog‘liq emas: o‘z tilidagi nomlar va harf namunalari.
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

import { useAlphabet } from '@/shared/providers/alphabet-provider'
import type { UiLang } from '@/shared/lib/uz-alphabet'

/* ─────────────────────────────────────────────────────────────────────────────
 * Bayroqlar
 * ──────────────────────────────────────────────────────────────────────────── */

type FlagKind = 'uz' | 'gb' | 'ru'

const FLAG_FRAME = 'shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(15,42,28,0.14)]'

function Flag({ kind, className = 'h-4 w-6' }: { kind: FlagKind; className?: string }) {
    if (kind === 'gb') {
        return (
            <svg viewBox="0 0 24 16" className={`${className} ${FLAG_FRAME}`} aria-hidden="true">
                <rect width="24" height="16" fill="#012169" />
                <path d="M0 0L24 16M24 0L0 16" stroke="#fff" strokeWidth="3.2" />
                <path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.1" />
                <path d="M12 0V16M0 8H24" stroke="#fff" strokeWidth="5.4" />
                <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="3.2" />
            </svg>
        )
    }

    if (kind === 'ru') {
        return (
            <svg viewBox="0 0 24 16" className={`${className} ${FLAG_FRAME}`} aria-hidden="true">
                <rect width="24" height="16" fill="#fff" />
                <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
                <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
            </svg>
        )
    }

    // O'zbekiston (soddalashtirilgan)
    return (
        <svg viewBox="0 0 24 16" className={`${className} ${FLAG_FRAME}`} aria-hidden="true">
            <rect width="24" height="16" fill="#fff" />
            <rect y="0" width="24" height="5.2" fill="#0099B5" />
            <rect y="5.2" width="24" height=".5" fill="#CE1126" />
            <rect y="10.3" width="24" height=".5" fill="#CE1126" />
            <rect y="10.8" width="24" height="5.2" fill="#1EB53A" />
            <circle cx="4.6" cy="2.6" r="1.9" fill="#fff" />
            <circle cx="5.4" cy="2.6" r="1.6" fill="#0099B5" />
            {[
                [8.4, 1.3], [10, 1.3], [11.6, 1.3],
                [8.4, 2.7], [10, 2.7], [11.6, 2.7],
                [8.4, 4.1], [10, 4.1], [11.6, 4.1],
            ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r=".38" fill="#fff" />
            ))}
        </svg>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Variantlar (LANG_OPTIONS boshqa joylarda ham ishlatilishi mumkin — value/label/name saqlangan)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface LangOption {
    value: UiLang
    /** Tugmadagi qisqa yozuv */
    label: string
    /** To‘liq nom (o‘z tilida) */
    name: string
    flag: FlagKind
    /** Harf namunasi (tilga bog‘liq emas) */
    hint?: string
    badge?: string
}

export const LANG_OPTIONS: LangOption[] = [
    { value: 'old', label: 'o‘z', name: 'O‘zbekcha', flag: 'uz', hint: 'o‘ g‘ sh ch' },
    { value: 'new', label: 'öz', name: 'Özbekçe', flag: 'uz', hint: 'ö ğ ş ç', badge: 'NEW' },
    { value: 'cyrl', label: 'Ўз', name: 'Ўзбекча', flag: 'uz', hint: 'Ў Ғ Ш Ч' },
    { value: 'en', label: 'EN', name: 'English', flag: 'gb' },
    { value: 'ru', label: 'RU', name: 'Русский', flag: 'ru' },
]

/** Shu indeksdan keyin ajratgich chiziq (o‘zbek variantlari | boshqa tillar) */
const SEPARATOR_AFTER = 2

const FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'

function OptionContent({ opt, active }: { opt: LangOption; active: boolean }) {
    return (
        <>
            <Flag kind={opt.flag} className="h-5 w-[30px]" />
            <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">{opt.name}</span>
                    {opt.badge && (
                        <span className="rounded-full bg-primary-strong px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white">
                            {opt.badge}
                        </span>
                    )}
                </span>
                {opt.hint && <span className="mt-0.5 block truncate text-xs tracking-wide text-muted-foreground">{opt.hint}</span>}
            </span>
            <span
                aria-hidden="true"
                className={`flex size-5 shrink-0 items-center justify-center rounded-full transition-colors ${active ? 'bg-primary text-primary-foreground' : 'border border-border-strong'
                    }`}
            >
                {active && <Check className="size-3" strokeWidth={3} />}
            </span>
        </>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Komponent
 * ──────────────────────────────────────────────────────────────────────────── */

export function LanguageSwitch({
    className = '',
    inline = false,
    align = 'right',
}: {
    className?: string
    /** true — dropdown o‘rniga variantlar ochiq ro‘yxat bo‘lib turadi */
    inline?: boolean
    align?: 'left' | 'right'
}) {
    const { lang, setLang } = useAlphabet()
    const reduceMotion = useReducedMotion() ?? false
    const listId = useId()

    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

    const current = LANG_OPTIONS.find((o) => o.value === lang) ?? LANG_OPTIONS[0]

    // Tashqariga bosilganda yopish
    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [open])

    // Ochilganda tanlangan variantga fokus
    useEffect(() => {
        if (!open) return
        const idx = Math.max(0, LANG_OPTIONS.findIndex((o) => o.value === lang))
        const id = requestAnimationFrame(() => optionRefs.current[idx]?.focus())
        return () => cancelAnimationFrame(id)
    }, [open, lang])

    function choose(value: UiLang) {
        setLang(value)
        if (!inline) {
            setOpen(false)
            triggerRef.current?.focus()
        }
    }

    function moveFocus(from: number, delta: number) {
        const next = (from + delta + LANG_OPTIONS.length) % LANG_OPTIONS.length
        optionRefs.current[next]?.focus()
    }

    function onListKeyDown(e: KeyboardEvent<HTMLElement>, index: number) {
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault()
                moveFocus(index, 1)
                break
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault()
                moveFocus(index, -1)
                break
            case 'Home':
                e.preventDefault()
                optionRefs.current[0]?.focus()
                break
            case 'End':
                e.preventDefault()
                optionRefs.current[LANG_OPTIONS.length - 1]?.focus()
                break
            case 'Escape':
                if (!inline) {
                    e.preventDefault()
                    setOpen(false)
                    triggerRef.current?.focus()
                }
                break
            case 'Tab':
                if (!inline) setOpen(false)
                break
        }
    }

    /* ───────── Ochiq ro'yxat (mobil menyu / drawer) ───────── */

    if (inline) {
        return (
            <div role="radiogroup" aria-label="Til" data-no-i18n className={`${className} grid gap-1.5`}>
                {LANG_OPTIONS.map((opt, i) => {
                    const active = opt.value === lang
                    return (
                        <div key={opt.value} className="contents">
                            <button
                                ref={(el) => {
                                    optionRefs.current[i] = el
                                }}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                tabIndex={active ? 0 : -1}
                                onClick={() => choose(opt.value)}
                                onKeyDown={(e) => onListKeyDown(e, i)}
                                className={[
                                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none',
                                    FOCUS_RING,
                                    active
                                        ? 'border-primary/40 bg-secondary'
                                        : 'border-primary-strong/10 bg-card/70 hover:bg-card',
                                ].join(' ')}
                            >
                                <OptionContent opt={opt} active={active} />
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    /* ───────── Pastga tortiladigan menyu ───────── */

    return (
        <div ref={rootRef} data-no-i18n className={`${className || 'inline-flex'} relative`}>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-label={`Til: ${current.name}`}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
                className={[
                    'flex h-10 items-center gap-2 rounded-full border border-primary-strong/15 bg-card/65 pl-3 pr-2.5',
                    'text-sm font-semibold text-foreground shadow-sm backdrop-blur-md',
                    'transition-[background-color,box-shadow,border-color] duration-200 motion-reduce:transition-none',
                    'hover:border-primary/40 hover:bg-card',
                    open ? 'border-primary/40 bg-card shadow-md' : '',
                    FOCUS_RING,
                ].join(' ')}
            >
                <Flag kind={current.flag} />
                <span>{current.label}</span>
                <ChevronDown
                    aria-hidden="true"
                    className={`size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''
                        }`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id={listId}
                        role="listbox"
                        aria-label="Til"
                        initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className={[
                            'absolute top-full z-50 mt-2 w-64 rounded-2xl border border-primary-strong/10 bg-card p-1.5',
                            'shadow-[0_18px_50px_rgba(15,61,38,0.18)]',
                            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
                        ].join(' ')}
                    >
                        {LANG_OPTIONS.map((opt, i) => {
                            const active = opt.value === lang
                            return (
                                <div key={opt.value} className="contents">
                                    <button
                                        ref={(el) => {
                                            optionRefs.current[i] = el
                                        }}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => choose(opt.value)}
                                        onKeyDown={(e) => onListKeyDown(e, i)}
                                        className={[
                                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors motion-reduce:transition-none',
                                            FOCUS_RING,
                                            active ? 'bg-secondary' : 'hover:bg-muted',
                                        ].join(' ')}
                                    >
                                        <OptionContent opt={opt} active={active} />
                                    </button>
                                    {i === SEPARATOR_AFTER && (
                                        <div role="separator" aria-hidden="true" className="mx-2 my-1 h-px bg-border" />
                                    )}
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}