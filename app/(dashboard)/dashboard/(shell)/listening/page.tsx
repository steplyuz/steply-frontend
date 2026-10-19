'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkillPractice } from '@/components/dashboard/skill-practice'

export default function ListeningPage() {
  return (
    <SkillPractice
      title="Listening"
      desc="Audio testlar va natijalaringiz"
      listPath="/listening-tests"
      resultsPath="/listening-tests/me/results"
      testBaseHref="/dashboard/listening"
      toTest={(t: any) => ({
        id: t.id, title: t.title, free: t.is_free,
        meta: [t.level, `${t.duration} daqiqa`, `${t.total_questions} savol`],
      })}
      toResult={(r: any) => ({
        id: r.id, date: r.created_at, score: String(r.standard_score ?? '—'), level: r.cefr_level,
        note: `${Math.round(r.percentage ?? 0)}%`,
      })}
    />
  )
}
