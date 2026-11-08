'use client'

import { CalendarDays, CheckCircle2, ExternalLink, Flag, Sparkles } from 'lucide-react'
import type { OnboardingPlan } from '@/shared/api/types'
import { CountUp } from './onboarding-animations'
import { SKILL_LABEL, formatExamDate } from './onboarding-constants'
import { Circle } from '@/shared/ui/circle'
import { LIME } from '@/shared/lib/brand'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.05] p-4">
      <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
        <CountUp value={value} />
      </p>
      <p className="mt-1.5 text-xs font-medium leading-snug text-muted-foreground">{label}</p>
    </div>
  )
}

/** Bo‘limlar ketma-ket paydo bo‘lishi uchun kechikish */
const delay = (s: number) => ({ animationDelay: `${s}s` })

export function PlanView({ plan }: { plan: OnboardingPlan }) {
  const totalMinutes = Math.max(plan.daily_breakdown.reduce((sum, item) => sum + item.minutes, 0) || plan.daily_minutes, 1)
  const monthsStart = 0.3

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ───── Xulosa ───── */}
      <div className="ob-rise relative overflow-hidden rounded-3xl bg-brand-texture p-6 text-white sm:p-8">
        <Circle color="rgba(255,255,255,0.06)" width={20} className="ob-float -bottom-16 -right-16 size-44 sm:size-60" />
        <div className="relative z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground"
            style={{ background: LIME }}
          >
            <Sparkles aria-hidden="true" className="ob-wiggle size-3.5" />
            AI reja
          </span>
          <p className="ob-rise mt-4 text-base font-medium leading-7 text-white/85 sm:text-lg sm:leading-8" style={delay(0.15)}>
            {plan.summary}
          </p>
          {plan.exam ? (
            <div className="ob-rise mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/75" style={delay(0.25)}>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="size-4" />
                {plan.exam.title} — {formatExamDate(plan.exam.date)}
              </span>
              <a
                href={plan.exam.register_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-foreground transition hover:brightness-95 active:scale-95 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ background: LIME }}
              >
                mygov’da ro‘yxatdan o‘tish
                <ExternalLink aria-hidden="true" className="size-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {/* ───── Kunlik tartib ───── */}
      <section
        className="ob-rise rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.07] sm:p-8"
        style={delay(0.12)}
        aria-labelledby="plan-daily"
      >
        <h3 id="plan-daily" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Kunlik tartib</h3>

        <div className="ob-stagger mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat value={plan.daily_minutes} label="daqiqa kuniga" />
          <Stat value={plan.teacher_sessions_per_week} label="O‘qituvchi bilan, haftasiga" />
          <Stat value={plan.vocabulary_words_per_day} label="so‘z kuniga" />
        </div>

        <ul className="mt-6 space-y-4">
          {plan.daily_breakdown.map((item, i) => {
            const width = Math.round((item.minutes / totalMinutes) * 100)
            return (
              <li key={item.skill} className="ob-rise" style={delay(0.3 + i * 0.07)}>
                <div className="flex items-baseline justify-between gap-3 text-sm font-bold text-foreground">
                  <span>{SKILL_LABEL[item.skill] ?? item.skill}</span>
                  <span className="tabular-nums text-muted-foreground">
                    <b className="text-base text-foreground"><CountUp value={item.minutes} /></b> daq
                  </span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]"
                  role="progressbar"
                  aria-label={SKILL_LABEL[item.skill] ?? item.skill}
                  aria-valuenow={item.minutes}
                  aria-valuemin={0}
                  aria-valuemax={totalMinutes}
                >
                  <div
                    className="ob-grow h-full rounded-full bg-foreground"
                    style={{ width: `${width}%`, animationDelay: `${0.4 + i * 0.08}s` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ───── Oylar ───── */}
      <section className="space-y-3 sm:space-y-4" aria-labelledby="plan-months">
        <h3
          id="plan-months"
          className="ob-rise px-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          style={delay(monthsStart)}
        >
          Oylar bo‘yicha yo‘l
        </h3>
        {plan.months.map((m, i) => (
          <article
            key={`${m.month}-${i}`}
            className="ob-rise flex gap-4 rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.07] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6"
            style={delay(monthsStart + 0.08 + i * 0.1)}
          >
            <span
              aria-hidden="true"
              className="ob-pop flex size-10 shrink-0 items-center justify-center rounded-full text-base font-semibold text-foreground sm:size-12"
              style={{ background: LIME, animationDelay: `${monthsStart + 0.2 + i * 0.1}s` }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.month}</p>
              <p className="mt-1 text-base font-semibold leading-snug text-foreground sm:text-lg">{m.focus}</p>
              {m.weekly_goals.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {m.weekly_goals.map((goal, j) => (
                    <li key={j} className="flex gap-2 text-sm font-medium leading-snug text-muted-foreground">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {/* ───── Bosqichlar ───── */}
      {plan.milestones.length > 0 ? (
        <section
          className="ob-rise relative overflow-hidden rounded-3xl bg-[#16603A] p-5 text-white sm:p-8"
          style={delay(monthsStart + 0.2 + plan.months.length * 0.1)}
          aria-labelledby="plan-milestones"
        >
          <Circle color="rgba(255,255,255,0.08)" width={18} className="ob-float -bottom-12 -right-12 size-36 sm:size-48" />
          <div className="relative z-10">
            <h3 id="plan-milestones" className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
              <Flag aria-hidden="true" className="size-5" style={{ color: LIME }} />
              Bosqichlar
            </h3>
            <ol className="ob-stagger mt-4 space-y-3">
              {plan.milestones.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm font-semibold leading-snug text-white/90 sm:text-base">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground"
                    style={{ background: LIME }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{m}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </div>
  )
}