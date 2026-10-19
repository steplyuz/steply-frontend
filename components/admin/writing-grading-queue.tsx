'use client'

import { useCallback, useEffect, useState } from 'react'
import { writingApi } from '@/lib/api'
import { ApiRequestError } from '@/lib/api/client'
import { AdminButton, AdminEmpty, AdminError } from '@/components/layout/admin-page-shell'
import type { WritingAnswerResult, WritingFeedback, WritingResult } from '@/lib/api/types'

// Backend (2025 multilevel format): raw_score = 1.1 (0–5) + 1.2 (0–5) + 2 (0–6) = 0–16. Yakuniy ball (0–75) serverda hisoblanadi.
const RAW_MAX = 16

type CefrLevel = 'B1' | 'B2' | 'C1'
type GradeDraft = { score: string; level: CefrLevel; feedback: string }

function answerText(answer: WritingAnswerResult): string {
  return typeof answer.content === 'string' ? answer.content : ''
}

/** AI feedback JSON bo'lsa `summary` ni, aks holda matnning o'zini qaytaradi. */
function aiSummary(feedbacks: WritingFeedback[] | undefined): string | null {
  const ai = (feedbacks ?? []).filter(item => item.source === 'AI')
  const latest = ai[ai.length - 1]
  if (!latest) return null
  try {
    const value = JSON.parse(latest.content) as { summary?: unknown }
    if (value && typeof value.summary === 'string') return value.summary
  } catch {
    // oddiy matnli feedback
  }
  return latest.content
}

function defaultDraft(item: WritingResult): GradeDraft {
  return {
    // AI qoralama xom bali bo'lsa, teacher shuni tekshirib tasdiqlaydi.
    score: item.raw_score != null ? String(item.raw_score) : '',
    level: (item.cefr_level as CefrLevel | null) ?? 'B1',
    feedback: '',
  }
}

