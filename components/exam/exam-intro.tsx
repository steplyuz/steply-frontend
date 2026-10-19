'use client'

/**
 * Imtihon boshlash sahifasi (qoidalar + qurilma tekshiruvi).
 * Tekshiruv haqiqiy: mikrofon (getUserMedia + jonli daraja), ovoz chiqishi, internet — `preflight.tsx`.
 */

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, ListChecks, Loader2, Play, ShieldAlert } from 'lucide-react'
import { PreflightCheck, type PreflightNeeds } from './preflight'

const COMMON_RULES = [
  'Brauzerdan chiqmang va boshqa dasturlarni ochmang.',
  "Lug'at, shporgalka yoki aloqa vositalaridan foydalanmang.",
  "Imtihon davomida boshqalar bilan gaplashmang va yordam so'ramang.",
  "\"Tugatish\" tugmasini bosishdan oldin barcha savollarga javob berganingizga ishonch hosil qiling.",
  'Vaqt tugaganda belgilangan javoblar avtomatik yuboriladi.',
]

export function ExamIntro({
  skillLabel, icon, title, backHref,
  durationMinutes, questionCount, extraRules = [], requireMic = false, speaker = false, note, onStart, starting = false, error,
}: {
  skillLabel: string
  icon: ReactNode
  title: string
  /** Eski chaqiruvlar bilan moslik uchun qoldirilgan; rang endi brand'dan olinadi. */
  tone?: string
  backHref: string
  durationMinutes?: number | null
  questionCount?: number
  extraRules?: string[]
  requireMic?: boolean
  speaker?: boolean
  note?: ReactNode
  onStart: () => void
  starting?: boolean
  error?: string | null
}) {
  const [ready, setReady] = useState(false)
  const rules = [...extraRules, ...COMMON_RULES.filter((rule) => !(skillLabel.toLowerCase().includes('tinglab') && rule.startsWith('Vaqt tugaganda')))]
  const needs: PreflightNeeds = { mic: requireMic ? 'required' : 'optional', speaker }

  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_28px_rgba(11,11,13,0.04)]">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Link href={backHref} aria-label="Orqaga" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            <ArrowLeft size={16} />
          </Link>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-primary" aria-hidden>{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{skillLabel} · Boshlashdan oldin</p>
            <h1 className="truncate text-base font-bold tracking-tight text-foreground">{title}</h1>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {(durationMinutes || questionCount) && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-foreground">
              {!!durationMinutes && <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><Clock size={13} /> {durationMinutes} daqiqa</span>}
              {!!questionCount && <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5"><ListChecks size={13} /> {questionCount} ta savol</span>}
            </div>
          )}

          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground"><ShieldAlert size={15} className="text-error" /> Imtihon davomida:</h2>
            <ul className="space-y-1.5 text-sm text-foreground/75">
              {rules.map((r) => (
                <li key={r} className="flex items-start gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong" /><span>{r}</span></li>
              ))}
            </ul>
          </div>

          {note && <div className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs text-foreground/80">{note}</div>}

          <div>
            <h2 className="mb-2 text-sm font-bold text-foreground">Qurilmani tekshirish</h2>
            <PreflightCheck {...needs} onReadyChange={setReady} />
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            onClick={onStart}
            disabled={!ready || starting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-background transition hover:bg-foreground/90 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
          >
            {starting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} className="fill-current" />}
            {starting ? 'Urinish boshlanmoqda…' : 'Imtihonni boshlash'}
          </button>
          {!ready && <p className="text-center text-xs text-muted-foreground">Barcha majburiy tekshiruvlar o‘tgach, imtihonni boshlash mumkin.</p>}
        </div>
      </div>
    </div>
  )
}
