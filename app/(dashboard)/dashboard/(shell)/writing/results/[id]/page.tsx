'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Download, RefreshCw, Sparkles, UserCheck } from 'lucide-react'
import { getErrorMessage, writingApi } from '@/shared/api'
import type { WritingResult } from '@/shared/api/types'
import { Card, ErrorBox, Loading, btn } from '@/shared/ui/dashboard-kit'

type Answer = WritingResult['answers'][number]

function formatScore(value: number | null | undefined, max: number) {
  return value == null ? '—' : `${value} / ${max}`
}

function sourceLabel(source: string | null | undefined) {
  if (source === 'AI') return 'AI'
  if (source === 'HUMAN') return 'O‘qituvchi'
  return '—'
}

function ScoreBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function AnswerCard({ answer, index }: { answer: Answer; index: number }) {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Javob {index + 1}</h2>
        <p className="text-xs text-muted-foreground">
          So‘zlar soni: <span className="font-semibold tabular-nums">{answer.word_count}</span>
          {answer.penalty ? <> · Jarima: <span className="font-semibold tabular-nums">{answer.penalty}</span></> : null}
        </p>
      </div>

      <pre
        data-no-i18n
        className="whitespace-pre-wrap break-words rounded-2xl bg-muted/50 p-4 font-sans text-sm leading-6"
      >
        {answer.content}
      </pre>

      {answer.scores.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Mezonlar</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {answer.scores.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <span>{s.criterion}</span>
                <span className="font-semibold tabular-nums">{s.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.feedbacks.map((f) => (
        <div key={f.id} className="rounded-2xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {f.source === 'AI' ? 'AI tahlili' : 'O‘qituvchi izohi'}
            {f.model_name ? ` · ${f.model_name}` : ''}
          </p>
          <p data-no-i18n className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {f.content}
          </p>
        </div>
      ))}
    </Card>
  )
}

export default function WritingResultPage() {
  const params = useParams<{ id: string }>()
  const resultId = Number(params?.id)
  const valid = Number.isInteger(resultId) && resultId > 0

  const [result, setResult] = useState<WritingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'' | 'ai' | 'teacher'>('')
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      setResult(await writingApi.result(resultId))
    } catch (e) {
      setError(getErrorMessage(e, 'Natijani yuklab bo‘lmadi'))
    } finally {
      setLoading(false)
    }
  }, [resultId, valid])

  useEffect(() => {
    void load()
  }, [load])

  async function runAction(kind: 'ai' | 'teacher') {
    if (!result) return
    setAction(kind)
    setActionError('')
    try {
      const next =
        kind === 'ai'
          ? await writingApi.aiCheck(result.id)
          : await writingApi.requestTeacherCheck(result.id)
      setResult(next)
    } catch (e) {
      setActionError(getErrorMessage(e, 'Amalni bajarib bo‘lmadi'))
    } finally {
      setAction('')
    }
  }

  const back = (
    <Link
      href="/dashboard/practice/results?skill=writing"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Natijalar ro‘yxatiga qaytish
    </Link>
  )

  if (!valid) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
        {back}
        <ErrorBox message="Noto‘g‘ri natija identifikatori" />
      </div>
    )
  }

  if (loading && !result) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
        {back}
        <Loading rows={3} />
      </div>
    )
  }

  if (error && !result) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
        {back}
        <ErrorBox message={error} onRetry={load} />
      </div>
    )
  }

  if (!result) return null

  const canPdf = result.is_finalized || Boolean(result.ai_evaluated_at)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
      {back}

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Writing</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Writing natijasi <span className="font-mono text-base text-muted-foreground">#{result.id}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(result.created_at).toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-primary px-4 py-2 text-lg font-semibold text-foreground">
              {result.cefr_level ?? '—'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                result.is_finalized
                  ? 'bg-emerald-500/15 text-emerald-700'
                  : 'bg-amber-500/15 text-amber-700'
              }`}
            >
              {result.is_finalized ? 'Yakunlangan' : 'Baholanmoqda'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ScoreBox label="Xom ball" value={formatScore(result.raw_score, 16)} />
          <ScoreBox label="Yakuniy ball" value={formatScore(result.scaled_score, 75)} />
          <ScoreBox label="Baho manbai" value={sourceLabel(result.evaluation_source)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!result.is_finalized && (
            <button
              type="button"
              className={btn.primary}
              disabled={action !== ''}
              aria-busy={action === 'ai'}
              onClick={() => runAction('ai')}
            >
              <Sparkles aria-hidden="true" className="size-4" />
              {action === 'ai' ? 'Tekshirilmoqda…' : 'AI tekshiruvni boshlash'}
            </button>
          )}

          {!result.is_finalized && (
            <button
              type="button"
              className={btn.outline}
              disabled={action !== ''}
              aria-busy={action === 'teacher'}
              onClick={() => runAction('teacher')}
            >
              <UserCheck aria-hidden="true" className="size-4" />
              O‘qituvchi tekshiruvini so‘rash
            </button>
          )}

          {canPdf && (
            <a
              href={writingApi.resultPdfUrl(result.id)}
              target="_blank"
              rel="noopener noreferrer"
              className={btn.outline}
            >
              <Download aria-hidden="true" className="size-4" />
              PDF yuklab olish
            </a>
          )}

          <button type="button" className={btn.outline} onClick={load} disabled={loading}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Yangilash
          </button>
        </div>

        {actionError && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}
      </Card>

      <section className="space-y-4">
        {result.answers.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Javoblar topilmadi</Card>
        ) : (
          result.answers.map((answer, i) => <AnswerCard key={answer.id} answer={answer} index={i} />)
        )}
      </section>
    </div>
  )
}
