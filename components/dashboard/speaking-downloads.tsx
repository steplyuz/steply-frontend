'use client'

import { useState } from 'react'
import { Download, FileArchive, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  downloadAllZip, downloadQuestions, downloadRecording, recordingFilename,
  type QuestionSnapshot, type RecordingRef,
} from '@/lib/speaking/export'
import { btn } from './ui'

/** Savollar (.txt), har bir audio va hammasi (.zip) — imtihon yakunida ham, tarixda ham bir xil ishlaydi. */
export function SpeakingDownloads({
  title, questions, recordings, showPerQuestion = true,
}: {
  title: string
  questions: QuestionSnapshot[]
  recordings: Record<string, RecordingRef>
  showPerQuestion?: boolean
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const recorded = questions.filter((q) => recordings[q.key]).length

  const run = async (id: string, fn: () => Promise<void> | void) => {
    setBusy(id)
    try { await fn() } catch (e) { toast.error(e instanceof Error ? e.message : 'Yuklab olishda xatolik') } finally { setBusy(null) }
  }

  const zip = () => run('zip', async () => {
    const { added, failed } = await downloadAllZip(title, questions, recordings)
    if (failed) toast.warning(`${added} ta audio qo‘shildi, ${failed} tasini olib bo‘lmadi.`)
    else toast.success('ZIP yuklab olindi')
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.outline} onClick={() => downloadQuestions(title, questions)}>
          <FileText className="size-4" /> Savollar (.txt)
        </button>
        <button type="button" className={btn.primary} disabled={!recorded || busy === 'zip'} onClick={zip}>
          {busy === 'zip' ? <Loader2 className="size-4 animate-spin" /> : <FileArchive className="size-4" />}
          Hammasi (.zip){recorded ? ` · ${recorded} audio` : ''}
        </button>
      </div>

      {showPerQuestion && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {questions.map((q, i) => {
            const ref = recordings[q.key]
            return (
              <li key={q.key} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{q.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{q.text.split('\n')[0]}</p>
                </div>
                {ref ? (
                  <button
                    type="button"
                    className={`${btn.outline} !min-h-9 shrink-0 !px-3 !py-1.5 text-xs`}
                    disabled={busy === q.key}
                    onClick={() => run(q.key, () => downloadRecording(ref, recordingFilename(title, i, q.label, ref.ext)))}
                  >
                    {busy === q.key ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Audio
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Yozilmagan</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
