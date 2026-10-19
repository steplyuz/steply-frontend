'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Check, CheckCircle2, Copy, XCircle } from 'lucide-react'
import { apiUrl } from '@/lib/api/config'
import { getReadingExamByIdAPI } from '@/lib/cefr-api/reading'
import { ErrorBox, Loading } from '@/components/dashboard/ui'
import {
  Circle, LIME, SKILLS, answerText, authFetch, errorMessage, fmtDay, parseSkill,
  type QuestionReview, type ResultDetail,
} from '@/components/dashboard/analysis-shared'

const OK = { tint: '#E7F7EC', accent: '#16A34A' }
const BAD = { tint: '#FFE4E6', accent: '#E11D48' }

function PercentRing({ value }: { value: number }) {
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(value / 100, 1))
  return (
    <div className="relative size-32 shrink-0 sm:size-40" role="img" aria-label={`Natija ${value} foiz`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LIME} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black leading-none tabular-nums sm:text-5xl">{value}%</span>
      </div>
    </div>
  )
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-white/80 py-1.5 pl-4 pr-1.5 ring-1 ring-black/5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground/60">{label}</p>
        <p className="truncate font-mono text-sm font-bold text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`${label}ni nusxalash`}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground/70 transition active:scale-95 hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
      >
        {copied ? <Check className="size-4 text-[#16A34A]" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

// --- Imtihon ma'lumotidan matn / variantlarni xavfsiz olish (maydon nomlari turlicha bo'lishi mumkin) ---
const pick = (o: any, keys: string[]): string => {
  for (const k of keys) {
    const v = o?.[k]
    if (typeof v === 'string' && v.trim()) return v
  }
  return ''
}
const toPlain = (s: string) =>
  /<\/?[a-z][\s\S]*>/i.test(s)
    ? s.replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
    : s
const normAns = (v: unknown) =>
  new Set((Array.isArray(v) ? v : [v]).filter((x) => x != null).map((x) => String(x).trim().toLowerCase()))

type Option = { label: string; text: string }
function parseOptions(raw: any): Option[] {
  const list = raw?.options ?? raw?.choices ?? raw?.answer_options
  if (!Array.isArray(list)) return []
  return list.map((o: any, i: number) => {
    const letter = String.fromCharCode(65 + i)
    if (typeof o === 'string') return { label: letter, text: o }
    return {
      label: String(o?.label ?? o?.key ?? o?.letter ?? letter),
      text: String(o?.text ?? o?.value ?? o?.content ?? o?.option ?? ''),
    }
  })
}

type ExamQ = { text: string; options: Option[]; partIdx: number }

/** Reading matni: imtihondagi kabi o'qish uchun qulay panel, shrift o'lchami o'zgaradigan */
function PassagePanel({ title, text, fontSize, accent, tint }: { title: string; text: string; fontSize: number; accent: string; tint: string }) {
  return (
    <aside
      aria-label={`${title} matni`}
      className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 backdrop-blur" style={{ background: `${tint}E6` }}>
        <span className="text-sm font-black tracking-tight" style={{ color: accent }}>Matn</span>
        <span className="truncate text-xs font-semibold text-foreground/60">{title}</span>
      </div>
      <div
        className="select-text whitespace-pre-line px-5 py-5 font-medium text-foreground/90 sm:px-7 sm:py-6"
        style={{ fontSize, lineHeight: 1.75 }}
      >
        {text}
      </div>
    </aside>
  )
}

function QuestionCard({ q, exam }: { q: QuestionReview; exam?: ExamQ }) {
  const tone = q.is_correct ? OK : BAD
  const Status = q.is_correct ? CheckCircle2 : XCircle
  const text = q.question_text || exam?.text || ''
  const options = exam?.options ?? []
  const userSet = normAns(q.user_answer)
  const rightSet = normAns(q.correct_answer)
  const has = (set: Set<string>, o: Option) => set.has(o.label.toLowerCase()) || (!!o.text && set.has(o.text.trim().toLowerCase()))

  return (
    <article className="rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black tabular-nums"
          style={{ background: tone.tint, color: tone.accent }}
        >
          {q.question_number}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-black tracking-tight">Savol {q.question_number}</h3>
          {q.type && <p className="truncate text-xs text-foreground/55">{q.type}</p>}
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: tone.tint, color: tone.accent }}
        >
          <Status aria-hidden="true" className="size-4" />
          {q.is_correct ? 'To‘g‘ri' : 'Noto‘g‘ri'}
        </span>
      </div>

      {text && <p className="mt-4 whitespace-pre-line text-base font-semibold leading-7 text-foreground">{text}</p>}

      {options.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {options.map((o) => {
            const isUser = has(userSet, o)
            const isRight = has(rightSet, o)
            const style = isRight ? OK : isUser ? BAD : null
            return (
              <li
                key={o.label}
                className="flex items-start gap-3 rounded-2xl p-3 text-sm"
                style={style ? { background: style.tint } : { background: 'rgba(0,0,0,0.04)' }}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={style ? { background: style.accent, color: '#fff' } : { background: '#fff', color: '#555' }}
                >
                  {o.label}
                </span>
                <span className="min-w-0 flex-1 pt-0.5 font-medium text-foreground">{o.text || o.label}</span>
                {(isUser || isRight) && (
                  <span className="shrink-0 pt-0.5 text-xs font-bold" style={{ color: style?.accent }}>
                    {isUser && isRight ? 'Sizning javobingiz' : isUser ? 'Sizning javobingiz' : 'To‘g‘ri javob'}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className={`mt-3 grid gap-2 ${q.is_correct ? '' : 'sm:grid-cols-2'}`}>
          <p className="rounded-2xl p-3 text-sm" style={{ background: tone.tint }}>
            <span className="block text-xs font-medium text-foreground/60">Sizning javobingiz</span>
            <span className="mt-1 block font-bold text-foreground">{answerText(q.user_answer)}</span>
          </p>
          {!q.is_correct && (
            <p className="rounded-2xl p-3 text-sm" style={{ background: OK.tint }}>
              <span className="block text-xs font-medium text-foreground/60">To‘g‘ri javob</span>
              <span className="mt-1 block font-bold text-foreground">{answerText(q.correct_answer)}</span>
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export default function ResultDetailPage() {
  const params = useParams<{ skill: string; id: string }>()
  const skill = parseSkill(params.skill)
  const id = decodeURIComponent(String(params.id ?? ''))
  const valid = skill === 'READING' || skill === 'LISTENING'

  const [detail, setDetail] = useState<ResultDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'wrong' | 'right'>('all')
  const [exam, setExam] = useState<any>(null)
  const [fontSize, setFontSize] = useState(18)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!valid) return
    setLoading(true)
    setError('')
    const base = skill === 'READING' ? '/reading-tests/me/results/' : '/listening-tests/me/results/'
    try {
      const response = await authFetch(apiUrl(`${base}${encodeURIComponent(id)}`), signal)
      if (!response.ok) throw new Error(await errorMessage(response, 'Natija tahlilini yuklab bo‘lmadi'))
      setDetail(await response.json())
    } catch (e) {
      if (signal?.aborted) return
      setError(e instanceof Error ? e.message : 'Natija tahlilini yuklab bo‘lmadi')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [valid, skill, id])

  useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  // Reading: matn va savol matnlarini imtihon ma'lumotidan olamiz (xato bo'lsa jimgina o'tkazib yuboramiz)
  const examId = detail?.summary?.exam_id
  useEffect(() => {
    if (skill !== 'READING' || !examId) return
    let alive = true
    getReadingExamByIdAPI(String(examId))
      .then((res: any) => { if (alive) setExam(res?.data ?? null) })
      .catch(() => { if (alive) setExam(null) })
    return () => { alive = false }
  }, [skill, examId])

  const examIndex = useMemo(() => {
    const map = new Map<number, ExamQ>()
    let n = 1
    ;(exam?.parts ?? []).forEach((part: any, partIdx: number) => {
      ;(part.questions ?? []).forEach((eq: any) => {
        map.set(n++, {
          text: toPlain(pick(eq, ['question_text', 'question', 'text', 'prompt', 'title', 'content'])),
          options: parseOptions(eq),
          partIdx,
        })
      })
    })
    return map
  }, [exam])

  const review = detail?.review ?? []
  const right = review.filter((q) => q.is_correct).length
  const wrong = review.length - right
  const shown = review.filter((q) => (filter === 'all' ? true : filter === 'right' ? q.is_correct : !q.is_correct))

  type Group = { key: string; title: string; passage: string; items: QuestionReview[] }
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    shown.forEach((q) => {
      const eq = examIndex.get(q.question_number)
      const part = eq ? exam?.parts?.[eq.partIdx] : null
      const key = eq ? `p${eq.partIdx}` : `t${q.part_title || ''}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: q.part_title || (part ? pick(part, ['title', 'name']) || `${eq!.partIdx + 1}-qism` : ''),
          passage: part ? toPlain(pick(part, ['passage', 'passage_text', 'reading_text', 'text', 'content', 'body'])) : '',
          items: [],
        })
      }
      map.get(key)!.items.push(q)
    })
    return Array.from(map.values())
  }, [shown, examIndex, exam])
  const hasPassage = groups.some((g) => g.passage)

  const back = (
    <Link
      href="/dashboard/analysis"
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground/65 transition active:scale-95 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> Analysis’ga qaytish
    </Link>
  )

  if (!valid || !skill) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-3xl border border-dashed border-foreground/20 bg-white p-8 text-center">
          <p className="font-bold">Bunday natija sahifasi mavjud emas.</p>
          <p className="mt-1 text-sm text-foreground/60">Faqat Reading va Listening natijalari uchun batafsil tahlil bor.</p>
        </div>
      </div>
    )
  }

  const { label, icon: Icon, tint, accent } = SKILLS[skill]
  const summary = detail?.summary
  const pct = Math.round(summary?.percentage ?? (review.length ? (right / review.length) * 100 : 0))
  const score = summary?.standard_score ?? summary?.raw_score

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {back}

      {/* Hero + umumiy natija */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div
          className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 ring-1 ring-black/5 sm:rounded-[32px] sm:p-8 lg:col-span-3 lg:p-10"
          style={{ background: tint }}
        >
          <Circle color={`${accent}1A`} width={24} className="-right-16 -top-16 size-48 sm:size-72" />
          <Circle color={`${accent}12`} width={18} className="-bottom-24 right-10 hidden size-56 sm:block" />

          <div className="relative z-10">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl text-white shadow-sm sm:size-14" style={{ background: accent }}>
              <Icon aria-hidden="true" className="size-6 sm:size-7" strokeWidth={1.9} />
            </span>
            <p className="text-sm font-bold" style={{ color: accent }}>Natija tahlili</p>
            <h1 className="mt-1 text-5xl font-black leading-none tracking-tighter sm:text-7xl">{label}</h1>
            {summary && <p className="mt-3 text-sm font-medium text-foreground/65">{fmtDay(summary.created_at)}</p>}
          </div>

          <div className="relative z-10 grid gap-2 sm:grid-cols-2">
            <CopyChip label="Natija ID" value={id} />
            <CopyChip label="Test ID" value={summary?.exam_id ?? '…'} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:rounded-[32px] sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10">
            <h2 className="text-base font-bold sm:text-lg">Umumiy natija</h2>
            {loading && !summary ? (
              <div className="mt-5 flex items-center gap-4" aria-busy="true">
                <div className="size-32 shrink-0 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none sm:size-40" />
                <div className="h-16 flex-1 animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
              </div>
            ) : summary ? (
              <div className="mt-5 flex items-center gap-4 sm:gap-6">
                <PercentRing value={pct} />
                <dl className="grid flex-1 gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <dt className="text-xs font-medium text-white/60">Ball</dt>
                    <dd className="text-3xl font-black leading-tight tabular-nums" style={{ color: LIME }}>{score ?? '—'}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <dt className="text-xs font-medium text-white/60">CEFR</dt>
                      <dd className="text-xl font-black leading-tight">{summary.cefr_level || '—'}</dd>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <dt className="text-xs font-medium text-white/60">To‘g‘ri</dt>
                      <dd className="text-xl font-black leading-tight tabular-nums">{right}/{review.length}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Savollar */}
      {loading && !detail ? (
        <Loading rows={3} />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => load()} />
      ) : detail ? (
        <section aria-labelledby="questions-heading" className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="questions-heading" className="text-xl font-black tracking-tight sm:text-3xl">Savollar tahlili</h2>
            {hasPassage && (
              <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/10" role="group" aria-label="Shrift o‘lchami">
                <button
                  type="button"
                  onClick={() => setFontSize((n) => Math.max(14, n - 2))}
                  aria-label="Shriftni kichraytirish"
                  className="flex size-10 items-center justify-center rounded-full text-sm font-black transition active:scale-95 hover:bg-foreground/5"
                >
                  A<span className="text-[10px]">−</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize((n) => Math.min(26, n + 2))}
                  aria-label="Shriftni kattalashtirish"
                  className="flex size-10 items-center justify-center rounded-full text-base font-black transition active:scale-95 hover:bg-foreground/5"
                >
                  A<span className="text-xs">+</span>
                </button>
              </div>
            )}
          </div>

          <div role="group" aria-label="Javob holati bo‘yicha filtr" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {([
              ['all', 'Hammasi', review.length, null],
              ['wrong', 'Noto‘g‘ri', wrong, BAD],
              ['right', 'To‘g‘ri', right, OK],
            ] as const).map(([key, text, count, tone]) => {
              const on = filter === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(key)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none ${
                    on ? 'bg-foreground text-white' : 'bg-white text-foreground/75 ring-1 ring-black/10 hover:bg-foreground/5'
                  }`}
                >
                  {text}
                  <span
                    className="rounded-full px-2 py-0.5 text-xs tabular-nums"
                    style={on ? { background: LIME, color: '#111' } : { background: tone?.tint ?? '#F1F1F1', color: tone?.accent ?? '#555' }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-foreground/20 bg-white p-8 text-center text-sm text-foreground/60">
              {review.length === 0 ? 'Bu natija uchun savollar tahlili topilmadi.' : 'Bu filtr bo‘yicha savol yo‘q.'}
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {groups.map((g) => (
                <div key={g.key} className="space-y-3">
                  {g.title && (
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-black tracking-tight sm:text-xl">{g.title}</h3>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums" style={{ background: tint, color: accent }}>
                        {g.items.filter((q) => q.is_correct).length}/{g.items.length}
                      </span>
                      <span aria-hidden="true" className="h-px flex-1 bg-foreground/10" />
                    </div>
                  )}
                  <div className={g.passage ? 'grid items-start gap-3 sm:gap-4 lg:grid-cols-2' : 'grid gap-3 lg:grid-cols-2'}>
                    {g.passage && <PassagePanel title={g.title || 'Matn'} text={g.passage} fontSize={fontSize} accent={accent} tint={tint} />}
                    <div className="space-y-3">
                      {g.items.map((q) => (
                        <QuestionCard key={`${skill}-${q.question_number}`} q={q} exam={examIndex.get(q.question_number)} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}