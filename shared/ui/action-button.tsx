'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowUpRight, Download, Lock, type LucideProps } from 'lucide-react'
import { FOCUS, LIME } from '@/shared/lib/brand'

/*
 * Kartochka tugmalarining yagona ko'rinishi (practice, speaking, test sahifalari).
 *  start    — "Boshlash"          (asosiy, gradient)
 *  locked   — "Obunani ochish"    (qulflangan, yumshoq)
 *  download — "PDF yuklab olish"  (kontur)
 * Barcha variantlar bir xil balandlik, shakl, shrift va ikonka tartibiga ega.
 */

export type ActionVariant = 'start' | 'locked' | 'download'

type Common = {
  variant: ActionVariant
  label: string
  /** Qorong'i fonda (masalan, kartochka ustida) — lime fon. */
  onDark?: boolean
  className?: string
}

const ICON: Record<ActionVariant, ComponentType<LucideProps>> = {
  start: ArrowUpRight,
  locked: Lock,
  download: Download,
}

const BASE =
  'group/btn inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-bold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none'

const TONE: Record<ActionVariant, string> = {
  start:
    'bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-[0_12px_30px_-14px_rgba(31,122,77,0.75)] hover:brightness-110',
  locked: 'bg-foreground/[0.07] text-foreground hover:bg-[#0F3D26]/[0.07]',
  download: 'bg-transparent text-foreground ring-1 ring-inset ring-foreground/15 hover:bg-foreground/[0.04]',
}

const KNOB: Record<ActionVariant, string> = {
  start: 'bg-white text-foreground',
  locked: 'bg-white text-foreground',
  download: 'bg-foreground text-white',
}

function classes({ variant, onDark = false, className = '' }: Common) {
  const tone = onDark ? 'text-foreground hover:brightness-95' : TONE[variant]
  return [BASE, tone, FOCUS, className].filter(Boolean).join(' ')
}

function Knob({ variant, onDark = false }: Common) {
  const Icon = ICON[variant]
  const spin = variant === 'download' ? '' : 'group-hover/btn:rotate-45'
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-transform motion-reduce:transition-none ${spin} ${
        onDark ? 'bg-foreground text-white' : KNOB[variant]
      }`}
    >
      <Icon aria-hidden="true" className="size-4" />
    </span>
  )
}

export function PracticeActionLink(props: Common & { href: string }) {
  const { href, onDark } = props
  return (
    <Link href={href} style={onDark ? { background: LIME } : undefined} className={classes(props)}>
      {props.label}
      <Knob {...props} />
    </Link>
  )
}

export function PracticeActionButton(
  props: Common & { onClick: () => void; disabled?: boolean; busy?: boolean },
) {
  const { onClick, disabled, busy, onDark } = props
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      style={onDark ? { background: LIME } : undefined}
      className={classes(props)}
    >
      {busy ? 'Yuklanmoqda…' : props.label}
      <Knob {...props} />
    </button>
  )
}
