'use client'

import { AlertTriangle, CheckCircle2, Lightbulb, MessageSquareWarning } from 'lucide-react'
import type { SpeakingAiEvaluation } from '@/lib/api/types'
import {
  PART_INFO, SEVERITY_LABEL, aggregate, analyseEvaluation, type AggregatePart, type Severity,
} from '@/lib/speaking/weakness'

const BAR: Record<Severity, string> = { weak: 'bg-red-500', medium: 'bg-amber-500', good: 'bg-emerald-500' }
const TEXT: Record<Severity, string> = { weak: 'text-red-700', medium: 'text-amber-700', good: 'text-emerald-700' }

function RatioBar({ ratio, severity, label }: { ratio: number; severity: Severity; label: string }) {
  const pct = Math.round(ratio * 100)
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
    >
      <div className={`h-full rounded-full ${BAR[severity]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Bitta baholash: qismlar bo'yicha kamchiliklar va tavsiyalar. */
export function SpeakingWeaknessPanel({ evaluation }: { evaluation: SpeakingAiEvaluation }) {
  const insights = analyseEvaluation(evaluation)
  if (!insights.length) return null
  const problems = insights.filter((i) => i.severity !== 'good' || i.offTopic.length > 0)

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-white p-5" aria-label="Kamchiliklar tahlili">
      <div className="flex items-center gap-3">
        <MessageSquareWarning className="size-5 text-foreground" />
        <h3 className="text-base font-bold text-foreground">Kamchiliklar tahlili</h3>
      </div>

      {problems.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> Barcha qismlar yaxshi baholandi. Katta kamchilik topilmadi.
        </p>
      )}

      <ul className="space-y-3">
        {insights.map((i) => {
          const info = PART_INFO[i.part]
          return (
            <li key={i.part} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">{info.title} <span className="font-medium text-muted-foreground">· {info.level}</span></p>
                <p className={`text-sm font-bold ${TEXT[i.severity]}`}>{i.score} / {i.max} · {SEVERITY_LABEL[i.severity]}</p>
              </div>
              <div className="mt-2"><RatioBar ratio={i.ratio} severity={i.severity} label={`${info.title}: ball`} /></div>

              {i.offTopic.length > 0 && (
                <p className="mt-3 flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {i.offTopic.map((n) => `${n}-savol`).join(', ')} javobi savol mavzusiga mos kelmadi ({i.offTopic.length} / {i.total}).
                  </span>
                </p>
              )}
              {i.feedback && <p className="mt-2 text-sm text-muted-foreground">{i.feedback}</p>}
              {i.severity !== 'good' && (
                <p className="mt-2 flex items-start gap-2 text-sm text-foreground/80">
                  <Lightbulb className="mt-0.5 size-4 shrink-0" /> <span>{info.tip}</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Barcha baholangan urinishlar bo'yicha umumiy ko'rinish: eng zaif qism birinchi. */
export function SpeakingWeaknessOverview({ evaluations }: { evaluations: SpeakingAiEvaluation[] }) {
  const parts: AggregatePart[] = aggregate(evaluations)
  if (!parts.length) return null
  const weakest = parts.find((p) => p.severity !== 'good')

  return (
    <div className="space-y-4">
      {weakest ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <p className="text-foreground/80">
            <span className="font-bold text-foreground">Eng zaif qism: {PART_INFO[weakest.part].title}.</span>{' '}
            {PART_INFO[weakest.part].tip}
          </p>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> Hamma qismlar bo‘yicha natijangiz yaxshi.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {parts.map((p) => (
          <li key={p.part} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">{PART_INFO[p.part].title}</p>
              <span className={`text-xs font-bold ${TEXT[p.severity]}`}>{SEVERITY_LABEL[p.severity]}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">
              {Math.round(p.avgRatio * 100)}<span className="text-sm font-semibold text-muted-foreground">%</span>
            </p>
            <div className="mt-2"><RatioBar ratio={p.avgRatio} severity={p.severity} label={`${PART_INFO[p.part].title}: o‘rtacha`} /></div>
            <p className="mt-2 text-xs text-muted-foreground">
              {p.attempts} ta baholash{p.offTopicRate > 0 && <> · mavzudan chetga chiqish: {Math.round(p.offTopicRate * 100)}%</>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
