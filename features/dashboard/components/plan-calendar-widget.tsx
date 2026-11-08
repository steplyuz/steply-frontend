'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Flag } from 'lucide-react'
import type { OnboardingPlan } from '@/shared/api/types'
import { Uz, useAlphabet } from '@/shared/providers/alphabet-provider'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
const DAY_MS = 86_400_000
const PLAN_MONTH_DAYS = 30

/* Manba matnlar amaldagi alifboda; render paytida t() orqali o'tkaziladi */
const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const WEEKDAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseIsoDate(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function diffDays(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Dushanbadan boshlanadigan oy to'ri */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= days; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Sanaga mos reja oyi va hafta maqsadi. Reja davridan tashqarida null. */
function planSlotFor(date: Date, start: Date, plan: OnboardingPlan): { monthIndex: number; goal: string | null } | null {
  const months = plan.months ?? []
  if (months.length === 0) return null
  const offset = diffDays(start, date)
  if (offset < 0 || offset >= months.length * PLAN_MONTH_DAYS) return null
  const monthIndex = Math.floor(offset / PLAN_MONTH_DAYS)
  const goals = months[monthIndex].weekly_goals ?? []
  const weekIndex = Math.min(Math.floor((offset - monthIndex * PLAN_MONTH_DAYS) / 7), Math.max(goals.length - 1, 0))
  return { monthIndex, goal: goals[weekIndex] ?? null }
}

function formatIso(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}

export function PlanCalendarWidget({
  plan,
  startedAt,
  loading,
}: {
  plan: OnboardingPlan | null | undefined
  /** Reja boshlangan sana (plan_generated_at). Yo'q bo'lsa bugundan hisoblanadi. */
  startedAt?: string | null
  loading?: boolean
}) {
  const { t } = useAlphabet()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedKey, setSelectedKey] = useState(keyOf(today))

  const start = useMemo(() => {
    const parsed = startedAt ? new Date(startedAt) : null
    return parsed && !Number.isNaN(parsed.getTime()) ? startOfDay(parsed) : today
  }, [startedAt, today])

  const examDate = useMemo(() => (plan?.exam ? parseIsoDate(plan.exam.date) : null), [plan])
  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view])

  if (loading) {
    return (
      <section className="rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06]" aria-busy="true">
        <div className="h-4 w-28 animate-pulse rounded-full bg-primary-strong/[0.07] motion-reduce:animate-none" />
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-primary-strong/[0.05] motion-reduce:animate-none" />
      </section>
    )
  }

  if (!plan) {
    return (
      <section className="flex flex-col gap-3 rounded-3xl bg-brand-texture p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays aria-hidden="true" className="size-4 text-brand-glow" />
            <Uz>Hali AI rejangiz yo‘q</Uz>
          </p>
          <p className="mt-1 text-xs text-white/70">
            <Uz>Bir necha savolga javob bering — shaxsiy kalendar tuziladi.</Uz>
          </p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-brand-glow px-5 text-xs font-bold text-primary-strong transition hover:brightness-95 ${focusRing}`}
        >
          <Uz>Rejani tuzish</Uz>
        </Link>
      </section>
    )
  }

  const exam = plan.exam
  const examLeft = examDate ? diffDays(today, examDate) : null
  const selectedDate = parseIsoDate(selectedKey) ?? today
  const selectedSlot = planSlotFor(selectedDate, start, plan)
  const selectedMonth = selectedSlot ? plan.months[selectedSlot.monthIndex] : null
  const isExamDay = !!examDate && keyOf(examDate) === selectedKey
  const selectedLeft = diffDays(today, selectedDate)

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06] sm:p-6" aria-labelledby="plan-calendar-title">
      {/* Sarlavha */}
      <div className="flex items-center justify-between gap-3">
        <h2
          id="plan-calendar-title"
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground"
        >
          <CalendarDays aria-hidden="true" className="size-[18px] text-primary" />
          <Uz>Kalendar</Uz>
        </h2>
        {exam && examLeft !== null ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${examLeft <= 7 ? 'bg-brand-glow text-primary-strong' : 'bg-muted text-foreground'
              }`}
          >
            <Flag aria-hidden="true" className="size-3" />
            {examLeft > 0 ? t(`${examLeft} kun qoldi`) : examLeft === 0 ? t('Bugun!') : t('o‘tib ketgan')}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[18.5rem_1fr] lg:items-start lg:gap-6">
        <div>
          {/* Oy navigatsiyasi */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t('Oldingi oy')}
              className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-90 ${focusRing}`}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p className="font-display text-sm font-semibold tracking-tight text-foreground" aria-live="polite">
              {t(MONTHS_UZ[view.month])} {view.year}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('Keyingi oy')}
              className={`flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-90 ${focusRing}`}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>

          {/* Hafta kunlari */}
          <div className="mt-4 grid grid-cols-7" aria-hidden="true">
            {WEEKDAYS_SHORT.map((d) => (
              <span key={d} className="pb-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {t(d)}
              </span>
            ))}
          </div>

          {/* Kunlar to'ri */}
          <div className="grid grid-cols-7 gap-y-1.5" aria-label={t(`${MONTHS_UZ[view.month]} ${view.year} kalendari`)}>
            {grid.map((date, i) => {
              if (!date) return <span key={`e-${i}`} aria-hidden="true" />

              const key = keyOf(date)
              const isToday = key === keyOf(today)
              const isSelected = key === selectedKey
              const isExam = !!examDate && key === keyOf(examDate)
              const inPlan = !!planSlotFor(date, start, plan) && (!examDate || date <= examDate)

              let circle = 'text-foreground/80 hover:bg-secondary'
              if (isSelected) circle = 'bg-primary-strong text-white shadow-sm shadow-primary-strong/25'
              else if (isExam) circle = 'font-semibold text-foreground ring-2 ring-primary-strong'
              else if (isToday) circle = 'font-semibold text-foreground ring-1 ring-primary/40'

              return (
                <div key={key} className="flex items-center justify-center">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={`${date.getDate()}-${t(MONTHS_UZ[date.getMonth()].toLowerCase())}, ${t(WEEKDAYS_FULL[date.getDay()])}${isExam ? `, ${t('imtihon kuni')}` : ''}`}
                    onClick={() => setSelectedKey(key)}
                    className={`relative flex size-9 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition active:scale-90 ${circle} ${focusRing}`}
                  >
                    {date.getDate()}
                    {inPlan && !isSelected && !isExam ? (
                      <span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-primary" />
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* o'ng tomon: tanlangan kun vazifasi */}
        <div className="flex flex-col gap-3 lg:h-full lg:justify-center">
          <div className="rounded-2xl bg-muted/70 p-4 sm:p-5" aria-live="polite">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Uz>Kundalik vazifa</Uz>
            </span>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-sm font-bold text-foreground">
                {t(WEEKDAYS_FULL[selectedDate.getDay()])}, {selectedDate.getDate()}{' '}
                {t(MONTHS_UZ[selectedDate.getMonth()].toLowerCase())}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {selectedLeft === 0
                  ? t('Bugun')
                  : selectedLeft > 0
                    ? t(`${selectedLeft} kun keyin`)
                    : t(`${-selectedLeft} kun oldin`)}
              </p>
            </div>

            {isExamDay ? (
              <p className="mt-2.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Flag aria-hidden="true" className="size-4 text-primary" /> <Uz>Imtihon kuni — omad!</Uz>
              </p>
            ) : selectedMonth && selectedSlot ? (
              <div className="mt-2.5">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">
                  {selectedMonth.month}
                </span>
                <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{selectedMonth.focus}</p>
                {selectedSlot.goal ? (
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-foreground/75">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{selectedSlot.goal}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2.5 text-sm text-muted-foreground">
                <Uz>Bu sana reja davridan tashqarida.</Uz>
              </p>
            )}
          </div>

          {/* Imtihon sanasi */}
          {exam ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/70 px-4 py-2.5">
              <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                {exam.title} <span className="text-foreground/40">·</span> {formatIso(exam.date)}
              </p>
              <a
                href={exam.register_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary-strong underline underline-offset-2 ${focusRing}`}
              >
                mygov <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}