'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BookOpen, Check, Clock, Headphones, Loader2, Mic, Pencil, Sparkles, X } from 'lucide-react'

const LIME = '#E4F70A'
const STORAGE_KEY = 'steply:study-path'

export type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking'

export type Answers = {
  target: string
  timeframe: string
  level: string
  weak: SkillKey[]
  minutes: number | null
}

export type StudyPath = {
  summary: string
  weeks: {
    title: string
    focus: string
    tasks: { skill: SkillKey; title: string; minutes: number }[]
  }[]
}

const SKILLS: Record<SkillKey, { label: string; icon: typeof BookOpen; tint: string; accent: string; onAccent: string }> = {
  reading: { label: 'Reading', icon: BookOpen, tint: '#EAEEFF', accent: '#2F4BD8', onAccent: '#fff' },
  listening: { label: 'Listening', icon: Headphones, tint: '#FFEBDC', accent: '#FF8A3D', onAccent: '#1a1a1a' },
  writing: { label: 'Writing', icon: Pencil, tint: '#DFF3E7', accent: '#16603A', onAccent: '#fff' },
  speaking: { label: 'Speaking', icon: Mic, tint: '#F3E6FB', accent: '#B06FDB', onAccent: '#fff' },
}

const TARGETS = ['5.5', '6.0', '6.5', '7.0', '7.5+']
const TIMEFRAMES = ['1 oygacha', '2–3 oy', '4–6 oy', 'Hali aniq emas']
const LEVELS = ['Boshlang‘ich (A2–B1)', 'O‘rta (B1–B2)', 'Yuqori (B2+)', 'Bilmayman — AI aniqlasin']
const MINUTES = [15, 30, 60, 90]

const STEPS = [
  { title: 'Maqsadingiz qaysi band?', hint: 'IELTS’da erishmoqchi bo‘lgan umumiy balingiz.' },
  { title: 'Imtihongacha qancha vaqt bor?', hint: 'Reja shu muddatga moslab tuziladi.' },
  { title: 'Hozirgi darajangiz qanday?', hint: 'Taxminiy javob ham yetarli.' },
  { title: 'Qaysi ko‘nikmalar qiyin?', hint: 'Bir nechtasini tanlashingiz mumkin. Keyin kunlik vaqtni belgilang.' },
]

/** Bitta tanlov tugmasi (radio yoki checkbox kabi) */
function Choice({ selected, onClick, children, role = 'radio' }: { selected: boolean; onClick: () => void; children: React.ReactNode; role?: 'radio' | 'checkbox' }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none ${
        selected ? 'bg-foreground text-white ring-foreground' : 'bg-white text-foreground ring-black/10 hover:ring-black/30'
      }`}
    >
      <span>{children}</span>
      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? '' : 'ring-1 ring-black/20'}`} style={selected ? { background: LIME } : undefined}>
        {selected ? <Check aria-hidden="true" className="size-3.5 text-foreground" strokeWidth={3} /> : null}
      </span>
    </button>
  )
}

