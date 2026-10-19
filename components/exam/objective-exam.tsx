'use client'

/**
 * Reading va Listening practice imtihonlari uchun YAGONA oqim:
 * intro -> imtihon (taymer, qismlar, savollar, o'ng panel) -> tasdiqlash -> natija.
 *
 * Sahifalar (`app/(exam)/dashboard/{reading|listening}/[id]`) faqat API javobini `ObjPart[]` ga
 * keltiradi va `submit` ni beradi; qolgan hamma narsa shu yerda.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenText, Headphones } from 'lucide-react'
import { ExamTopBar } from './exam-shell'
import { ExamAudioPlayer, ExamFab, ExamTimerChip, ExamUtilityRail, PartNav, PartTabs } from './exam-ui'
import { ExamAlert, ExamSubmitted } from './exam-states'
import { FinishDialog } from './exam-dialogs'
import { ExamIntro } from './exam-intro'
import { QuestionInput, type ExamQuestion } from './question-input'
import { TONES, type Tone } from '@/lib/brand'
import { formatClock, useCountdown } from '@/lib/use-countdown'
import { getErrorMessage } from '@/lib/api/client'
import type { AttemptAnswerInput, AttemptState, ExamResultSummary } from '@/lib/api/types'

export interface ObjPart {
  key: string
  title: string
  instruction?: string | null
  passage?: string | null
  image?: string | null
  audioUrl?: string | null
  questions: ExamQuestion[]
}

type Answers = Record<number, string[]>

/** Admin kiritgan matndagi HTML teglarini olib tashlaydi (xavfsiz, faqat matn chiqadi). */
export function htmlToText(s?: string | null): string {
  if (!s) return ''
  return s
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

const isFilled = (v?: string[]) => !!v && v.some(x => x.trim() !== '')

function GapPassage({
  text, gapQuestions, answers, onChange, tone, fontSize, disabled,
}: {
  text: string
  gapQuestions: ExamQuestion[]
  answers: Answers
  onChange: (n: number, v: string[]) => void
  tone: Tone
  fontSize: number
  disabled: boolean
}) {
  const segments = text.split(/_{3,}/g)
  const accent = TONES[tone]
  return (
    <div className="whitespace-pre-wrap font-serif leading-[2.2]" style={{ fontSize }}>
      {segments.map((seg, i) => {
        const q = i < segments.length - 1 ? gapQuestions[i] : undefined
        const val = q ? answers[q.number]?.[0] ?? '' : ''
        return (
          <span key={i}>
            {seg}
            {q && (
              <input
                id={`q-${q.number}`}
                type="text"
                value={val}
                disabled={disabled}
                onChange={e => onChange(q.number, e.target.value ? [e.target.value] : [])}
                placeholder={String(q.number)}
                aria-label={`${q.number}-savol`}
                autoComplete="off"
                spellCheck={false}
                className="mx-1 h-8 w-28 rounded-md border-0 border-b-2 px-2 text-center font-sans text-[0.85em] font-bold outline-none transition-colors md:w-36"
                style={{ borderColor: val ? accent : 'rgba(11,11,13,.25)', backgroundColor: val ? `${accent}14` : 'rgba(11,11,13,.04)', color: '#0B0B0D' }}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}

function normalizeAttemptAnswers(raw: AttemptState['answers'], questions: ExamQuestion[]): Answers {
  const out: Answers = {}
  for (const item of raw ?? []) {
    const qid = Number(item.question_id)
    const qnum = Number(item.question_number)
    const q = questions.find((candidate) =>
      (Number.isFinite(qid) && qid > 0 && candidate.id === qid) ||
      (Number.isFinite(qnum) && qnum > 0 && candidate.number === qnum),
    )
    if (!q) continue
    const values = Array.isArray(item.answers)
      ? item.answers.filter((value): value is string => typeof value === 'string')
      : typeof item.answer === 'string' && item.answer.trim()
        ? item.answer.split(',').map((value) => value.trim()).filter(Boolean)
        : []
    if (values.length) out[q.number] = values
  }
  return out
}

function normalizeAttemptResult(payload: unknown): ExamResultSummary | null {
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as Record<string, unknown>
  const candidate = obj.summary && typeof obj.summary === 'object'
    ? obj.summary as Record<string, unknown>
    : obj
  if (typeof candidate.id !== 'number' || typeof candidate.exam_id !== 'string') return null
  return {
    id: candidate.id,
    exam_id: candidate.exam_id,
    correct_answers: typeof candidate.correct_answers === 'number' ? candidate.correct_answers : 0,
    total_questions: typeof candidate.total_questions === 'number' ? candidate.total_questions : 0,
    raw_score: typeof candidate.raw_score === 'number' ? candidate.raw_score : 0,
    standard_score: typeof candidate.standard_score === 'number' ? candidate.standard_score : 0,
    cefr_level: typeof candidate.cefr_level === 'string' ? candidate.cefr_level : '—',
    percentage: typeof candidate.percentage === 'number' ? candidate.percentage : 0,
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : new Date().toISOString(),
  }
}

function AudioTimerChip({ currentTime, duration }: { currentTime: number; duration: number }) {
  return (
    <span
      role="timer"
      aria-label={duration > 0 ? `Audio ${formatClock(currentTime)} / ${formatClock(duration)}` : 'Audio vaqti yuklanmoqda'}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold tabular-nums"
      style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.12)', color: '#7C3AED' }}
    >
      <Headphones size={14} />
      {duration > 0 ? `${formatClock(currentTime)} / ${formatClock(duration)}` : 'Audio'}
    </span>
  )
}

export function ObjectiveExam({
  skill, title, durationMinutes, parts, examAudioUrl, userId, testId, backHref, submit,
  startAttempt, saveAttemptAnswer, finishAttempt, attemptResult,
}: {
  skill: 'reading' | 'listening'
  title: string
  durationMinutes: number
  parts: ObjPart[]
  /** Butun imtihon uchun yagona audio (audio_mode === 'EXAM') */
  examAudioUrl?: string | null
  userId: string
  testId: string
  backHref: string
  submit: (answers: Answers) => Promise<ExamResultSummary>
  startAttempt?: () => Promise<AttemptState>
  saveAttemptAnswer?: (attemptId: number, input: AttemptAnswerInput) => Promise<unknown>
  finishAttempt?: (attemptId: number) => Promise<unknown>
  attemptResult?: (attemptId: number) => Promise<unknown>
}) {
  const tone: Tone = skill === 'reading' ? 'blue' : 'purple'
  const label = skill === 'reading' ? "O'qib tushunish" : 'Tinglab tushunish'
  const Icon = skill === 'reading' ? BookOpenText : Headphones
  const draftKey = `steply:practice:${skill}:${userId}:${testId}`

  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro')
  const [answers, setAnswers] = useState<Answers>({})
  const [activePart, setActivePart] = useState(0)
  const [fontSize, setFontSize] = useState(skill === 'reading' ? 17 : 16)
  const [volume, setVolume] = useState({ value: 0.8, muted: false })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamResultSummary | null>(null)
  const [initialSeconds, setInitialSeconds] = useState(durationMinutes * 60)
  const [attempt, setAttempt] = useState(0)
  const [starting, setStarting] = useState(false)
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0 })
  const saveTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const serverAttemptIdRef = useRef<number | null>(null)

  const answersRef = useRef<Answers>({})
  const submittingRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)

  const allQuestions = useMemo(() => parts.flatMap(p => p.questions), [parts])
  const totalQuestions = allQuestions.length

  useEffect(() => {
    if (examAudioUrl) return
    setAudioProgress({ currentTime: 0, duration: 0 })
  }, [activePart, examAudioUrl])

  useEffect(() => () => {
    for (const timer of saveTimersRef.current.values()) clearTimeout(timer)
    saveTimersRef.current.clear()
  }, [])

  // ---- Qoralama (sahifa yangilansa javoblar va vaqt yo'qolmasin) ----
  const persist = useCallback((next: Answers) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        answers: next,
        startedAt: startedAtRef.current,
        serverAttemptId: serverAttemptIdRef.current,
      }))
    } catch { /* to'lgan storage */ }
  }, [draftKey])

  const applyAttempt = useCallback((attemptState: AttemptState, localAnswers: Answers = {}) => {
    serverAttemptIdRef.current = attemptState.attempt_id
    const saved = normalizeAttemptAnswers(attemptState.answers, allQuestions)
    const merged = { ...saved, ...localAnswers }
    answersRef.current = merged
    setAnswers(merged)
    const serverStart = Date.parse(attemptState.started_at)
    startedAtRef.current = Number.isFinite(serverStart) ? serverStart : Date.now()
    setInitialSeconds(Math.max(0, attemptState.remaining_seconds ?? durationMinutes * 60))
    persist(merged)
  }, [allQuestions, durationMinutes, persist])

  // Resume server-side attempt when a local draft exists. Backend returns the existing
  // unfinished attempt instead of creating a second one.
  useEffect(() => {
    let alive = true
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const d = JSON.parse(raw) as { answers?: Answers; startedAt?: number }
      if (!d.startedAt) return
      const localAnswers = d.answers ?? {}
      answersRef.current = localAnswers
      setAnswers(localAnswers)
      startedAtRef.current = d.startedAt
      const left = durationMinutes * 60 - Math.floor((Date.now() - d.startedAt) / 1000)
      setInitialSeconds(Math.max(0, left))
      if (startAttempt) {
        setStarting(true)
        void startAttempt()
          .then((attemptState) => {
            if (!alive) return
            applyAttempt(attemptState, localAnswers)
            setPhase('running')
          })
          .catch((e) => {
            if (alive) setError(getErrorMessage(e))
          })
          .finally(() => { if (alive) setStarting(false) })
      } else {
        setPhase('running')
      }
    } catch { /* buzilgan qoralama e'tiborsiz */ }
    return () => { alive = false }
  }, [draftKey, durationMinutes, startAttempt, applyAttempt])

  const start = async () => {
    if (starting) return
    setStarting(true)
    setError(null)
    try {
      if (startAttempt) {
        const attemptState = await startAttempt()
        applyAttempt(attemptState, answersRef.current)
      } else {
        startedAtRef.current = Date.now()
        setInitialSeconds(durationMinutes * 60)
      }
      persist(answersRef.current)
      setPhase('running')
      void document.documentElement.requestFullscreen?.().catch(() => {})
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setStarting(false)
    }
  }

  const saveServerAnswer = useCallback(async (questionNumber: number, values: string[]) => {
    const id = serverAttemptIdRef.current
    if (id == null || !saveAttemptAnswer) return
    const q = allQuestions.find((candidate) => candidate.number === questionNumber)
    if (!q) return
    const payload: AttemptAnswerInput = {
      question_id: q.id ?? undefined,
      question_number: q.number,
      answers: values,
    }
    await saveAttemptAnswer(id, payload)
  }, [allQuestions, saveAttemptAnswer])

  const flushServerAnswers = useCallback(async () => {
    const id = serverAttemptIdRef.current
    if (id == null || !saveAttemptAnswer) return
    for (const timer of saveTimersRef.current.values()) clearTimeout(timer)
    saveTimersRef.current.clear()
    // Sequential writes avoid out-of-order updates for the same answer.
    for (const q of allQuestions) {
      await saveServerAnswer(q.number, answersRef.current[q.number] ?? [])
    }
  }, [allQuestions, saveAttemptAnswer, saveServerAnswer])

  const finish = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      let res: ExamResultSummary
      if (startAttempt) {
        const id = serverAttemptIdRef.current
        if (id == null || !finishAttempt) throw new Error('Urinish serverda boshlanmagan. Sahifani yangilab qayta urinib ko‘ring.')
        await flushServerAnswers()
        let payload: unknown
        try {
          payload = await finishAttempt(id)
        } catch (finishError) {
          // A finish may succeed server-side even if the response is interrupted; read
          // the idempotent result endpoint before reporting failure.
          if (!attemptResult) throw finishError
          payload = await attemptResult(id)
        }
        let summary = normalizeAttemptResult(payload)
        if (!summary && attemptResult) summary = normalizeAttemptResult(await attemptResult(id))
        if (!summary) throw new Error('Server natijani qaytarmadi. Natija saqlangan bo‘lishi mumkin; qayta urinib ko‘ring.')
        res = summary
      } else {
        res = await submit(answersRef.current)
      }
      try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      setResult(res)
      setDialogOpen(false)
      setPhase('done')
    } catch (e) {
      setError(getErrorMessage(e))
      submittingRef.current = false
    } finally {
      setSubmitting(false)
    }
  }, [submit, draftKey, startAttempt, saveAttemptAnswer, finishAttempt, attemptResult, flushServerAnswers])

  const { left, expired } = useCountdown(skill === 'reading' ? initialSeconds : undefined, {
    running: phase === 'running' && skill === 'reading',
    onExpire: () => { void finish() },
    resetKey: `${attempt}:${initialSeconds}`,
  })

  // Only Reading has a wall-clock exam deadline. Listening uses the actual audio duration.
  useEffect(() => {
    if (skill === 'reading' && phase === 'running' && initialSeconds <= 0) void finish()
  }, [skill, phase, initialSeconds, finish])

  // Tasodifan yopib yuborishdan himoya
  useEffect(() => {
    if (phase !== 'running') return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [phase])

  const setAnswer = useCallback((n: number, v: string[]) => {
    if (submittingRef.current || expired) return
    const next = { ...answersRef.current }
    if (isFilled(v)) next[n] = v
    else delete next[n]
    answersRef.current = next
    setAnswers(next)
    persist(next)
    if (serverAttemptIdRef.current != null && saveAttemptAnswer) {
      const previous = saveTimersRef.current.get(n)
      if (previous) clearTimeout(previous)
      const timer = setTimeout(() => {
        saveTimersRef.current.delete(n)
        void saveServerAnswer(n, next[n] ?? []).catch((e) => setError(getErrorMessage(e)))
      }, 350)
      saveTimersRef.current.set(n, timer)
    }
  }, [expired, persist, saveAttemptAnswer, saveServerAnswer])

  const answeredSet = useMemo(() => new Set(Object.keys(answers).filter(k => isFilled(answers[+k])).map(Number)), [answers])

  const part = parts[Math.min(activePart, parts.length - 1)]
  const answeredByPart = useMemo(() => Object.fromEntries(parts.map((p, i) => [i, p.questions.filter(q => answeredSet.has(q.number)).length])), [parts, answeredSet])
  const totalByPart = useMemo(() => Object.fromEntries(parts.map((p, i) => [i, p.questions.length])), [parts])

  const jumpTo = (n: number) => {
    const idx = parts.findIndex(p => p.questions.some(q => q.number === n))
    if (idx < 0) return
    setActivePart(idx)
    setTimeout(() => document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
  }

  // ---------- Intro ----------
  if (phase === 'intro') {
    return (
      <ExamIntro
        skillLabel={label}
        icon={<Icon size={18} />}
        title={title}
        tone={tone}
        backHref={backHref}
        durationMinutes={durationMinutes}
        questionCount={totalQuestions}
        extraRules={skill === 'listening' ? ['Naushnik taqing va ovoz balandligini oldindan tekshiring.'] : []}
        speaker={skill === 'listening'}
        onStart={() => { void start() }}
        starting={starting}
        error={error}
      />
    )
  }

  // ---------- Natija ----------
  if (phase === 'done' && result) {
    return (
      <ExamSubmitted
        skill={label}
        correct={result.correct_answers}
        total={result.total_questions}
        percentage={result.percentage}
        cefrLevel={result.cefr_level}
        standardScore={result.standard_score}
        tone={tone}
        backHref={backHref}
        backLabel="Testlarga qaytish"
        onRetry={() => {
          answersRef.current = {}; startedAtRef.current = null; submittingRef.current = false
          serverAttemptIdRef.current = null
          setAnswers({}); setResult(null); setActivePart(0); setError(null); setAttempt(a => a + 1)
          setInitialSeconds(durationMinutes * 60); setAudioProgress({ currentTime: 0, duration: 0 }); setPhase('intro')
        }}
      />
    )
  }

  if (!part) return <ExamAlert>Bu testda qismlar topilmadi.</ExamAlert>

  // ---------- Imtihon ----------
  const gapQs = part.questions.filter(q => q.type.toUpperCase() === 'GAP_FILL')
  const gapCount = part.passage ? Math.max(0, part.passage.split(/_{3,}/g).length - 1) : 0
  const inlineGaps = gapQs.slice(0, gapCount)
  const listQuestions = part.questions.filter(q => !inlineGaps.includes(q))
  const audioSrc = examAudioUrl || part.audioUrl || ''
  const disabled = submitting || expired
  const rows = parts.map((p, i) => ({
    label: p.title || `${i + 1}-qism`,
    value: `${answeredByPart[i] ?? 0}/${p.questions.length}`,
    done: (answeredByPart[i] ?? 0) >= p.questions.length,
  }))
  const unanswered = totalQuestions - answeredSet.size

  const passageBlock = part.passage ? (
    <section className="rounded-2xl border p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E6E7E2', boxShadow: '0 4px 14px rgba(11,11,13,.045)' }}>
      {inlineGaps.length > 0 ? (
        <GapPassage text={htmlToText(part.passage)} gapQuestions={inlineGaps} answers={answers} onChange={setAnswer} tone={tone} fontSize={fontSize} disabled={disabled} />
      ) : (
        <div className="whitespace-pre-wrap font-serif leading-[2]" style={{ fontSize }}>{htmlToText(part.passage)}</div>
      )}
    </section>
  ) : null

  const imageBlock = part.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={part.image} alt={`${part.title} rasmi`} className="max-h-[70vh] w-full rounded-2xl border bg-white object-contain" style={{ borderColor: 'rgba(11,11,13,.1)' }} />
  ) : null

  const questionsBlock = (
    <div className="space-y-3">
      {part.instruction && (
        <p className="rounded-xl border px-4 py-3 text-sm" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)', color: 'rgba(11,11,13,.7)' }}>
          {htmlToText(part.instruction)}
        </p>
      )}
      {listQuestions.map(q => (
        <div key={q.number} id={`q-${q.number}`} className="scroll-mt-28">
          <QuestionInput
            q={{ ...q, text: htmlToText(q.text) }}
            value={answers[q.number] ?? []}
            onChange={v => setAnswer(q.number, v)}
            tone={tone}
            fontSize={Math.min(fontSize, 18)}
            disabled={disabled}
          />
        </div>
      ))}
      {listQuestions.length === 0 && inlineGaps.length > 0 && (
        <p className="text-sm" style={{ color: 'rgba(11,11,13,.55)' }}>Bo&apos;sh joylarni matn ichida to&apos;ldiring.</p>
      )}
    </div>
  )

  return (
    <>
      <ExamTopBar
        backHref={backHref}
        title={title}
        subtitle={label}
        tone={tone}
        center={skill === 'listening' ? <AudioTimerChip currentTime={audioProgress.currentTime} duration={audioProgress.duration} /> : <ExamTimerChip left={left} />}
        status={<span>{answeredSet.size}/{totalQuestions} javob</span>}
        progress={totalQuestions ? (answeredSet.size / totalQuestions) * 100 : 0}
        onSubmit={() => setDialogOpen(true)}
        submitting={submitting}
      />

      <div className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <PartTabs
            parts={parts}
            activeIdx={activePart}
            answeredByPart={answeredByPart}
            totalByPart={totalByPart}
            tone={tone}
            onChange={setActivePart}
          />

          {skill === 'listening' && audioSrc && (
            <ExamAudioPlayer
              key={audioSrc}
              src={audioSrc}
              tone={tone}
              volume={volume.value}
              muted={volume.muted}
              onVolumeChange={(v, m) => setVolume({ value: v, muted: m })}
              onProgress={(currentTime, duration) => setAudioProgress({ currentTime, duration })}
              onEnded={() => {
                // EXAM mode has one audio for the whole test. PART mode uses one audio per
                // part, so finish only when the final part's audio has ended.
                const isFinalAudio = Boolean(examAudioUrl) || activePart === parts.length - 1
                if (phase === 'running' && isFinalAudio && !submittingRef.current) {
                  void finish()
                }
              }}
            />
          )}
          {skill === 'listening' && !audioSrc && (
            <ExamAlert>Bu qism uchun audio topilmadi. Administratorga xabar bering.</ExamAlert>
          )}

          {passageBlock || imageBlock ? (
            <div className="grid items-start gap-4 xl:grid-cols-2">
              <div className="space-y-4 xl:sticky xl:top-[calc(4.5rem+16px)] xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto">
                {passageBlock}
                {imageBlock}
              </div>
              {questionsBlock}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">{questionsBlock}</div>
          )}

          <PartNav activeIdx={activePart} total={parts.length} onChange={setActivePart} />
        </div>

        <ExamUtilityRail
          secondsLeft={left}
          questionNumbers={allQuestions.map(q => q.number)}
          answeredSet={answeredSet}
          fontSize={fontSize}
          onFontChange={setFontSize}
          volume={skill === 'listening' ? { ...volume, onChange: (v, m) => setVolume({ value: v, muted: m }) } : undefined}
          onFinish={() => setDialogOpen(true)}
          onSelectQuestion={jumpTo}
          submitting={submitting}
          tone={tone}
        />
      </div>

      <ExamFab onClick={() => setDialogOpen(true)} submitting={submitting} />

      <FinishDialog
        open={dialogOpen || (expired && phase === 'running')}
        onClose={() => { if (!expired) setDialogOpen(false) }}
        onConfirm={() => void finish()}
        submitting={submitting}
        title={expired ? 'Vaqt tugadi' : 'Imtihonni yakunlash'}
        summary={expired ? 'Javoblaringiz yuborilmoqda.' : `${answeredSet.size} / ${totalQuestions} savolga javob berildi.`}
        rows={rows}
        warning={!expired && unanswered > 0 ? `${unanswered} ta savol javobsiz qoldi. Yuborilgach qayta o'zgartirib bo'lmaydi.` : undefined}
        error={error}
        confirmLabel={error ? 'Qayta yuborish' : 'Tasdiqlayman'}
        tone={tone}
      />
    </>
  )
}
