'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { getErrorMessage, onboardingApi } from '@/lib/api'
import type {
  OnbCefrLevel, OnbDailyHours, OnbSkill, OnbTargetLevel, OnbTeacherHours, OnbVocabBand,
  OnboardingExamDate, OnboardingPlan, OnboardingState, OnboardingUpdateInput,
} from '@/lib/api/types'
import { PlanView } from './plan-view'
import { OnboardingStyles, useCountUp } from './onboarding-animations'
import {
  CEFR_LEVELS, DAILY_OPTIONS, LIME, SKILLS, TARGET_LEVELS, TEACHER_OPTIONS, VOCAB_BANDS, formatExamDate,
} from './onboarding-constants'

type StepId = 'cefr' | 'target' | 'skills' | 'exam' | 'time' | 'review'
const STEP_ORDER: StepId[] = ['cefr', 'target', 'skills', 'exam', 'time', 'review']
const STEP_TITLES: Record<StepId, { title: string; hint: string }> = {
  cefr: { title: 'CEFR imtihonini topshirganmisiz?', hint: 'Agar topshirgan bo‘lsangiz, darajasini kiriting. Aks holda taxminiy darajangizni tanlang.' },
  target: { title: 'Maqsad darajangiz va so‘z boyligingiz', hint: 'Qaysi darajaga erishmoqchisiz va hozir taxminan nechta so‘z bilasiz?' },
  skills: { title: 'Kuchli va zaif tomonlaringiz', hint: 'Bir tomon ham kuchli, ham zaif bo‘lishi mumkin emas. Zaif tomonlar rejada ko‘proq vaqt oladi.' },
  exam: { title: 'Qaysi oyda topshirmoqchisiz?', hint: 'Ro‘yxatdagi sanalardan birini tanlang. Ro‘yxatdan o‘tish uchun mygov linkidan foydalaning.' },
  time: { title: 'Kuniga qancha vaqt ajratasiz?', hint: 'O‘qituvchi yordami kunlik vaqtning bir qismi hisoblanadi.' },
  review: { title: 'Tekshirib, AI rejani yarating', hint: 'Javoblaringizni tekshiring. Keyin reja tayyorlanadi.' },
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

type Draft = {
  cefrTaken: boolean | null
  cefrLevel: OnbCefrLevel | null
  estimatedLevel: OnbCefrLevel | null
  targetLevel: OnbTargetLevel | null
  vocabBand: OnbVocabBand | null
  strengths: OnbSkill[]
  weaknesses: OnbSkill[]
  examDateId: number | null
  dailyHours: OnbDailyHours | null
  teacherHours: OnbTeacherHours | null
}

const EMPTY_DRAFT: Draft = {
  cefrTaken: null, cefrLevel: null, estimatedLevel: null, targetLevel: null, vocabBand: null,
  strengths: [], weaknesses: [], examDateId: null, dailyHours: null, teacherHours: null,
}

function draftFrom(s: OnboardingState): Draft {
  return {
    cefrTaken: s.cefr_taken ?? null,
    cefrLevel: (s.cefr_level as OnbCefrLevel | null) ?? null,
    estimatedLevel: (s.estimated_level as OnbCefrLevel | null) ?? null,
    targetLevel: (s.target_level as OnbTargetLevel | null) ?? null,
    vocabBand: (s.vocab_band as OnbVocabBand | null) ?? null,
    strengths: (s.strengths as OnbSkill[] | null) ?? [],
    weaknesses: (s.weaknesses as OnbSkill[] | null) ?? [],
    examDateId: s.exam_date_id ?? null,
    dailyHours: (s.daily_hours as OnbDailyHours | null) ?? null,
    teacherHours: (s.teacher_hours as OnbTeacherHours | null) ?? null,
  }
}

/** Qadam bo'yicha to'liqlik. Backend bilan bir xil qoidalar.
 *  Sana ro'yxati bo'sh bo'lsa, imtihon qadami avtomatik to'liq (sana e'lon qilinmagan). */
function stepValid(step: StepId, d: Draft, hasExamDates: boolean): boolean {
  switch (step) {
    case 'cefr':
      return d.cefrTaken === true ? !!d.cefrLevel : d.cefrTaken === false ? !!d.estimatedLevel : false
    case 'target':
      return !!d.targetLevel && !!d.vocabBand
    case 'skills':
      return d.weaknesses.length > 0
    case 'exam':
      return hasExamDates ? d.examDateId !== null : true
    case 'time':
      return d.dailyHours !== null && d.teacherHours !== null
    default:
      return true
  }
}

/** Qadamga mos yuboriladigan maydonlar (qisman saqlash) */
function payloadFor(step: StepId, d: Draft, hasExamDates: boolean): OnboardingUpdateInput {
  switch (step) {
    case 'cefr':
      return d.cefrTaken
        ? { cefr_taken: true, cefr_level: d.cefrLevel! }
        : { cefr_taken: false, estimated_level: d.estimatedLevel! }
    case 'target':
      return { target_level: d.targetLevel!, vocab_band: d.vocabBand! }
    case 'skills':
      return { strengths: d.strengths, weaknesses: d.weaknesses }
    case 'exam':
      return hasExamDates ? { exam_date_id: d.examDateId! } : { exam_date_pending: true }
    case 'time':
      return { daily_hours: d.dailyHours!, teacher_hours: d.teacherHours! }
    default:
      return {}
  }
}

function firstIncompleteStep(d: Draft, hasExamDates: boolean): StepId {
  return STEP_ORDER.find((s) => s !== 'review' && !stepValid(s, d, hasExamDates)) ?? 'review'
}

/* ───────────── UI bo‘laklari ───────────── */

/** Dekorativ halqa — faqat bezak, ekran o‘quvchilardan yashirilgan */
function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:rounded-[32px] sm:p-8 ${className}`}>
      {children}
    </div>
  )
}

function Label({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <p className="mb-3 text-sm font-extrabold text-foreground">
      {children}
      {note ? <span className="ml-1.5 font-medium text-muted-foreground">{note}</span> : null}
    </p>
  )
}

/** Radio-tanlov kartasi. `compact` — markazlashgan kichik plitka (daraja, vaqt). */
function Choice({
  selected, onClick, children, hint, disabled = false, compact = false,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  hint?: string
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 text-sm font-bold ring-1 transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 enabled:active:scale-[0.97] motion-reduce:transition-none ${focusRing} ${compact ? 'min-h-14 justify-center py-3 text-center' : 'min-h-14 justify-between py-3 text-left'
        } ${selected
          ? 'bg-foreground text-white shadow-lg shadow-black/15 ring-foreground'
          : 'bg-white text-foreground ring-black/10 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:hover:shadow-black/5 enabled:hover:ring-black/30 motion-reduce:enabled:hover:translate-y-0'
        }`}
    >
      {/* Tanlanganda LIME to‘lqin — element tanlanganda mount bo‘lgani uchun bir marta o‘ynaydi */}
      {selected ? <span aria-hidden="true" className="ob-ripple pointer-events-none absolute inset-0 rounded-2xl" /> : null}

      <span className={compact ? 'text-base font-black' : 'min-w-0'}>
        {children}
        {hint ? (
          <span className={`mt-0.5 block text-xs font-medium transition-colors ${selected ? 'text-white/60' : 'text-muted-foreground'}`}>{hint}</span>
        ) : null}
      </span>
      {compact ? null : (
        <span
          aria-hidden="true"
          className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${selected ? '' : 'ring-1 ring-black/20'}`}
          style={selected ? { background: LIME } : undefined}
        >
          {selected ? <Check className="ob-pop size-3.5 text-foreground" strokeWidth={3} /> : null}
        </span>
      )}
    </button>
  )
}

function Toggle({
  selected, onClick, children, tone = 'dark',
}: { selected: boolean; onClick: () => void; children: ReactNode; tone?: 'dark' | 'lime' }) {
  const on =
    tone === 'lime'
      ? 'text-foreground ring-foreground'
      : 'bg-foreground text-white ring-foreground'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ring-1 transition duration-200 active:scale-95 motion-reduce:transition-none ${focusRing} ${selected ? on : 'bg-white text-foreground ring-black/15 hover:-translate-y-0.5 hover:ring-black/40 motion-reduce:hover:translate-y-0'
        }`}
      style={selected && tone === 'lime' ? { background: LIME } : undefined}
    >
      {selected ? <span aria-hidden="true" className="ob-ripple pointer-events-none absolute inset-0 rounded-full" /> : null}
      {selected ? <Check aria-hidden="true" className="ob-pop size-4" strokeWidth={3} /> : null}
      {children}
    </button>
  )
}