/** Yo'lak rasmi — dekorativ */
function PathArt() {
  const nodes = [
    { cx: 30, cy: 150, c: '#2F4BD8' },
    { cx: 110, cy: 80, c: '#FF8A3D' },
    { cx: 200, cy: 118, c: '#16603A' },
    { cx: 280, cy: 40, c: '#B06FDB' },
  ]
  return (
    <svg aria-hidden="true" viewBox="0 0 310 190" className="h-auto w-full max-w-xs">
      <path d="M30 150 C 60 150, 70 80, 110 80 S 170 118, 200 118 S 250 40, 280 40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r="18" fill={n.c} opacity="0.25" />
          <circle cx={n.cx} cy={n.cy} r="10" fill={n.c} />
        </g>
      ))}
      <path d="M280 40 l0 -26 l16 7 l-16 7" fill={LIME} stroke={LIME} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function StudyPathWizard({ onGenerate }: { onGenerate: (answers: Answers) => Promise<StudyPath> }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [path, setPath] = useState<StudyPath | null>(null)
  const [week, setWeek] = useState(0)
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'form' | 'loading' | 'error'>('form')
  const [answers, setAnswers] = useState<Answers>({ target: '', timeframe: '', level: '', weak: [], minutes: null })

  // Saqlangan yo'lni yuklash (backend ulangunga qadar brauzerda saqlanadi)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPath(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  function openDialog() {
    setStep(0)
    setStatus('form')
    dialogRef.current?.showModal()
  }
  function closeDialog() {
    if (status === 'loading') return
    dialogRef.current?.close()
  }

  const canNext = step === 0 ? !!answers.target : step === 1 ? !!answers.timeframe : step === 2 ? !!answers.level : answers.minutes !== null

  async function generate() {
    setStatus('loading')
    try {
      const result = await onGenerate(answers)
      setPath(result)
      setWeek(0)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      } catch {
        /* ignore */
      }
      setStatus('form')
      dialogRef.current?.close()
    } catch {
      setStatus('error')
    }
  }

  function toggleWeak(k: SkillKey) {
    setAnswers((a) => ({ ...a, weak: a.weak.includes(k) ? a.weak.filter((x) => x !== k) : [...a.weak, k] }))
  }

  const current = path?.weeks[week]

  return (
    <>
      {/* ---------- Asosiy blok ---------- */}
      {!path ? (
        <section className="relative overflow-hidden rounded-[32px] bg-foreground p-6 text-white sm:p-10" aria-labelledby="ai-path-title">
          <div className="relative grid items-center gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground" style={{ background: LIME }}>
                <Sparkles aria-hidden="true" className="size-3.5" />
                AI yordamchi
              </span>
              <h2 id="ai-path-title" className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                AI bilan shaxsiy o‘quv yo‘lingizni yarating
              </h2>
              <p className="mt-3 max-w-lg text-base font-medium leading-6 text-white/65">
                4 ta qisqa savolga javob bering — maqsadingiz, vaqtingiz va zaif tomonlaringizga mos haftalik reja tayyor bo‘ladi.
              </p>
              <button
                type="button"
                onClick={openDialog}
                className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-bold text-foreground transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ background: LIME }}
              >
                Yo‘lni yaratish
                <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-white transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </button>
            </div>
            <div className="hidden justify-center md:col-span-2 md:flex">
              <PathArt />
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] bg-white p-6 ring-1 ring-black/10 sm:p-8" aria-labelledby="my-path-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-3.5" />
                AI tuzgan reja
              </span>
              <h2 id="my-path-title" className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Sizning yo‘lingiz</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{path.summary}</p>
            </div>
            <button
              type="button"
              onClick={openDialog}
              className="inline-flex min-h-10 items-center rounded-full px-5 text-sm font-bold text-foreground ring-1 ring-black/15 transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Qayta yaratish
            </button>
          </div>

          <div role="tablist" aria-label="Haftalar" className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {path.weeks.map((w, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                id={`week-tab-${i}`}
                aria-selected={i === week}
                aria-controls="week-panel"
                onClick={() => setWeek(i)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none ${
                  i === week ? 'text-foreground' : 'bg-black/5 text-foreground/70 hover:bg-black/10'
                }`}
                style={i === week ? { background: LIME } : undefined}
              >
                {i + 1}-hafta
              </button>
            ))}
          </div>

          {current ? (
            <div id="week-panel" role="tabpanel" aria-labelledby={`week-tab-${week}`} className="mt-5">
              <p className="text-lg font-extrabold text-foreground">{current.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{current.focus}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {current.tasks.map((t, i) => {
                  const s = SKILLS[t.skill] ?? SKILLS.reading
                  const Icon = s.icon
                  return (
                    <li key={i}>
                      <Link
                        href={`/dashboard/${t.skill}`}
                        className="group flex items-center gap-4 rounded-3xl p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        style={{ background: s.tint }}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: s.accent, color: s.onAccent }}>
                          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-foreground">{t.title}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground/60">
                            <Clock aria-hidden="true" className="size-3" />
                            {t.minutes} daqiqa · {s.label}
                          </span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-foreground/40 transition-transform group-hover:rotate-45 motion-reduce:transition-none" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      {/* ---------- Savollar oynasi ---------- */}
      <dialog
        ref={dialogRef}
        aria-labelledby="wizard-title"
        className="m-auto w-[min(92vw,640px)] overflow-hidden rounded-[32px] bg-[#F7F7F2] p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {status === 'form' ? `${step + 1} / ${STEPS.length}` : 'AI ishlamoqda'}
            </span>
            <button
              type="button"
              onClick={closeDialog}
              disabled={status === 'loading'}
              aria-label="Yopish"
              className="flex size-9 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full bg-black/10">
                <span className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: i <= step ? '100%' : '0%', background: i <= step ? '#111' : 'transparent' }} />
              </span>
            ))}
          </div>

          {status === 'loading' ? (
            <div className="flex flex-col items-center py-14 text-center" role="status" aria-live="polite">
              <span className="flex size-16 items-center justify-center rounded-full" style={{ background: LIME }}>
                <Loader2 aria-hidden="true" className="size-8 animate-spin motion-reduce:animate-none" />
              </span>
              <h2 id="wizard-title" className="mt-6 text-2xl font-black tracking-tight">Yo‘lingiz tuzilmoqda…</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">Bu bir necha soniya oladi. Oynani yopmang.</p>
            </div>
          ) : status === 'error' ? (
            <div className="py-10" role="alert">
              <h2 id="wizard-title" className="text-2xl font-black tracking-tight">Yo‘lni yaratib bo‘lmadi</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ulanishda xatolik yuz berdi. Javoblaringiz saqlangan, qayta urinib ko‘ring.</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={generate} className="min-h-11 rounded-full bg-foreground px-6 text-sm font-bold text-white transition hover:bg-foreground/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  Qayta urinish
                </button>
                <button type="button" onClick={() => setStatus('form')} className="min-h-11 rounded-full px-5 text-sm font-bold ring-1 ring-black/15 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground">
                  Javoblarni tahrirlash
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 id="wizard-title" className="mt-6 text-3xl font-black leading-tight tracking-tight">{STEPS[step].title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{STEPS[step].hint}</p>

              <div className="mt-6">
                {step === 0 && (
                  <div role="radiogroup" aria-labelledby="wizard-title" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TARGETS.map((t) => (
                      <Choice key={t} selected={answers.target === t} onClick={() => setAnswers({ ...answers, target: t })}>Band {t}</Choice>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div role="radiogroup" aria-labelledby="wizard-title" className="grid gap-3 sm:grid-cols-2">
                    {TIMEFRAMES.map((t) => (
                      <Choice key={t} selected={answers.timeframe === t} onClick={() => setAnswers({ ...answers, timeframe: t })}>{t}</Choice>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div role="radiogroup" aria-labelledby="wizard-title" className="grid gap-3">
                    {LEVELS.map((t) => (
                      <Choice key={t} selected={answers.level === t} onClick={() => setAnswers({ ...answers, level: t })}>{t}</Choice>
                    ))}
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-6">
                    <div role="group" aria-label="Qiyin ko‘nikmalar" className="grid gap-3 sm:grid-cols-2">
                      {(Object.keys(SKILLS) as SkillKey[]).map((k) => (
                        <Choice key={k} role="checkbox" selected={answers.weak.includes(k)} onClick={() => toggleWeak(k)}>{SKILLS[k].label}</Choice>
                      ))}
                    </div>
                    <div>
                      <p id="minutes-label" className="mb-3 text-sm font-extrabold">Kuniga necha daqiqa ajrata olasiz?</p>
                      <div role="radiogroup" aria-labelledby="minutes-label" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {MINUTES.map((m) => (
                          <Choice key={m} selected={answers.minutes === m} onClick={() => setAnswers({ ...answers, minutes: m })}>{m} daq</Choice>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(s - 1, 0))}
                  disabled={step === 0}
                  className="min-h-11 rounded-full px-5 text-sm font-bold ring-1 ring-black/15 transition hover:bg-black/5 disabled:invisible focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
                >
                  Orqaga
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext}
                    className="min-h-11 rounded-full bg-foreground px-7 text-sm font-bold text-white transition hover:bg-foreground/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    Keyingisi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generate}
                    disabled={!canNext}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-7 text-sm font-bold text-foreground transition hover:-translate-y-0.5 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    style={{ background: LIME }}
                  >
                    <Sparkles aria-hidden="true" className="size-4" />
                    Yo‘lni yaratish
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  )
}