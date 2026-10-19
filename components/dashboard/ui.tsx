import type { ReactNode } from 'react'

import { FOCUS } from '@/lib/brand'

// Fokus halqasi butun kabinetda bir xil (lib/brand) — lime och fonda ko'rinmaydi, shuning uchun to'q rang.
export { FOCUS }

export const btn = {
  primary: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`,
  outline: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-border-strong hover:bg-muted disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`,
  danger: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`,
}

export const input =
  'w-full min-h-11 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm shadow-foreground/[0.02] placeholder:text-muted-foreground/70 transition focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60'

const TONES = {
  primary: 'bg-[#E4F70A]/35 text-foreground',
  muted: 'bg-foreground/[0.06] text-foreground/65',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/15',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15',
}
export type Tone = keyof typeof TONES

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none tracking-wide ${TONES[tone]}`}>{children}</span>
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">STEPLY · KABINET</p>
        <h1 className="text-[1.8rem] font-extrabold leading-tight tracking-[-0.045em] text-foreground sm:text-3xl lg:text-[2.1rem]">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">{desc}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  )
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-[-0.025em] text-foreground sm:text-xl">{title}</h2>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="group surface rounded-2xl p-5 shadow-[0_5px_20px_rgba(11,11,13,0.025)] transition-shadow hover:shadow-[0_10px_28px_rgba(11,11,13,0.055)] sm:p-6">
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-[1.9rem] font-extrabold leading-none tracking-[-0.05em] text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-2.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const Empty = ({ text }: { text: string }) => (
  <div className="surface rounded-2xl border-dashed bg-white px-5 py-10 text-center text-sm text-muted-foreground sm:py-12">{text}</div>
)

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className={`${btn.outline} shrink-0 border-red-500/40`}>Qayta urinish</button>}
    </div>
  )
}

export const Loading = ({ rows = 2 }: { rows?: number }) => (
  <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-white p-4 before:block before:h-3 before:w-1/3 before:rounded before:bg-muted before:content-[''] after:mt-4 after:block after:h-5 after:w-2/3 after:rounded after:bg-muted after:content-['']" />)}
  </div>
)

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-2 text-sm font-semibold text-foreground">
    <span>{label}</span>
    {children}
  </label>
)

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('uz-UZ') : '—')
export const fmtMoney = (n?: number | null) => (n == null ? '—' : `${n.toLocaleString('uz-UZ')} so‘m`)

/** Limit / sarf ko'rsatkichi: butun kabinetda bir xil progress karta. */
export function Meter({ label, used, limit, remaining, unit }: { label: string; used: number; limit: number | null | undefined; remaining?: number | null; unit?: string }) {
  const unlimited = limit === null || limit === undefined
  const u = Math.max(0, used ?? 0)
  const pct = unlimited || !limit ? 0 : Math.min(100, Math.round((u / limit) * 100))
  const left = unlimited ? null : Math.max(0, remaining ?? (limit as number) - u)
  const exhausted = !unlimited && left !== null && left <= 0
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-[0_4px_16px_rgba(11,11,13,0.02)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <Badge tone={exhausted ? 'red' : 'muted'}>{unlimited ? 'Cheksiz' : exhausted ? 'Tugagan' : 'Faol'}</Badge>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
        {u}<span className="ml-1 text-sm font-medium text-muted-foreground">/ {unlimited ? '∞' : limit}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-[width] ${exhausted ? 'bg-error' : 'bg-foreground'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{unlimited ? 'Cheklov yo‘q' : `${left} ta ${unit ?? 'imkoniyat'} qoldi`}</p>
    </article>
  )
}
