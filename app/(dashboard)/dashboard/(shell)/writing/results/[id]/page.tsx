'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileDown, GraduationCap, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { billingApi, writingApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { WritingResult } from '@/lib/api/types'
import { Badge, ErrorBox, Loading, PageHeader, Section, btn } from '@/components/dashboard/ui'

type FeedbackDetail = {
  summary?: string
  rubric_results?: Record<string, { scores?: Record<string, number>; total_raw_16?: number; band_score?: number; comments?: Record<string, string>; total?: number }>
  errors?: Array<{ original?: string; correction?: string; explanation?: string }>
  corrected_text?: string
  word_count?: number
  word_penalty?: number
  minimum_word_rule_triggered?: boolean
}
function statusLabel(status: string | null | undefined): string {
  if (status === 'AI_DRAFT') return 'AI qoralama'
  if (status === 'HUMAN_FINAL') return 'Yakunlangan'
  return 'Baholash kutilmoqda'
}

function parseFeedback(content: string): FeedbackDetail | null {
  try {
    const value = JSON.parse(content)
    if (value && typeof value === 'object' && ('summary' in value || 'rubric_results' in value || 'errors' in value)) return value
  } catch {}
  return null
}

export default function WritingResultPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params?.id)
  const [result, setResult] = useState<WritingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)

  const loadResult = useCallback(async () => {
    if (!Number.isInteger(id) || id < 1) {
      setError('Natija ID noto‘g‘ri.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setResult(await writingApi.result(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Natijani yuklab bo‘lmadi.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void loadResult() }, [loadResult])
  useEffect(() => {
    let alive = true
    billingApi.myLimits().then(value => { if (alive) setQuotaRemaining(value.ai?.remaining ?? null) }).catch(() => { if (alive) setQuotaRemaining(null) })
    return () => { alive = false }
  }, [result?.id, result?.ai_evaluated_at])

  async function runAiCheck() {
    if (!result || busy) return
    setBusy(true)
    setError('')
    try {
      const updated = await writingApi.aiCheck(result.id)
      setResult(updated)
      const limits = await billingApi.myLimits().catch(() => null)
      setQuotaRemaining(limits?.ai?.remaining ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI tekshiruvi bajarilmadi.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadPdf() {
    if (!result || busy) return
    await authenticatedDownload(writingApi.resultPdfUrl(result.id), {
      filename: `writing-${result.id}-analysis.pdf`,
      onError: (message) => setError(message),
    })
  }

  async function requestTeacher() {
    if (!result || busy) return
    setBusy(true)
    setError('')
    try {
      // POST /writing-tests/results/{id}/request-teacher-check — pullik teacher-review krediti sarflanadi
      setResult(await writingApi.requestTeacherCheck(result.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ustozga yuborib bo‘lmadi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/writing" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-white hover:text-foreground"><ArrowLeft className="size-4" /> Writing bo‘limiga qaytish</Link>
        <button type="button" onClick={() => void loadResult()} disabled={loading || busy} className={btn.outline}><RefreshCw className="size-4" /> Yangilash</button>
      </div>
      <PageHeader title={`Writing natijasi #${Number.isFinite(id) ? id : '—'}`} desc="Javoblaringiz, AI tahlili, mezonlar va tuzatishlar." />
      {loading ? <Loading rows={4} /> : error && !result ? <ErrorBox message={error} onRetry={() => void loadResult()} /> : result ? (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-foreground p-6 text-background sm:p-8">
            <div aria-hidden className="absolute -right-12 -top-16 size-60 rounded-full bg-primary/20 blur-[80px]" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{statusLabel(result.evaluation_status)}</p>
                <p className="mt-3 text-6xl font-bold tabular-nums tracking-[-0.05em]">{result.is_finalized && result.scaled_score != null ? result.scaled_score : '—'}</p>
                <p className="mt-1 text-sm text-background/60">Writing bahosi</p>
              </div>
              <span className="rounded-2xl bg-primary px-5 py-3 text-center text-primary-foreground">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">CEFR</span>
                <span className="block text-3xl font-extrabold leading-none">{result.cefr_level || '—'}</span>
              </span>
            </div>
          </section>

          <Section title="AI Writing tekshiruvi" description="Tekshiruv mavjud AI kvotasi yoki xarid qilingan kreditlardan foydalanadi. Takroriy so‘rov saqlangan AI natijasini qaytaradi.">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
              <button type="button" onClick={() => void runAiCheck()} disabled={busy} className={`${btn.primary} disabled:opacity-60`}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy ? 'Tekshirilmoqda…' : 'AI bilan tekshirish'}</button>
              <span className="text-sm text-muted-foreground">Qolgan AI tekshiruvlari: {quotaRemaining ?? 'aniqlanmadi'}</span>
              <button type="button" onClick={() => void downloadPdf()} disabled={busy} className={`${btn.outline} disabled:opacity-60`}>
                <FileDown className="size-4" /> PDF yuklab olish
              </button>
              {!result.is_finalized && result.evaluation_status !== 'HUMAN_FINAL' && (
                <button type="button" onClick={() => void requestTeacher()} disabled={busy} className={`${btn.outline} disabled:opacity-60`}>
                  <GraduationCap className="size-4" /> Ustozga tekshirtirish
                </button>
              )}
            </div>
            {error && <div className="mt-3"><ErrorBox message={error} /></div>}
          </Section>

          <Section title="Javoblar va tahlil">
            <div className="space-y-4">
              {result.answers.map((answer, index) => {
                const feedbacks = answer.feedbacks?.filter(item => item.source === 'AI') ?? []
                return (
                  <article key={answer.id} className="rounded-2xl border bg-card p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-bold">Task {index + 1}</h3><p className="mt-1 text-xs text-muted-foreground">{answer.word_count} so‘z · Jarima: {answer.penalty ?? 0}</p></div>
                      <div className="flex flex-wrap gap-2">{answer.raw_score != null && <Badge tone="primary">{answer.raw_score} raw ball</Badge>}{feedbacks.length > 0 && <Badge tone="green">AI tekshirildi</Badge>}</div>
                    </div>
                    <div className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm leading-6">{answer.content || 'Javob kiritilmagan.'}</div>
                    {answer.scores?.length > 0 && <dl className="mt-3 grid gap-2 sm:grid-cols-2">{answer.scores.map(score => <div key={score.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"><dt className="text-muted-foreground">{score.criterion.replaceAll('_', ' ')}</dt><dd className="font-bold">{score.score}/15</dd></div>)}</dl>}
                    {feedbacks.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Bu javob uchun AI tahlili hali yo‘q.</p> : feedbacks.map(feedback => {
                      const detail = parseFeedback(feedback.content)
                      if (!detail) return <p key={feedback.id} className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm">{feedback.content}</p>
                      return <div key={feedback.id} className="mt-4 space-y-3">
                        {detail.summary && <section className="rounded-2xl border border-border bg-white p-4"><h4 className="font-semibold">Umumiy tahlil</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{detail.summary}</p></section>}
                        {detail.rubric_results && Object.entries(detail.rubric_results).map(([key, rubric]) => <section key={key} className="rounded-2xl border border-border bg-white p-4"><h4 className="font-semibold">{key === 'national' ? 'Milliy baholash mezoni' : key === 'english_band' ? 'English band bahosi' : key.replaceAll('_', ' ')}</h4>{rubric.total_raw_16 != null && <p className="mt-2 text-sm">Milliy rubrika: <strong>{rubric.total_raw_16}/16</strong></p>}{rubric.band_score != null && <p className="mt-2 text-sm">English band: <strong>{rubric.band_score}/9</strong></p>}{rubric.scores && <dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(rubric.scores).map(([name, score]) => <div key={name} className="flex justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"><dt>{name.replaceAll('_', ' ')}</dt><dd className="font-bold">{score}</dd></div>)}</dl>}{rubric.comments && Object.entries(rubric.comments).map(([name, comment]) => <p key={name} className="mt-2 text-sm"><strong>{name.replaceAll('_', ' ')}:</strong> {comment}</p>)}</section>)}
                        {!!detail.errors?.length && <section><h4 className="mb-2 font-semibold">Aniqlangan xatolar</h4><div className="space-y-2">{detail.errors.map((item, errorIndex) => <div key={errorIndex} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p><strong>Asl:</strong> {item.original || '—'}</p><p className="mt-1"><strong>Tuzatish:</strong> {item.correction || '—'}</p><p className="mt-1">{item.explanation || 'Izoh berilmagan.'}</p></div>)}</div></section>}
                        {detail.corrected_text && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h4 className="font-semibold">Yaxshilangan matn</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{detail.corrected_text}</p></section>}
                        <p className="text-xs text-muted-foreground">So‘zlar: {detail.word_count ?? answer.word_count}{detail.word_penalty ? ` · So‘z soni jarimasi: ${detail.word_penalty}` : ''}{detail.minimum_word_rule_triggered ? ' · Minimal so‘z talabi bajarilmagan' : ''}</p>
                      </div>
                    })}
                  </article>
                )
              })}
            </div>
          </Section>
        </>
      ) : null}
    </div>
  )
}