/** Asosiy tugma: to‘q pill + LIME aylana ikonka (dashboarddagi "Mashqni boshlash" kabi) */
function PrimaryButton({
  onClick, disabled = false, busy = false, icon, children, className = '',
}: {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      className={`group inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 disabled:shadow-none enabled:active:scale-[0.98] motion-reduce:transition-none ${busy ? 'ob-shimmer disabled:cursor-wait' : 'disabled:cursor-not-allowed disabled:opacity-40'
        } ${disabled ? '' : 'ob-glow'} ${focusRing} ${className}`}
    >
      {children}
      <span
        className="flex size-9 items-center justify-center rounded-full text-foreground transition-transform group-enabled:group-hover:translate-x-0.5 motion-reduce:transition-none"
        style={{ background: LIME }}
      >
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : icon}
      </span>
    </button>
  )
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center justify-end gap-3 text-right font-bold text-foreground">
        <span className="truncate">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-1 text-xs font-bold underline underline-offset-4 transition hover:text-foreground/70 motion-reduce:transition-none ${focusRing}`}
        >
          Tahrirlash
        </button>
      </dd>
    </div>
  )
}

/* ───────────── Wizard ───────────── */

export default function OnboardingWizard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<StepId>('cefr')
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [examDates, setExamDates] = useState<OnboardingExamDate[]>([])
  const [plan, setPlan] = useState<OnboardingPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mavjud javoblarni yuklash va kelgan joyidan davom ettirish
  useEffect(() => {
    let cancelled = false
    Promise.all([onboardingApi.get(), onboardingApi.examDates()])
      .then(([state, dates]) => {
        if (cancelled) return
        const d = draftFrom(state)
        setDraft(d)
        setExamDates(dates)
        setPlan(state.plan)
        setStep(state.plan ? 'review' : firstIncompleteStep(d, dates.length > 0))
      })
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const stepIndex = STEP_ORDER.indexOf(step)
  const progress = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100)
  const pct = useCountUp(progress, { duration: 700 })
  const hasExamDates = examDates.length > 0
  const canNext = stepValid(step, draft, hasExamDates)
  const allDone = useMemo(
    () => STEP_ORDER.every((s) => s === 'review' || stepValid(s, draft, hasExamDates)),
    [draft, hasExamDates],
  )

  // Teacher vaqti kunlik vaqtdan oshmasin
  const teacherOptions = TEACHER_OPTIONS.filter((o) => draft.dailyHours === null || o.value <= draft.dailyHours)

  /** Qadam almashtirish — yo‘nalishni eslab qoladi (animatsiya o‘ngdan yoki chapdan kiradi) */
  function go(next: StepId) {
    setDir(STEP_ORDER.indexOf(next) >= stepIndex ? 'fwd' : 'back')
    setStep(next)
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleSkill(list: 'strengths' | 'weaknesses', skill: OnbSkill) {
    setDraft((d) => {
      const other = list === 'strengths' ? 'weaknesses' : 'strengths'
      const has = d[list].includes(skill)
      return {
        ...d,
        [list]: has ? d[list].filter((x) => x !== skill) : [...d[list], skill],
        // Bir ko'nikma ikkala ro'yxatda bo'lmasligi kerak
        [other]: d[other].filter((x) => x !== skill),
      }
    })
  }

  async function saveAndNext() {
    if (!canNext || saving) return
    setSaving(true)
    setError(null)
    try {
      await onboardingApi.update(payloadFor(step, draft, hasExamDates))
      go(STEP_ORDER[stepIndex + 1])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function generate() {
    if (generating) return
    setGenerating(true)
    setError(null)
    try {
      // Oxirgi qadamdagi maydonlar allaqachon saqlangan bo'lishi kerak
      const res = await onboardingApi.generatePlan()
      setPlan(res.plan)
    } catch (e) {
      setError(getErrorMessage(e, 'AI reja yaratib bo‘lmadi. Qayta urinib ko‘ring.'))
    } finally {
      setGenerating(false)
    }
  }

  function goBack() {
    if (stepIndex > 0) go(STEP_ORDER[stepIndex - 1])
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <OnboardingStyles />
        <div className="h-56 animate-pulse rounded-3xl bg-foreground/10 motion-reduce:animate-none sm:h-64 sm:rounded-[32px]" />
        <div className="h-72 animate-pulse rounded-3xl bg-foreground/5 motion-reduce:animate-none sm:rounded-[32px]" />
        <span className="sr-only">Yuklanmoqda</span>
      </div>
    )
  }

  const info =
    step === 'review' && plan
      ? { title: 'AI rejangiz tayyor', hint: 'Rejani ko‘rib chiqing va kabinetga o‘ting.' }
      : STEP_TITLES[step]

  return (
    <div className="space-y-4 sm:space-y-6">
      <OnboardingStyles />

      {/* ───── Sarlavha + jarayon ───── */}
      <header
        className="ob-rise relative overflow-hidden rounded-3xl p-6 text-foreground sm:rounded-[32px] sm:p-10"
        style={{ background: LIME }}
      >
        <Circle color="rgba(0,0,0,0.07)" width={22} className="ob-float -right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Qadam {stepIndex + 1} / {STEP_ORDER.length}
            </span>
            <span className="text-sm font-black tabular-nums">{pct}%</span>
          </div>

          <div
            className="mt-4 flex gap-1.5"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Onboarding jarayoni"
          >
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/15">
                <div
                  className="h-full origin-left rounded-full bg-foreground transition-transform duration-700 ease-out motion-reduce:transition-none"
                  style={{ transform: `scaleX(${i <= stepIndex ? 1 : 0})`, transitionDelay: i <= stepIndex ? `${i * 40}ms` : '0ms' }}
                />
              </div>
            ))}
          </div>

          <h1
            key={info.title}
            className="ob-title mt-6 break-words text-[1.75rem] font-black leading-[1.05] tracking-tighter sm:mt-8 sm:text-5xl sm:leading-[1]"
          >
            {info.title}
          </h1>
          <p
            key={info.hint}
            className="ob-rise mt-3 max-w-xl text-[15px] font-medium leading-6 text-foreground/70 sm:text-base"
            style={{ animationDelay: '.1s' }}
          >
            {info.hint}
          </p>
        </div>
      </header>

      {error ? (
        <div
          key={error}
          role="alert"
          className="ob-shake rounded-2xl bg-[#FFF1E6] px-4 py-3 text-sm font-semibold text-foreground ring-1 ring-[#F97316]/40 sm:rounded-3xl sm:p-4"
        >
          {error}
        </div>
      ) : null}

      {/* ───── Qadam kontenti: key o‘zgarganda qayta mount bo‘ladi va animatsiya o‘ynaydi ───── */}
      <section
        key={step}
        aria-live="polite"
        className={`space-y-4 ${dir === 'fwd' ? 'ob-in-fwd' : 'ob-in-back'}`}
      >
        {step === 'cefr' && (
          <Panel>
            <div className="ob-stagger grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="CEFR topshirganmisiz">
              <Choice selected={draft.cefrTaken === true} onClick={() => update('cefrTaken', true)}>Ha, topshirganman</Choice>
              <Choice selected={draft.cefrTaken === false} onClick={() => update('cefrTaken', false)}>Yo‘q, topshirmaganman</Choice>
            </div>
            {draft.cefrTaken !== null && (
              <div className="ob-rise mt-6 border-t border-black/10 pt-6">
                <Label>{draft.cefrTaken ? 'Qaysi darajani oldingiz?' : 'Taxminiy darajangiz qanday?'}</Label>
                <div className="ob-stagger grid grid-cols-5 gap-2 sm:gap-3" role="radiogroup" aria-label="Daraja">
                  {CEFR_LEVELS.map((lvl) => {
                    const selected = draft.cefrTaken ? draft.cefrLevel === lvl : draft.estimatedLevel === lvl
                    return (
                      <Choice
                        key={lvl}
                        compact
                        selected={selected}
                        onClick={() => (draft.cefrTaken ? update('cefrLevel', lvl) : update('estimatedLevel', lvl))}
                      >
                        {lvl}
                      </Choice>
                    )
                  })}
                </div>
              </div>
            )}
          </Panel>
        )}

        {step === 'target' && (
          <Panel>
            <Label>Maqsad daraja</Label>
            <div className="ob-stagger grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Maqsad daraja">
              {TARGET_LEVELS.map((lvl) => (
                <Choice key={lvl} compact selected={draft.targetLevel === lvl} onClick={() => update('targetLevel', lvl)}>
                  {lvl}
                </Choice>
              ))}
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <Label note="(taxminan)">So‘z boyligi</Label>
              <div className="ob-stagger grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="So‘z boyligi">
                {VOCAB_BANDS.map((b) => (
                  <Choice key={b.value} selected={draft.vocabBand === b.value} onClick={() => update('vocabBand', b.value)}>
                    {b.label}
                  </Choice>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {step === 'skills' && (
          <Panel>
            <Label>Kuchli tomonlar</Label>
            <div className="ob-stagger flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <Toggle key={s.value} selected={draft.strengths.includes(s.value)} onClick={() => toggleSkill('strengths', s.value)}>
                  {s.label}
                </Toggle>
              ))}
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <Label note="(kamida bittasi)">Zaif tomonlar</Label>
              <div className="ob-stagger flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <Toggle
                    key={s.value}
                    tone="lime"
                    selected={draft.weaknesses.includes(s.value)}
                    onClick={() => toggleSkill('weaknesses', s.value)}
                  >
                    {s.label}
                  </Toggle>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {step === 'exam' && (
          examDates.length === 0 ? (
            <Panel className="text-sm font-medium leading-6 text-muted-foreground">
              Hozircha imtihon sanalari e’lon qilinmagan. Davom etishingiz mumkin: sana e’lon qilingach, onboardingda sanani tanlaysiz.
            </Panel>
          ) : (
            <Panel>
              <div className="ob-stagger space-y-3" role="radiogroup" aria-label="Imtihon sanasi">
                {examDates.map((ex) => (
                  <div key={ex.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <Choice
                        selected={draft.examDateId === ex.id}
                        onClick={() => update('examDateId', ex.id)}
                        hint={formatExamDate(ex.exam_date)}
                      >
                        {ex.title}
                      </Choice>
                    </div>
                    <a
                      href={ex.register_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group/link inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold text-foreground ring-1 ring-black/15 transition hover:bg-black/5 motion-reduce:transition-none ${focusRing}`}
                    >
                      mygov’da ro‘yxatdan o‘tish
                      <ExternalLink aria-hidden="true" className="size-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                    </a>
                  </div>
                ))}
              </div>
            </Panel>
          )
        )}

        {step === 'time' && (
          <Panel>
            <Label>Kunlik o‘quv vaqti</Label>
            <div className="ob-stagger grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Kunlik vaqt">
              {DAILY_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  compact
                  selected={draft.dailyHours === o.value}
                  onClick={() => {
                    update('dailyHours', o.value)
                    if (draft.teacherHours !== null && draft.teacherHours > o.value) update('teacherHours', null)
                  }}
                >
                  {o.label}
                </Choice>
              ))}
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <Label note="(kuniga)">O‘qituvchi yordami</Label>
              <div className="ob-stagger grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="O‘qituvchi yordami">
                {teacherOptions.map((o) => (
                  <Choice
                    key={o.value}
                    compact
                    selected={draft.teacherHours === o.value}
                    onClick={() => update('teacherHours', o.value)}
                    disabled={draft.dailyHours === null}
                  >
                    {o.label}
                  </Choice>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {step === 'review' && (
          <>
            {plan ? (
              <PlanView plan={plan} />
            ) : (
              <>
                <Panel>
                  <dl className="ob-stagger divide-y divide-black/10 text-sm">
                    <ReviewRow label="CEFR" value={draft.cefrTaken ? `Topshirgan: ${draft.cefrLevel ?? '—'}` : `Taxminiy: ${draft.estimatedLevel ?? '—'}`} onEdit={() => go('cefr')} />
                    <ReviewRow label="Maqsad" value={`${draft.targetLevel ?? '—'} · ${VOCAB_BANDS.find((b) => b.value === draft.vocabBand)?.label ?? '—'}`} onEdit={() => go('target')} />
                    <ReviewRow label="Kuchli" value={draft.strengths.map((s) => SKILLS.find((x) => x.value === s)?.label).join(', ') || '—'} onEdit={() => go('skills')} />
                    <ReviewRow label="Zaif" value={draft.weaknesses.map((s) => SKILLS.find((x) => x.value === s)?.label).join(', ') || '—'} onEdit={() => go('skills')} />
                    <ReviewRow
                      label="Imtihon"
                      value={(() => {
                        const ex = examDates.find((x) => x.id === draft.examDateId)
                        if (ex) return `${ex.title} — ${formatExamDate(ex.exam_date)}`
                        return hasExamDates ? '—' : 'E’lon qilinmagan (keyinroq tanlanadi)'
                      })()}
                      onEdit={() => go('exam')}
                    />
                    <ReviewRow label="Vaqt" value={`${draft.dailyHours ? DAILY_OPTIONS.find((o) => o.value === draft.dailyHours)?.label : '—'} · o‘qituvchi: ${draft.teacherHours !== null ? TEACHER_OPTIONS.find((o) => o.value === draft.teacherHours)?.label : '—'}`} onEdit={() => go('time')} />
                  </dl>
                </Panel>

                {!allDone ? (
                  <p className="px-1 text-sm font-medium text-muted-foreground">
                    Barcha savollarga javob bering. Yetishmayotgan qadamlar tahrirlash orqali to‘ldiriladi.
                  </p>
                ) : null}

                <PrimaryButton
                  onClick={generate}
                  disabled={!allDone || generating}
                  busy={generating}
                  icon={<Sparkles aria-hidden="true" className="size-4" />}
                  className="w-full sm:min-h-14 sm:text-base"
                >
                  {generating ? 'Reja tayyorlanmoqda…' : 'AI reja yaratish'}
                </PrimaryButton>
              </>
            )}
          </>
        )}
      </section>

      {/* ───── Navigatsiya ───── */}
      <footer className="flex items-center justify-between gap-3 pt-1">
        {stepIndex > 0 && step !== 'review' ? (
          <button
            type="button"
            onClick={goBack}
            className={`ob-fade group inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-foreground ring-1 ring-black/15 transition hover:bg-black/5 active:scale-95 motion-reduce:transition-none ${focusRing}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" /> Orqaga
          </button>
        ) : <span />}

        {step === 'review' ? (
          plan ? (
            <PrimaryButton onClick={() => router.replace('/dashboard')} icon={<ArrowUpRight aria-hidden="true" className="size-4" />}>
              Kabinetga o‘tish
            </PrimaryButton>
          ) : null
        ) : (
          <PrimaryButton
            onClick={saveAndNext}
            disabled={!canNext || saving}
            busy={saving}
            icon={<ArrowRight aria-hidden="true" className="size-4" />}
          >
            Keyingisi
          </PrimaryButton>
        )}
      </footer>
    </div>
  )
}