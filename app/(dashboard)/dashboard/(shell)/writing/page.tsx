'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SkillPractice } from '@/components/dashboard/skill-practice'
import { post, errMsg } from '@/lib/api/dashboard'
import { btn } from '@/components/dashboard/ui'

function AiCheck({ id, reload }: { id: number; reload: () => void }) {
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

export default function WritingPage() {
  return (
    <SkillPractice
      title="Writing"
      desc="Yozma topshiriqlar va baholash natijalari"
      listPath="/writing-tests"
      resultsPath="/writing-tests/me/results"
      testBaseHref="/dashboard/writing"
      toTest={(t: any) => ({
        id: t.id, title: t.title, free: t.is_free,
        meta: [t.cefr_level, `${t.duration_minutes} daqiqa`, `${t.tasks?.length ?? 0} topshiriq`],
      })}
      toResult={(r: any) => ({
        id: r.id, date: r.created_at, score: r.is_finalized ? String(r.scaled_score ?? '—') : '—',
        level: r.cefr_level, note: r.evaluation_status,
      })}
      resultAction={(id, reload) => <AiCheck id={id} reload={reload} />}
    />
  )
}
