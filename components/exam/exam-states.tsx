'use client'

/**
 * Imtihon holat komponentlari: Loading, Error, Submitted, SkillHeader.
 * Hammasi brand tokenlar bilan.
 */

import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { TONES, type Tone } from '@/lib/brand'
import { EXAM_FOCUS as FOCUS } from '@/lib/exam-theme'

export function ExamLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div
        className="flex size-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'rgba(11,11,13,.06)' }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgba(11,11,13,.4)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'rgba(11,11,13,.5)' }}>
        {label ?? 'Yuklanmoqda...'}
      </p>
    </div>
  )
}

export function ExamError({ message, onBack }: { message: string; onBack?: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <div>
        <p className="font-semibold" style={{ color: '#0B0B0D' }}>Xatolik yuz berdi</p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${FOCUS}`}
          style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)', color: '#0B0B0D' }}
        >
          <ArrowLeft size={15} /> Orqaga qaytish
        </button>
      )}
    </div>
  )
}

export function ExamAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  )
}

export type ExamStat = { label: string; value: ReactNode; accent?: boolean }

/** Foiz bo'yicha doira (SVG): natija ekranining markaziy ko'rsatkichi. */
function ScoreRing({ percent }: { percent: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`Natija: ${Math.round(pct)} foiz`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E4F70A" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-background">
        <span className="text-4xl font-black tabular-nums leading-none tracking-tight">{Math.round(pct)}<span className="text-lg font-bold text-background/60">%</span></span>
      </div>
    </div>
  )
}

export function ExamSubmitted({
  skill, correct, total, percentage, cefrLevel, standardScore, stats, subtitle, children,
  onRetry, backHref, backLabel = "Bo'limga qaytish",
}: {
  skill: string
  correct?: number
  total?: number
  percentage?: number
  cefrLevel?: string | null
  standardScore?: number | null
  stats?: ExamStat[]
  subtitle?: ReactNode
  children?: ReactNode
  onRetry?: () => void
  backHref?: string
  backLabel?: string
  /** Eski chaqiruvlar bilan moslik; rang endi brand'dan olinadi. */
  tone?: Tone
}) {
  const hasScore = percentage !== undefined
  const computedStats: ExamStat[] | null = stats ?? (
    correct !== undefined || hasScore
      ? [
          { label: "To'g'ri", value: correct !== undefined && total !== undefined ? `${correct}/${total}` : '—' },
          { label: 'Foiz', value: hasScore ? `${Math.round(percentage as number)}%` : '—' },
          { label: 'Ball', value: standardScore ?? '—' },
          { label: 'CEFR', value: cefrLevel || '—', accent: true },
        ]
      : null
  )

  return (
    <div className="mx-auto max-w-xl space-y-6 py-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_14px_45px_-22px_rgba(0,0,0,0.25)]">
        {/* Hero */}
        <div className="relative overflow-hidden bg-foreground px-6 py-8 text-background">
          <div aria-hidden className="absolute -right-14 -top-14 size-52 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {hasScore ? <ScoreRing percent={percentage as number} /> : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground"><CheckCircle2 size={36} /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Yakunlandi</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{skill}</h2>
              <p className="mt-1.5 text-sm text-background/60">{subtitle ?? 'Natijalaringiz quyida'}</p>
              {cefrLevel && (
                <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-sm font-extrabold text-primary-foreground">
                  CEFR <span className="text-lg leading-none">{cefrLevel}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {computedStats && (
          <div className={`grid grid-cols-2 gap-px bg-border ${computedStats.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            {computedStats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 bg-white px-4 py-5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{s.label}</span>
                <span className={`text-2xl font-black capitalize leading-none tracking-tight tabular-nums ${s.accent ? 'text-foreground' : 'text-foreground'}`}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3 border-t border-border p-5">
          {children}
          {onRetry && (
            <button type="button" onClick={onRetry} className={`rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted ${FOCUS}`}>
              Qayta ishlash
            </button>
          )}
          {backHref && (
            <Link href={backHref} className={`inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover ${FOCUS}`}>
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
