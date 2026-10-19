'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Mic } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { loadHistory, type SpeakingAttemptRecord } from '@/lib/speaking/export'
import { SpeakingDownloads } from './speaking-downloads'
import { Empty, fmtDate } from './ui'

/** "Mening yozuvlarim": oxirgi urinishlar — savollar va audiolarni qayta yuklab olish. */
export function SpeakingHistory() {
  const { user } = useAuth()
  const [items, setItems] = useState<SpeakingAttemptRecord[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) setItems(loadHistory(String(user.id)))
  }, [user?.id])

  return (
    <section aria-labelledby="speaking-history-heading" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Arxiv</p>
        <h2 id="speaking-history-heading" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Mening yozuvlarim</h2>
      </div>

      {!items?.length ? (
        <Empty text="Hali yozuv yo‘q. Speaking testini yakunlaganingizda javoblaringiz va savollar shu yerda yuklab olish uchun saqlanadi." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {items.map((a, i) => {
            const isOpen = open === a.id
            const count = Object.keys(a.recordings).length
            return (
              <div key={a.id} className={i ? 'border-t border-border' : ''}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : a.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-muted sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-foreground"><Mic className="size-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(a.finishedAt)} · {count} / {a.questions.length} audio</p>
                    </div>
                  </div>
                  <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-background p-4 sm:px-6">
                    <SpeakingDownloads
                      title={a.title}
                      questions={a.questions}
                      recordings={Object.fromEntries(Object.entries(a.recordings).map(([k, v]) => [k, { submissionId: v.submissionId, ext: v.ext }]))}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
