import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { FOCUS, GRADIENT_FEATURED } from '@/shared/lib/brand'

// Fokus halqasi butun kabinetda bir xil (lib/brand).
export { FOCUS }

/* Tugmalar: dashboarddagi pill uslubi (to'liq yumaloq, yashil gradient).
   Ranglar token orqali (bg-primary...), shuning uchun admin temada neytral bo'lib qoladi. */
export const btn = {
  primary: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-strong px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-14px_rgba(31,122,77,0.75)] transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`,
  outline: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-strong/70 bg-transparent px-5 py-2.5 text-sm font-semibold text-primary-strong transition hover:bg-secondary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`,
  soft: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-primary-strong transition hover:bg-brand-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`,
  danger: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`,
}

export const input =
  'w-full min-h-11 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60'

/** Karta: oq, rounded-3xl, yumshoq yashil halqa. Butun kabinetda bir xil. */
export const cardClass = 'rounded-3xl bg-white ring-1 ring-primary-strong/[0.06]'

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Tag className={`${cardClass} p-5 sm:p-6 ${className}`}>{children}</Tag>
}

const TONES = {
  primary: 'bg-secondary text-primary-strong',
  muted: 'bg-muted text-muted-foreground',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/15',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15',
}
export type Tone = keyof typeof TONES

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide ${TONES[tone]}`}>{children}</span>
}

/** Yumshoq yashil ikonka doirasi (kartalarda ikonka uchun) */
export function IconBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary-strong sm:size-12 ${className}`}>{children}</span>
}

/** Sahifa sarlavhasi: dashboard hero'si kabi yumshoq yashil gradient, `rounded-3xl`. */
export function PageHeader({ title, desc, action, eyebrow = 'Steply · Kabinet' }: { title: string; desc?: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <header
      className="dash-rise relative overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-primary-strong/[0.06] sm:p-7"
      style={{ background: 'linear-gradient(110deg, #FFFFFF 0%, #EEF7F1 55%, #DCEFE3 100%)' }}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary-strong">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {desc && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{desc}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  )
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3 sm:mt-4">{children}</div>
    </section>
  )
}

/** Statistik karta (dashboard bosh sahifasidagi `StatCard`). featured — to'q yashil gradient. */
export function StatCard({
  title,
  value,
  note,
  featured = false,
  loading = false,
  href,
}: {
  title: string
  value: string | number
  note?: string
  featured?: boolean
  loading?: boolean
  href?: string
}) {
  return (
    <div
      className={`relative flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl p-5 sm:min-h-40 sm:p-6 ${featured ? 'text-white' : 'bg-white text-foreground ring-1 ring-primary-strong/[0.06]'}`}
      style={featured ? { background: GRADIENT_FEATURED } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium">{title}</p>
        {href && (
          <Link
            href={href}
            aria-label={title}
            className={`-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 motion-reduce:transition-none ${featured ? 'bg-white text-primary-strong hover:bg-white/90' : 'text-primary-strong ring-1 ring-primary-strong/25 hover:bg-secondary'} ${FOCUS}`}
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div>
        <p className={`text-5xl font-medium leading-none tracking-tight tabular-nums sm:text-6xl ${loading ? 'animate-pulse motion-reduce:animate-none' : ''}`}>{value}</p>
        {note && <p className={`mt-3 text-xs font-medium ${featured ? 'text-brand-glow' : 'text-primary'}`}>{note}</p>}
      </div>
    </div>
  )
}

/** Oldingi `Stat` nomi bilan mos: label/value/hint */
export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <StatCard title={label} value={value} note={hint} />
}

/** Yarim doira gauge (dashboard: haftalik limit) */
export function Gauge({ ratio, hasData, label = 'ishlatildi', ariaLabel }: { ratio: number; hasData: boolean; label?: string; ariaLabel?: string }) {
  const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100)
  const stroke = ratio >= 1 ? '#C2410C' : '#1F7A4D'
  return (
    <div className="relative mx-auto w-full max-w-[280px]" role="img" aria-label={hasData ? (ariaLabel ?? `${pct}% ${label}`) : 'Ma’lumot yo‘q'}>
      <svg viewBox="0 0 200 108" className="w-full overflow-visible">
        <defs>
          <pattern id="gauge-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(15,61,38,0.28)" strokeWidth="2.4" />
          </pattern>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-hatch)" strokeWidth="24" />
        {hasData && ratio > 0 ? (
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            pathLength={100}
            fill="none"
            stroke={stroke}
            strokeWidth="24"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(ratio, 1) * 100} 100`}
            className="transition-[stroke-dasharray] duration-700 motion-reduce:transition-none"
          />
        ) : null}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-4xl font-medium leading-none tracking-tight tabular-nums text-foreground sm:text-5xl">{hasData ? `${pct}%` : '—'}</span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export const Empty = ({ text }: { text: string }) => (
  <div className="rounded-3xl border border-dashed border-primary-strong/20 bg-white px-5 py-10 text-center text-sm text-muted-foreground sm:py-12">{text}</div>
)

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className={`${btn.outline} shrink-0 border-red-500/40 text-red-700 hover:bg-red-100`}>Qayta urinish</button>}
    </div>
  )
}

export const Loading = ({ rows = 2 }: { rows?: number }) => (
  <div className="grid gap-3 sm:gap-4 md:grid-cols-2" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-28 animate-pulse rounded-3xl bg-primary-strong/[0.07] motion-reduce:animate-none" />
    ))}
  </div>
)

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-2 text-sm font-semibold text-foreground">
    <span>{label}</span>
    {children}
  </label>
)

export { formatDate as fmtDate, formatMoney as fmtMoney } from '@/shared/lib/format'

/** Limit / sarf ko'rsatkichi: butun kabinetda bir xil progress karta. */
export function Meter({ label, used, limit, remaining, unit }: { label: string; used: number; limit: number | null | undefined; remaining?: number | null; unit?: string }) {
  const unlimited = limit === null || limit === undefined
  const u = Math.max(0, used ?? 0)
  const pct = unlimited || !limit ? 0 : Math.min(100, Math.round((u / limit) * 100))
  const left = unlimited ? null : Math.max(0, remaining ?? (limit as number) - u)
  const exhausted = !unlimited && left !== null && left <= 0
  return (
    <article className={`${cardClass} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium text-foreground">{label}</h3>
        <Badge tone={exhausted ? 'red' : 'primary'}>{unlimited ? 'Cheksiz' : exhausted ? 'Tugagan' : 'Faol'}</Badge>
      </div>
      <p className="mt-4 text-4xl font-medium leading-none tracking-tight text-foreground tabular-nums">
        {u}
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">/ {unlimited ? '∞' : limit}</span>
      </p>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${exhausted ? 'bg-error' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2.5 text-xs font-medium text-primary">{unlimited ? 'Cheklov yo‘q' : `${left} ta ${unit ?? 'imkoniyat'} qoldi`}</p>
    </article>
  )
}
