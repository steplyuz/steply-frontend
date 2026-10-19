'use client'

import React from 'react'

/**
 * AdminPageShell
 * ==============
 * Barcha admin sahifalari uchun yagona page wrapper.
 * Sarlavha (eyebrow + h1 + description + actions) va
 * content area'ni bir xil tarzda render qiladi.
 *
 * Ishlatilishi:
 *   <AdminPageShell
 *     eyebrow="Tizim"
 *     title="Foydalanuvchilar"
 *     description="Barcha ro'yxatdan o'tgan foydalanuvchilar"
 *     actions={<button>...</button>}
 *   >
 *     {children}
 *   </AdminPageShell>
 */

interface AdminPageShellProps {
  /** "TIZIM · FOYDALANUVCHILAR" kabi kichik yuqori matn */
  eyebrow?: string
  /** Asosiy sarlavha */
  title: string
  /** Sarlavha ostidagi tavsif */
  description?: string
  /** O'ng tomondagi amallar (tugmalar, filtrlar) */
  actions?: React.ReactNode
  /** Sahifa tarkibi */
  children: React.ReactNode
  /** Sarlavhani va contentni ajratish uchun border-b bilan yopiq header kerakmi */
  headerBordered?: boolean
}

// globals.css dagi .container-shell bilan mos
const shell = 'mx-auto w-full max-w-7xl min-w-0 px-3 sm:px-5 lg:px-8'

export function AdminPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  headerBordered = true,
}: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── PAGE HEADER ───────────────────────────────────────── */}
      <header
        className={[
          'bg-card',
          headerBordered ? 'border-b border-border' : '',
        ].join(' ')}
      >
        <div className={`${shell} py-7 sm:py-9`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Left: eyebrow + title + description */}
            <div>
              {eyebrow && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {eyebrow}
                  </p>
                </div>
              )}

              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                {title}
              </h1>

              {description && (
                <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {/* Right: actions */}
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ──────────────────────────────────────── */}
      <main className={`${shell} py-7 sm:py-9`}>
        {children}
      </main>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   REUSABLE PRIMITIVES
   Barcha admin sahifalarda ishlatish uchun eksport qilinadi.
────────────────────────────────────────────────────────────── */

/** Status badge — admin sahifalarida bir xil ko'rinish uchun */
export function StatusBadge({
  label,
  colorClass,
}: {
  label: string
  colorClass: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-[10px] font-semibold',
        colorClass,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

/** Admin xato banneri */
export function AdminError({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <svg
        className="mt-0.5 size-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-semibold">Xatolik yuz berdi</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  )
}

/** Admin bo'sh holat */
export function AdminEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon?: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

/** Admin loading skeleton (table rows) */
export function AdminTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 animate-pulse rounded-lg bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Admin jadval wrapper */
export function AdminTable({
  headers,
  children,
}: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

/** Admin search input */
export function AdminSearch({
  value,
  onChange,
  placeholder = "Qidirish...",
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onSubmit?: () => void
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
    </div>
  )
}

/** Admin action tugmasi (outlined) */
export function AdminButton({
  children,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
  type = 'button',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  className?: string
}) {
  const base = 'inline-flex items-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'
  const sizes: Record<string, string> = {
    sm: 'h-8 rounded-xl px-3 text-xs',
    md: 'h-10 rounded-xl px-4 text-sm',
  }
  const variants: Record<string, string> = {
    default: 'border border-border bg-card text-foreground hover:border-foreground hover:bg-muted',
    primary: 'bg-foreground text-background hover:bg-foreground/90',
    danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[base, sizes[size], variants[variant], className].join(' ')}
    >
      {children}
    </button>
  )
}