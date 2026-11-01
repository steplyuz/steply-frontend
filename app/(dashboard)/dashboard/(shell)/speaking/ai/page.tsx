'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Mic, Sparkles } from 'lucide-react'
import { speakingApi } from '@/lib/api'
import type { SpeakingAiEvaluation } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { useAiQuota, useSpeakingGrading } from '@/lib/speaking/access'
import { attemptIdOf, loadHistory, type SpeakingAttemptRecord } from '@/lib/speaking/export'
import { SpeakingAiResult } from '@/components/dashboard/speaking-ai-result'
import { SpeakingWeaknessOverview, SpeakingWeaknessPanel } from '@/components/dashboard/speaking-weaknesses'
import { Badge, Empty, Loading, PageHeader, Section, Stat, btn, fmtDate } from '@/components/dashboard/ui'

type EvalState = SpeakingAiEvaluation | 'none'

export default function SpeakingAiPage() {
  const { user } = useAuth()
  const access = useSpeakingGrading()
  const quota = useAiQuota()
  const [items, setItems] = useState<SpeakingAttemptRecord[] | null>(null)
  const [evals, setEvals] = useState<Record<number, EvalState>>({})
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) setItems(loadHistory(String(user.id)).filter((a) => attemptIdOf(a) != null))
  }, [user?.id])

  // Mavjud baholashlarni yuklaymiz (baholanmaganlar 404 qaytaradi → 'none').
  useEffect(() => {
    if (!items?.length) return
    let alive = true
    items.forEach((a) => {
      const id = attemptIdOf(a)
      if (id == null) return
      speakingApi
        .aiEvaluation(id)
        .then((ev) => alive && setEvals((prev) => ({ ...prev, [id]: ev })))
        .catch(() => alive && setEvals((prev) => ({ ...prev, [id]: 'none' })))
    })
    return () => {
      alive = false
    }
  }, [items])

  const done = useMemo(
    () => Object.values(evals).filter((e): e is SpeakingAiEvaluation => e !== 'none' && e.status === 'done'),
    [evals],
  )
  const remaining = quota.quota?.remaining ?? null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Speaking AI baholash"
        desc="Urinishlaringizni AI bilan baholang va qaysi qismlarda kamchilik borligini ko‘ring."
        action={<Link href="/dashboard/speaking" className={btn.outline}><ArrowLeft className="size-4" /> Speaking testlari</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="AI kreditlar (Writing + Speaking)" value={quota.loading ? '…' : remaining ?? '—'} hint="Har bir AI baholash 1 kredit sarflaydi." />
        <Stat label="Baholangan urinishlar" value={done.length} />
        <Stat label="Arxivdagi urinishlar" value={items?.length ?? 0} />
      </div>

      {remaining !== null && remaining < 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/80"><span className="font-bold text-foreground">AI kreditlar tugagan.</span> Yangi baholash uchun tarifni yangilang yoki kredit sotib oling.</p>
          <Link href="/dashboard/billing" className={`${btn.primary} shrink-0`}>Tarifni ko‘rish</Link>
        </div>
      )}

      {!access.loading && !access.canGrade ? (
        <Empty text="Speaking AI baholash faqat Speaking kiritilgan faol obunada ishlaydi. Tarif sahifasidan obunani ko‘ring." />
      ) : (
        <>
          {done.length > 0 && (
            <Section title="Umumiy kamchiliklar" description="Barcha baholangan urinishlaringiz bo‘yicha o‘rtacha natija.">
              <SpeakingWeaknessOverview evaluations={done} />
            </Section>
          )}

          <Section title="Urinishlar" description="Urinishni oching: AI bilan baholang yoki oldingi natija va kamchiliklarni ko‘ring.">
            {items === null ? (
              <Loading rows={3} />
            ) : items.length === 0 ? (
              <Empty text="Hali baholash mumkin bo‘lgan urinish yo‘q. Speaking testini yakunlang — urinish shu yerda paydo bo‘ladi." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                {items.map((a, idx) => {
                  const attemptId = attemptIdOf(a)!
                  const isOpen = open === a.id
                  const state = evals[attemptId]
                  const ev = state && state !== 'none' ? state : null
                  return (
                    <div key={a.id} className={idx ? 'border-t border-border' : ''}>
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
                            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(a.finishedAt)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {ev?.status === 'done' ? (
                            <Badge tone="green">{ev.overall ? `${ev.overall.scaled} / 75` : 'Baholangan'}</Badge>
                          ) : ev?.status === 'failed' ? (
                            <Badge tone="red">Xato</Badge>
                          ) : ev ? (
                            <Badge>Jarayonda</Badge>
                          ) : state === 'none' ? (
                            <Badge><Sparkles className="mr-1 size-3" /> Baholanmagan</Badge>
                          ) : null}
                          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="space-y-4 border-t border-border bg-background p-4 sm:px-6">
                          <SpeakingAiResult
                            attemptId={attemptId}
                            onEvaluation={(e) => setEvals((prev) => ({ ...prev, [attemptId]: e }))}
                          />
                          {ev?.status === 'done' && <SpeakingWeaknessPanel evaluation={ev} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
