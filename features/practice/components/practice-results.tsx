'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useApi } from '@/shared/api/use-api'
import type { PracticeSkill } from '@/shared/api/types'
import { FOCUS } from '@/shared/lib/brand'
import { Badge, Empty, ErrorBox, Loading, fmtDate } from '@/shared/ui/dashboard-kit'
import { PRACTICE_CONFIG, SKILL_ORDER } from './practice-config'
import { SKILLS } from './skill-practice'

type Filter = 'all' | PracticeSkill

export function PracticeResults({ initial = 'all' }: { initial?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initial)

  const reading = useApi<any[]>(PRACTICE_CONFIG.reading.resultsPath)
  const listening = useApi<any[]>(PRACTICE_CONFIG.listening.resultsPath)
  const writing = useApi<any[]>(PRACTICE_CONFIG.writing.resultsPath)
  const speaking = useApi<any[]>(PRACTICE_CONFIG.speaking.resultsPath)

  const sources = { reading, listening, writing, speaking } as const
  const loading = SKILL_ORDER.some((s) => sources[s].loading)
  const error = SKILL_ORDER.map((s) => sources[s].error).find(Boolean)

  const rows = SKILL_ORDER.flatMap((skill) => {
    const cfg = PRACTICE_CONFIG[skill]
    return (sources[skill].data ?? []).map((raw) => {
      const r = cfg.toResult(raw)
      return { skill, r, action: cfg.resultAction?.(r.id, sources[skill].reload) }
    })
  })
    .filter((row) => filter === 'all' || row.skill === filter)
    .sort((a, b) => new Date(b.r.date).getTime() - new Date(a.r.date).getTime())

  const tabs: Filter[] = ['all', ...SKILL_ORDER]

  return (
    <div className="space-y-6 pb-6">
      <Link
        href="/dashboard"
        className={`-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-foreground/65 transition hover:bg-[#0F3D26]/[0.07] hover:text-foreground ${FOCUS}`}
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Kabinetga qaytish
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Mening natijalarim
      </h1>

      <div role="tablist" aria-label="Ko'nikmalar" className="flex gap-2 overflow-x-auto rounded-full bg-white p-1.5 ring-1 ring-[#0F3D26]/[0.06]">
        {tabs.map((f) => {
          const on = f === filter
          const label = f === 'all' ? 'Barchasi' : PRACTICE_CONFIG[f].label
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition motion-reduce:transition-none ${on ? 'bg-primary-strong text-white' : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'} ${FOCUS}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <Loading rows={3} />
      ) : error ? (
        <ErrorBox message={error.message} />
      ) : !rows.length ? (
        <Empty text="Hali natija yo'q. Birinchi testni yakunlaganingizdan so'ng natijangiz shu yerda chiqadi." />
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {rows.map(({ skill, r, action }) => {
            const { tint, accent } = SKILLS[skill]
            return (
              <li
                key={`${skill}-${r.id}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-3xl bg-white p-4 ring-1 ring-[#0F3D26]/[0.06] sm:px-6 sm:py-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: tint, color: accent }}>
                    <CheckCircle2 aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {PRACTICE_CONFIG[skill].label} · {fmtDate(r.date)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.note || 'Test yakunlandi'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  {r.level && <Badge tone="primary">{r.level}</Badge>}
                  <div className="min-w-14 rounded-2xl px-3 py-1.5 text-center" style={{ background: tint }}>
                    <p className="font-display text-xl font-semibold leading-tight tabular-nums text-foreground">{r.score}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">ball</p>
                  </div>
                  {action}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}