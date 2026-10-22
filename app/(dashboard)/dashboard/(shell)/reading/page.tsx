'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkillPractice } from '@/components/dashboard/skill-practice'
import { readingPracticeMinutes } from '@/lib/exam-lock'

export default function ReadingPage() {
  return (
    <SkillPractice
      title="Reading"
      desc="Practice testlar va natijalaringiz"
      listPath="/reading-tests"
      resultsPath="/reading-tests/me/results"
      testBaseHref="/dashboard/reading"
      toTest={(t: any) => ({
        id: t.id, title: t.title, free: t.is_free,
        meta: [t.practice_part_number ? `Part ${t.practice_part_number} mini-test` : null, t.cefr_level, `${readingPracticeMinutes(t)} daqiqa`, `${t.total_questions} savol`].filter(Boolean),
      })}
      toResult={(r: any) => ({
        id: r.id, date: r.created_at, score: String(r.standard_score ?? '—'), level: r.cefr_level,
        note: `${r.correct_answers}/${r.total_questions} to‘g‘ri · ${Math.round(r.percentage ?? 0)}%`,
      })}
    />
  )
}
