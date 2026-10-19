'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FOCUS } from '@/lib/brand'

export type SelectOption = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label: string
  disabled?: boolean
  className?: string
}

/** Native <select>/<option> o‘rniga: to‘liq o‘zimizning dizayndagi ro‘yxat */
export function Select({ value, onChange, options, label, disabled, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const uid = useId()

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value))
  const selected = options[selectedIndex]

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
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function openList() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function pick(i: number) {
    onChange(options[i].value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive(i => Math.min(options.length - 1, i + 1)); break
      case 'ArrowUp': e.preventDefault(); setActive(i => Math.max(0, i - 1)); break
      case 'Home': e.preventDefault(); setActive(0); break
      case 'End': e.preventDefault(); setActive(options.length - 1); break
      case 'Enter':
      case ' ': e.preventDefault(); pick(active); break
      case 'Escape': e.preventDefault(); setOpen(false); break
      case 'Tab': setOpen(false); break
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-full border border-border bg-white px-5 text-left text-sm font-medium text-foreground transition hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`}
      >
        <span className="truncate">{selected?.label}</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/5">
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${uid}-list`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/10"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                id={`${uid}-${i}`}
                data-i={i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${isSelected ? 'font-bold' : 'font-medium'} text-foreground ${i === active ? 'bg-foreground/[0.06]' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: '#E4F70A' }}>
                    <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}