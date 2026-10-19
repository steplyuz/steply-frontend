'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkillPractice } from '@/components/dashboard/skill-practice'
import { SpeakingGradingNotice } from '@/components/dashboard/speaking-grading-notice'
import { SpeakingHistory } from '@/components/dashboard/speaking-history'
import { SpeakingLockedActions } from '@/components/dashboard/speaking-locked'
import { useSpeakingGrading } from '@/lib/speaking/access'

export default function SpeakingPage() {
  const access = useSpeakingGrading()
  return (
    <SkillPractice
      accessState={access.loading ? 'loading' : access.canGrade ? 'open' : 'locked'}
      lockedAction={(t: any) => <SpeakingLockedActions testId={t.id} title={t.title} />}
      title="Speaking"
      desc="Practice testlar va baholovchi natijalari"
      listPath="/speaking-tests/practice"
      resultsPath="/speaking-tests/me/results"
      testBaseHref="/dashboard/speaking"
      toTest={(t: any) => ({ id: t.id, title: t.title, free: t.is_free, meta: [] })}
      toResult={(r: any) => ({
        id: r.id, date: r.created_at, score: String(r.overall_band ?? '—'), level: r.cefr_level, note: r.comment,
      })}
      notice={<SpeakingGradingNotice />}
      footer={<SpeakingHistory />}
    />
  )
}