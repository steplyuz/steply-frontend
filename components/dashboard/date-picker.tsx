'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { FOCUS, LIME } from '@/lib/brand'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmt = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
function parseISO(s?: string | null): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

type Props = {
  /** YYYY-MM-DD yoki bo‘sh qator */
  value: string
  onChange: (value: string) => void
  label: string
  min?: string
  max?: string
  clearable?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** Native <input type="date"> o‘rniga: o‘zimizning dizayndagi kalendar */
export function DatePicker({ value, onChange, label, min, max, clearable = true, placeholder = 'kk.oo.yyyy', disabled, className = '' }: Props) {
  const selected = parseISO(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'days' | 'years'>('days')
  const [view, setView] = useState<Date>(() => selected ?? today)
  const [focusDay, setFocusDay] = useState<Date>(() => selected ?? today)
  const [yearStart, setYearStart] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const isDisabledDay = (d: Date) => {
    const iso = toISO(d)
    return (!!min && iso < min) || (!!max && iso > max)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  useEffect(() => {
    if (open && mode === 'days') gridRef.current?.querySelector<HTMLElement>(`[data-iso="${toISO(focusDay)}"]`)?.focus()
  }, [open, mode, focusDay])

  function openPicker() {
    const base = selected ?? today
    setView(base)
    setFocusDay(base)
    setMode('days')
    setOpen(true)
  }

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function pick(d: Date) {
    if (isDisabledDay(d)) return
    onChange(toISO(d))
    close()
  }

  function shiftMonth(delta: number) {
    const next = new Date(view.getFullYear(), view.getMonth() + delta, 1)
    setView(next)
    setFocusDay(new Date(next.getFullYear(), next.getMonth(), Math.min(focusDay.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())))
  }

  function openYears() {
    setYearStart(view.getFullYear() - 5)
    setMode('years')
  }

  function onGridKey(e: React.KeyboardEvent) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in moves) {
      e.preventDefault()
      const next = addDays(focusDay, moves[e.key])
      setFocusDay(next)
      setView(new Date(next.getFullYear(), next.getMonth(), 1))
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      shiftMonth(e.key === 'PageUp' ? -1 : 1)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const y = focusDay.getFullYear(), m = focusDay.getMonth()
      setFocusDay(e.key === 'Home' ? new Date(y, m, 1) : new Date(y, m + 1, 0))
    }
  }

  const year = view.getFullYear()
  const month = view.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  const minYear = min ? Number(min.slice(0, 4)) : 1900
  const maxYear = max ? Number(max.slice(0, 4)) : 2100
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i)

  const navBtn = `flex size-9 items-center justify-center rounded-full bg-foreground/5 text-foreground transition hover:bg-foreground/10 active:scale-95 disabled:opacity-40 motion-reduce:transition-none ${FOCUS}`

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onKeyDown={e => { if (open && e.key === 'Escape') { e.preventDefault(); close() } }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : openPicker())}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-full border border-border bg-white px-5 text-left text-sm font-medium transition hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`}
      >
        <span className={`truncate ${selected ? 'text-foreground' : 'text-foreground/40'}`}>{selected ? fmt(selected) : placeholder}</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/5">
          <CalendarDays aria-hidden="true" className="size-4" />
        </span>
      </button>

      {open && (
        <div role="dialog" aria-label={label} className="absolute left-0 z-30 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] rounded-3xl bg-white p-4 shadow-xl shadow-black/10 ring-1 ring-black/10">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={mode === 'days' ? 'Oldingi oy' : 'Oldingi yillar'}
              className={navBtn}
              onClick={() => (mode === 'days' ? shiftMonth(-1) : setYearStart(y => y - 12))}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-live="polite"
              onClick={() => (mode === 'days' ? openYears() : setMode('days'))}
              className={`rounded-full px-4 py-1.5 text-sm font-black tracking-tight text-foreground transition hover:bg-foreground/5 motion-reduce:transition-none ${FOCUS}`}
            >
              {mode === 'days' ? `${MONTHS[month]} ${year}` : `${years[0]} – ${years[11]}`}
            </button>
            <button
              type="button"
              aria-label={mode === 'days' ? 'Keyingi oy' : 'Keyingi yillar'}
              className={navBtn}
              onClick={() => (mode === 'days' ? shiftMonth(1) : setYearStart(y => y + 12))}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>

          {mode === 'days' ? (
            <>
              <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-bold uppercase text-foreground/45" aria-hidden="true">
                {WEEKDAYS.map(w => <span key={w} className="py-1">{w}</span>)}
              </div>
              <div ref={gridRef} role="grid" aria-label={`${MONTHS[month]} ${year}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-y-1">
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />
                  const iso = toISO(d)
                  const isSel = !!selected && iso === toISO(selected)
                  const isToday = iso === toISO(today)
                  const off = isDisabledDay(d)
                  return (
                    <button
                      key={iso}
                      type="button"
                      role="gridcell"
                      data-iso={iso}
                      aria-selected={isSel}
                      aria-current={isToday ? 'date' : undefined}
                      disabled={off}
                      tabIndex={iso === toISO(focusDay) ? 0 : -1}
                      onClick={() => pick(d)}
                      className={`mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none ${FOCUS} ${isSel ? 'bg-foreground font-bold text-white' : isToday ? 'font-bold text-foreground ring-1 ring-foreground/30 hover:bg-foreground/5' : 'font-medium text-foreground hover:bg-foreground/5'}`}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {years.map(y => {
                const off = y < minYear || y > maxYear
                const isSel = y === year
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={off}
                    onClick={() => { setView(new Date(y, month, 1)); setFocusDay(new Date(y, month, 1)); setMode('days') }}
                    className={`rounded-full py-2 text-sm font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none ${FOCUS} ${isSel ? 'text-foreground' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
                    style={isSel ? { background: LIME } : undefined}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-foreground/10 pt-3">
            {clearable && selected ? (
              <button type="button" onClick={() => { onChange(''); close() }} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground motion-reduce:transition-none ${FOCUS}`}>
                <X aria-hidden="true" className="size-3.5" /> Tozalash
              </button>
            ) : <span />}
            <button
              type="button"
              disabled={isDisabledDay(today)}
              onClick={() => pick(today)}
              className={`rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-white transition hover:bg-foreground/90 active:scale-95 disabled:opacity-40 motion-reduce:transition-none ${FOCUS}`}
            >
              Bugun
            </button>
          </div>
        </div>
      )}
    </div>
  )
}