export function WritingGradingQueue() {
  const [queue, setQueue] = useState<WritingResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({})
  const [scoringId, setScoringId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setQueue(await writingApi.pending())
    } catch (err) {
      setQueue([])
      setError(err instanceof ApiRequestError ? err.message : "Writing baholash navbatini yuklab bo'lmadi.")
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function draftFor(item: WritingResult): GradeDraft {
    return drafts[item.id] ?? defaultDraft(item)
  }

  function updateDraft(item: WritingResult, patch: Partial<GradeDraft>) {
    setDrafts(current => ({
      ...current,
      [item.id]: { ...(current[item.id] ?? defaultDraft(item)), ...patch },
    }))
  }

  async function submitScore(item: WritingResult) {
    const draft = draftFor(item)
    const raw = Number(draft.score)
    if (draft.score.trim() === '' || !Number.isFinite(raw) || raw < 0 || raw > RAW_MAX) {
      setError(`Xom ball 0–${RAW_MAX} oralig'ida bo'lishi kerak (1.1: 0–5, 1.2: 0–5, 2: 0–6).`)
      return
    }
    setScoringId(item.id)
    setError(null)
    setMessage(null)
    try {
      await writingApi.grade(item.id, { raw_score: raw, cefr_level: draft.level, feedback: draft.feedback.trim() || null })
      setQueue(current => current?.filter(result => result.id !== item.id) ?? null)
      setMessage(`Writing natijasi #${item.id} saqlandi.`)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Bahoni saqlashda xatolik yuz berdi.')
    } finally {
      setScoringId(null)
    }
  }

  async function requestAiReview(item: WritingResult) {
    setScoringId(item.id)
    setError(null)
    setMessage(null)
    try {
      await writingApi.aiEvaluate(item.id)
      setMessage(`Writing #${item.id} uchun AI baholash so'rovi yuborildi.`)
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'AI baholashni boshlashda xatolik yuz berdi.')
    } finally {
      setScoringId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Writing baholash navbati</h2>
        <p className="text-sm text-muted-foreground">
          Xom ballni 0–{RAW_MAX} oralig'ida kiriting (1.1: 0–5, 1.2: 0–5, 2: 0–6). Yakuniy ball (0–75) avtomatik hisoblanadi.
        </p>
      </div>
      {error && <AdminError message={error} />}
      {message && <p role="status" className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm">{message}</p>}
      {queue === null ? (
        <p className="animate-pulse text-sm text-muted-foreground">Yuklanmoqda...</p>
      ) : queue.length === 0 ? (
        <AdminEmpty title="Baholanishi kerak bo‘lgan Writing topshirig‘i yo‘q" />
      ) : (
        <div className="space-y-3">
          {queue.map(item => {
            const draft = draftFor(item)
            const hasAi = item.evaluation_status === 'AI_DRAFT' || item.raw_score != null
            return (
              <article key={item.id} className="surface space-y-4 rounded-2xl border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.full_name || 'Foydalanuvchi'} — Writing #{item.id}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Test: {item.exam_id} · {new Date(item.created_at).toLocaleString('uz-UZ')}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Foydalanuvchi ID: {item.user_id}</span>
                      {item.email && <span>Email: {item.email}</span>}
                      {item.phone && <span>Telefon: {item.phone}</span>}
                      {item.username && <span>Username: {item.username}</span>}
                      {item.birth_date && <span>Tug‘ilgan sana: {new Date(item.birth_date).toLocaleDateString('uz-UZ')}</span>}
                      {item.gender && <span>Jinsi: {item.gender}</span>}
                      {item.language && <span>Til: {item.language}</span>}
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{item.evaluation_status || 'Kutilmoqda'}</span>
                </div>

                {hasAi && (
                  <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold">AI qoralama</p>
                    <p className="text-xs text-muted-foreground">
                      {item.ai_model ? `Model: ${item.ai_model} · ` : ''}Umumiy xom ball: {item.raw_score ?? '—'} / {RAW_MAX}
                      {item.cefr_level ? ` · CEFR: ${item.cefr_level}` : ''}
                    </p>
                    {(item.answers ?? []).map((answer, index) => {
                      const summary = aiSummary(answer.feedbacks)
                      return summary || answer.raw_score != null ? (
                        <div key={String(answer.id ?? index)} className="pt-1">
                          <p className="text-xs font-semibold">Javob {index + 1}: {answer.raw_score ?? '—'} ball</p>
                          {summary && <p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{summary}</p>}
                        </div>
                      ) : null
                    })}
                  </div>
                )}

                <div className="space-y-3">
                  {(item.answers ?? []).map((answer, index) => {
                    const content = answerText(answer)
                    return content ? (
                      <div key={String(answer.id ?? index)} className="rounded-xl bg-muted/40 p-3">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Javob {index + 1}</p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
                      </div>
                    ) : null
                  })}
                </div>
                <div className="grid gap-3 sm:grid-cols-[140px_120px_1fr]">
                  <label className="text-xs font-semibold">Xom ball (0–{RAW_MAX})
                    <input
                      type="number"
                      min={0}
                      max={RAW_MAX}
                      step={0.5}
                      value={draft.score}
                      onChange={e => updateDraft(item, { score: e.target.value })}
                      className="field mt-1 w-full"
                    />
                  </label>
                  <label className="text-xs font-semibold">CEFR darajasi
                    <select value={draft.level} onChange={e => updateDraft(item, { level: e.target.value as CefrLevel })} className="field mt-1 w-full">
                      <option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold">Izoh (ixtiyoriy)
                    <input value={draft.feedback} onChange={e => updateDraft(item, { feedback: e.target.value })} className="field mt-1 w-full" placeholder="Baholash izohi" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminButton variant="primary" size="sm" onClick={() => submitScore(item)} disabled={scoringId === item.id}>
                    {scoringId === item.id ? 'Saqlanmoqda...' : 'Bahoni saqlash'}
                  </AdminButton>
                  <AdminButton variant="default" size="sm" onClick={() => requestAiReview(item)} disabled={scoringId === item.id}>
                    AI baholash
                  </AdminButton>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
