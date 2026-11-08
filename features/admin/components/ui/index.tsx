import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ElementType, ReactNode } from 'react'
import { adminCard, adminToneClasses, type AdminTone } from './styles'

/** Xabar (xato, muvaffaqiyat, ogohlantirish, ma'lumot). */
export function AdminAlert({ tone = 'error', children, className = '' }: { tone?: AdminTone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${adminToneClasses[tone]} ${className}`}>
      {children}
    </div>
  )
}

/** Bo'lim kartasi: sarlavha, izoh va mazmun. */
export function AdminSection({ title, description, children, className = '' }: { title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 ${adminCard} ${className}`}>
      {(title || description) && (
        <header className="space-y-1">
          {title && <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

/** Holat belgisi (status pill). */
export function AdminBadge({ tone = 'info', children }: { tone?: AdminTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${adminToneClasses[tone]}`}>
      {children}
    </span>
  )
}

/** Statistika kartasi (dashboard, ro'yxat sahifalari ustidagi qisqa ko'rsatkichlar). */
export function AdminStatCard({
  label, value, icon: Icon, loading = false, hint,
}: {
  label: string
  value: ReactNode
  icon?: ElementType
  loading?: boolean
  hint?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-foreground/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{value}</p>
      )}
      {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export interface AdminFilterOption {
  key: string
  label: string
  count?: number
}

/** Filtr tablari (kategoriya / holat): faol tab to'q, yonida soni ko'rsatiladi. */
export function AdminFilterTabs({
  options, value, onChange, label,
}: {
  options: AdminFilterOption[]
  value: string
  onChange: (key: string) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {options.map(opt => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`inline-flex h-8 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors ${
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? 'bg-background/20' : 'bg-muted'}`}>{opt.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Test tahrirlash sahifalari (Reading / Listening / Writing) uchun yagona yuqori panel.
 * Admin topbar ostida yopishib turadi (topbar bilan ustma-ust tushmaydi).
 */
export function AdminEditorBar({
  backHref, title, subtitle, status, saveState, actions,
}: {
  backHref: string
  title: ReactNode
  subtitle?: ReactNode
  status?: ReactNode
  saveState?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="sticky top-[var(--admin-topbar-h,72px)] z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Orqaga"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {status}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveState && <span className="mr-1 text-xs text-muted-foreground" aria-live="polite">{saveState}</span>}
          {actions}
        </div>
      </div>
    </div>
  )
}
