'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { post, errMsg } from '@/lib/api/legacy'
import { readingPracticeMinutes } from '@/lib/exam/lock'
import type { PracticeSkill } from '@/lib/api/types'
import { btn } from './ui'

export type HubTest = { id: string; title: string; free?: boolean; meta: (string | null | undefined)[] }
export type HubResult = { id: number; date: string; score: string; level?: string | null; note?: string | null }

export function AiCheck({ id, reload }: { id: number; reload: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        className={btn.outline}
        disabled={busy}
        onClick={async () => {
          setBusy(true); setErr('')
          try { await post(`/writing-tests/results/${id}/ai-check`, {}); reload(); router.push(`/dashboard/writing/results/${id}`) }
          catch (e) { setErr(errMsg(e)) }
          finally { setBusy(false) }
        }}
      >
        {busy ? 'Tekshirilmoqda…' : 'AI tekshiruv'}
      </button>
      <Link href={`/dashboard/writing/results/${id}`} className="text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">Natijani ko‘rish</Link>
      {err && <span className="max-w-48 text-right text-xs text-red-600 dark:text-red-400">{err}</span>}
    </div>
  )
}

type Cfg = {
  label: string
  desc: string
  resultsPath: string
  testBaseHref: string
  toTest: (t: any) => HubTest
  toResult: (r: any) => HubResult
  resultAction?: (id: number, reload: () => void) => ReactNode
}

export const PRACTICE_CONFIG: Record<PracticeSkill, Cfg> = {
  reading: {
    label: 'Reading',
    desc: 'Matnlar va savollar bo‘yicha mashq',
    resultsPath: '/reading-tests/me/results',
    testBaseHref: '/dashboard/reading',
    toTest: (t) => ({
      id: t.id, title: t.title, free: t.is_free,
      meta: [t.practice_part_number ? `Part ${t.practice_part_number}` : null, t.cefr_level, `${readingPracticeMinutes(t)} daqiqa`, `${t.total_questions} savol`],
    }),
    toResult: (r) => ({
      id: r.id, date: r.created_at, score: String(r.standard_score ?? '—'), level: r.cefr_level,
      note: `${r.correct_answers}/${r.total_questions} to‘g‘ri · ${Math.round(r.percentage ?? 0)}%`,
    }),
  },
  listening: {
    label: 'Listening',
    desc: 'Audio testlar bo‘yicha mashq',
    resultsPath: '/listening-tests/me/results',
    testBaseHref: '/dashboard/listening',
    toTest: (t) => ({
      id: t.id, title: t.title, free: t.is_free,
      meta: [t.cefr_level, t.duration_minutes ? `${t.duration_minutes} daqiqa` : null, t.total_questions ? `${t.total_questions} savol` : null],
    }),
    toResult: (r) => ({
      id: r.id, date: r.created_at, score: String(r.standard_score ?? '—'), level: r.cefr_level,
      note: `${Math.round(r.percentage ?? 0)}%`,
    }),
  },
  writing: {
    label: 'Writing',
    desc: 'Yozma topshiriqlar va baholash',
    resultsPath: '/writing-tests/me/results',
    testBaseHref: '/dashboard/writing',
    toTest: (t) => ({
      id: t.id, title: t.title, free: t.is_free,
      meta: [t.cefr_level, t.duration_minutes ? `${t.duration_minutes} daqiqa` : null, `${t.total_questions ?? 0} topshiriq`],
    }),
    toResult: (r) => ({
      id: r.id, date: r.created_at, score: r.is_finalized ? String(r.scaled_score ?? '—') : '—',
      level: r.cefr_level, note: r.evaluation_status,
    }),
    resultAction: (id, reload) => <AiCheck id={id} reload={reload} />,
  },
  speaking: {
    label: 'Speaking',
    desc: 'Ovoz yozish va baholovchi natijalari',
    resultsPath: '/speaking-tests/me/results',
    testBaseHref: '/dashboard/speaking',
    toTest: (t) => ({ id: t.id, title: t.title, free: t.is_free, meta: [] }),
    toResult: (r) => ({
      id: r.id, date: r.created_at, score: String(r.overall_band ?? '—'), level: r.cefr_level, note: r.comment,
    }),
  },
}

export const SKILL_ORDER: PracticeSkill[] = ['reading', 'listening', 'writing', 'speaking']
