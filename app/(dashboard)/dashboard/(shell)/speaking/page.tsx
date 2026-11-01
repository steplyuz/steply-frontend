'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { SkillPractice } from '@/components/dashboard/skill-practice'
import { SpeakingGradingNotice } from '@/components/dashboard/speaking-grading-notice'
import { SpeakingHistory } from '@/components/dashboard/speaking-history'
import { SpeakingLockedActions } from '@/components/dashboard/speaking-locked'
import { btn } from '@/components/dashboard/ui'
import { useSpeakingGrading } from '@/lib/speaking/access'

export default function SpeakingPage() {
  const access = useSpeakingGrading()
  return (
    <SkillPractice
      accessState={access.loading ? 'loading' : access.canGrade ? 'open' : 'locked'}
      lockedAction={(t: any) => <SpeakingLockedActions testId={t.id} title={t.title} />}
      title="Speaking"
      desc="Practice testlar va baholovchi natijalari"
      skill="speaking"
      resultsPath="/speaking-tests/me/results"
      testBaseHref="/dashboard/speaking"
      toTest={(t: any) => ({ id: t.id, title: t.title, free: t.is_free, meta: [] })}
      toResult={(r: any) => ({
        id: r.id, date: r.created_at, score: String(r.overall_band ?? '—'), level: r.cefr_level, note: r.comment,
      })}
      notice={(
        <div className="space-y-3">
          <SpeakingGradingNotice />
          <Link href="/dashboard/speaking/ai" className={btn.outline}>
            <Sparkles className="size-4" /> AI baholash va kamchiliklar
          </Link>
        </div>
      )}
      footer={<SpeakingHistory />}
    />
  )
}