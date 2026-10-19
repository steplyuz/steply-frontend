'use client'

import { CheckCircle2 } from 'lucide-react'
import { SpeakingGradingNotice } from '@/components/dashboard/speaking-grading-notice'
import { SpeakingDownloads } from '@/components/dashboard/speaking-downloads'
import { btn } from '@/components/dashboard/ui'
import type { QuestionSnapshot, RecordingRef } from '@/lib/speaking/export'

export default function SpeakingComplete({
  title, questions, recordings, onExit,
}: {
  title: string
  questions: QuestionSnapshot[]
  recordings: Record<string, RecordingRef>
  onExit: () => void
}) {
  const done = questions.filter((q) => recordings[q.key]).length

  return (
    <div className="min-h-[80vh] bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-5 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(11,11,13,0.04)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Speaking yakunlandi</p>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{done} / {questions.length} savolga audio javob saqlandi</p>
          </div>
        </div>

        <SpeakingGradingNotice />

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Yuklab olish</h2>
          <SpeakingDownloads title={title} questions={questions} recordings={recordings} />
        </section>

        <div className="flex justify-end border-t border-border pt-4">
          <button type="button" className={btn.primary} onClick={onExit}>Speaking sahifasiga qaytish</button>
        </div>
      </div>
    </div>
  )
}
