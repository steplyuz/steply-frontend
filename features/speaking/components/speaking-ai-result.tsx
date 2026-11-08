'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { ApiRequestError, getErrorMessage, speakingApi } from '@/shared/api'
import type { SpeakingAiEvaluation, SpeakingAiPartCode } from '@/shared/api/types'
import { useAiQuota } from '@/features/speaking/lib/access'
import { btn } from '@/shared/ui/dashboard-kit'

const PART_TITLE: Record<SpeakingAiPartCode, string> = {
  '1.1': '1.1 — Shaxsiy savollar (A1–A2)',
  '1.2': '1.2 — Rasm tasviri va fikr (B1)',
  '2': '2 — Abstrakt mavzu (B2)',
  '3': '3 — Balanslangan bahs (C1)',
}

const POLL_MS = 3000
const MAX_POLLS = 60 // ~3 daqiqa

type Phase = 'idle' | 'starting' | 'polling' | 'done' | 'failed' | 'error'

/**
 * Speaking AI baholash tugmasi. Bosilganda baholash boshlanadi (1 AI birlik sarflanadi),
 * natija tayyor bo'lguncha kuzatiladi. Oldingi baholash bor bo'lsa, qayta so'rov yuborilmaydi.
 */
export function SpeakingAiResult({ attemptId, onEvaluation }: { attemptId: number | null; onEvaluation?: (ev: SpeakingAiEvaluation) => void }) {
  const quota = useAiQuota()
  const [phase, setPhase] = useState<Phase>('idle')
  const [evaluation, setEvaluation] = useState<SpeakingAiEvaluation | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [limitHit, setLimitHit] = useState(false)
  const alive = useRef(true)
  const onEvaluationRef = useRef(onEvaluation)
  onEvaluationRef.current = onEvaluation
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (evaluation?.status === 'done') onEvaluationRef.current?.(evaluation)
  }, [evaluation])

  const poll = useCallback(async (id: number, polls = 0) => {
    if (!alive.current) return
    try {
      const ev = await speakingApi.aiEvaluation(id)
      if (!alive.current) return
      setEvaluation(ev)
      if (ev.status === 'done') {
        setPhase('done')
        return
      }
      if (ev.status === 'failed') {
        setMessage(ev.error || 'Baholashda xatolik yuz berdi.')
        setPhase('failed')
        return
      }
      setPhase('polling')
    } catch (e) {
      if (!alive.current) return
      setMessage(getErrorMessage(e))
      setPhase('error')
      return
    }
    if (polls + 1 >= MAX_POLLS) {
      setMessage('Baholash hali tugamadi. Bir necha daqiqadan so‘ng qayta tekshiring.')
      setPhase('error')
      return
    }
    timer.current = setTimeout(() => void poll(id, polls + 1), POLL_MS)
  }, [])

  // Oldingi baholash bo'lsa, uni ko'rsatamiz; yo'q bo'lsa tugma turadi.
  useEffect(() => {
    if (!attemptId) return
    let cancelled = false
    speakingApi
      .aiEvaluation(attemptId)
      .then((ev) => {
        if (cancelled || !alive.current) return
        setEvaluation(ev)
        if (ev.status === 'done') setPhase('done')
        else if (ev.status === 'failed') {
          setMessage(ev.error || 'Baholashda xatolik yuz berdi.')
          setPhase('failed')
        } else {
          setPhase('polling')
          void poll(attemptId)
        }
      })
      .catch(() => {
        /* baholash hali boshlanmagan — tugma ko'rinadi */
      })
    return () => {
      cancelled = true
    }
  }, [attemptId, poll])

  const start = async () => {
    if (!attemptId) return
    setLimitHit(false)
    setMessage(null)
    setPhase('starting')
    try {
      await speakingApi.requestAiEvaluation(attemptId)
    } catch (e) {
      setLimitHit(e instanceof ApiRequestError && e.status === 429)
      setMessage(getErrorMessage(e))
      setPhase('error')
      return
    }
    setPhase('polling')
    void poll(attemptId)
  }

  const remaining = quota.quota?.remaining ?? null
  const noCredits = remaining !== null && remaining < 1

  if (phase === 'idle') {
    return (
      <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06]">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">Speaking AI baholash</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Yozilgan javoblaringiz AI tomonidan baholanadi. Baholash bir AI birlik sarflaydi.
          {remaining !== null && <> Qolgan AI kreditlar (Writing + Speaking): <span className="font-bold text-foreground">{remaining}</span>.</>}
        </p>
        {noCredits ? (
          <Link href="/dashboard/billing" className={btn.primary}>Tarifni ko‘rish</Link>
        ) : (
          <button type="button" onClick={start} disabled={!attemptId || quota.loading} className={btn.primary}>
            <Sparkles className="size-4" /> AI bilan baholash
          </button>
        )}
      </section>
    )
  }

  if (phase === 'starting' || phase === 'polling') {
    return (
      <section className="flex items-start gap-3 rounded-3xl bg-white p-4 text-sm ring-1 ring-[#0F3D26]/[0.06]" aria-live="polite">
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-foreground" />
        <div>
          <p className="font-bold text-foreground">AI baholayapti…</p>
          <p className="text-muted-foreground">Audio javoblaringiz tahlil qilinmoqda. Bu bir necha daqiqa olishi mumkin.</p>
        </div>
      </section>
    )
  }

  if (phase === 'error' || phase === 'failed') {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-700" />
          <p className="text-red-700">{message}</p>
        </div>
        {limitHit ? (
          <Link href="/dashboard/billing" className={`${btn.primary} shrink-0`}>Tarifni ko‘rish</Link>
        ) : phase === 'failed' ? (
          <button type="button" onClick={start} className={`${btn.outline} shrink-0`}>Qayta baholash</button>
        ) : null}
      </section>
    )
  }

  // done
  const overall = evaluation?.overall
  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06]">
      <div className="flex items-center gap-3">
        <Sparkles className="size-5 text-foreground" />
        <h2 className="text-base font-bold text-foreground">Speaking AI natijasi</h2>
      </div>

      {overall && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl bg-secondary p-4">
          <p className="text-2xl font-semibold text-foreground">
            {overall.scaled} <span className="text-sm font-semibold text-muted-foreground">/ 75</span>
          </p>
          <p className="text-sm text-muted-foreground">Xom ball: {overall.raw} / 21</p>
          {overall.cefr && <p className="text-sm font-bold text-foreground">Daraja: {overall.cefr}</p>}
        </div>
      )}

      <ul className="space-y-3">
        {(evaluation?.parts ?? []).map((part) => (
          <li key={part.part} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">{PART_TITLE[part.part] ?? part.part}</p>
              <p className="text-sm font-semibold text-foreground">
                {part.score} / {part.max} <span className="text-muted-foreground">· {part.level}</span>
              </p>
            </div>
            {part.feedback_uz && <p className="mt-2 text-sm text-muted-foreground">{part.feedback_uz}</p>}
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="size-4 shrink-0" />
        Talaffuz hozircha AI tomonidan baholanmaydi.
      </p>
    </section>
  )
}
