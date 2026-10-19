'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpenText, CheckCircle2, Clock3, Headphones, Mic, Pencil, Play } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import { FOCUS, LIME } from '@/lib/brand'
import { Badge, Empty, ErrorBox, Loading, fmtDate } from './ui'

export type TestCard = {
  id: string
  title: string
  meta: (string | null | undefined)[]
  free?: boolean
  /** Test qaysi qismga tegishli (masalan, 'Part 1'). Berilsa, katalog qismlar bo'yicha guruhlanadi va filtrlanadi. */
  part?: string | null
}
export type ResultRow = { id: number; date: string; score: string; level?: string | null; note?: string | null }

// Dashboard'dagi ko'nikma ranglari va ikonkalari bilan bir xil (writing — #EA580C, kontrast uchun)
const SKILLS = {
  reading: { tint: '#E6EEFF', accent: '#2563EB', icon: BookOpenText },
  listening: { tint: '#F3E8FF', accent: '#9333EA', icon: Headphones },
  writing: { tint: '#FFEDD5', accent: '#EA580C', icon: Pencil },
  speaking: { tint: '#FFE4E6', accent: '#E11D48', icon: Mic },
} as const
type SkillKind = keyof typeof SKILLS

function detectSkill(title: string): SkillKind {
  const t = title.toLowerCase()
  return (Object.keys(SKILLS) as SkillKind[]).find((k) => t.includes(k)) ?? 'reading'
}

/**
 * Practice katalogida faqat is_practice=true va faol testlar ko'rsatiladi.
 * Backend (submit/attempts) shu shartni talab qiladi: aks holda talaba testni ochib, keyin 404 oladi.
 * Maydon javobda umuman bo'lmasa (undefined), test yashirilmaydi: faqat aniq `false` yashiriladi.
 */
function isPracticeVisible(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return true
  if (raw.is_practice === false) return false
  if (raw.is_active === false) return false
  return true
}

/** Dekorativ halqa — matn ostida qoladi, bosilmaydi */
function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}

const PART_RE = /\bpart\s*(\d+)/i

/** Qismni aniqlash: avval `part` maydoni, so'ng sarlavha yoki meta ichidagi "Part N" */
function detectPart(t: TestCard): string | null {
  if (t.part) return t.part
  const m = t.title.match(PART_RE) ?? t.meta.map((x) => x?.match(PART_RE)).find(Boolean)
  return m ? `Part ${m[1]}` : null
}

const partNum = (p: string) => parseInt(p.replace(/\D/g, ''), 10) || 0

/**
 * Mini-test sarlavhasi: "Reading — Paper 2 (National Assessment) — Part 1: Part 1"
 * → "Paper 2 (National Assessment)". Uchta segment bo'lsa o'rtadagisi olinadi,
 * aks holda birinchi segment.
 */
const baseTitle = (title: string) => {
  const segs = title.split(/\s[—–]\s/).map((s) => s.trim())
  return segs.length > 2 ? segs[1] : segs[0]
}

const WAVE = [30, 55, 40, 78, 50, 92, 60, 35, 72, 45, 85, 42, 26, 58]

/** Hero o'ng tomonidagi bezak — har bir ko'nikma uchun o'zining ko'rinishi */
function HeroPreview({ kind, accent }: { kind: SkillKind; accent: string }) {
  const bar = 'rounded-full bg-foreground/12'
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-8 top-1/2 z-0 hidden w-60 -translate-y-1/2 rotate-3 rounded-3xl bg-white p-5 shadow-xl shadow-black/10 ring-1 ring-black/5 lg:block xl:right-12 xl:w-64"
    >
      {kind === 'listening' && (
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full text-white" style={{ background: accent }}>
              <Play className="size-4 fill-current" />
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
              <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
            </div>
          </div>
          <div className="mt-5 flex h-16 items-center gap-1">
            {WAVE.map((h, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ height: `${h}%`, background: i < 6 ? accent : `${accent}40` }} />
            ))}
          </div>
        </>
      )}

      {kind === 'reading' && (
        <>
          <div className="h-3 w-2/5 rounded-full" style={{ background: accent }} />
          <div className="mt-4 space-y-2.5">
            <div className={`h-2 w-full ${bar}`} />
            <div className={`h-2 w-11/12 ${bar}`} />
            <div className="h-2.5 w-4/5 rounded-full" style={{ background: LIME }} />
            <div className={`h-2 w-full ${bar}`} />
            <div className={`h-2 w-3/5 ${bar}`} />
          </div>
          <div className="mt-5 flex gap-2">
            {['A', 'B', 'C'].map((l, i) => (
              <span
                key={l}
                className="flex size-8 items-center justify-center rounded-full text-xs font-bold"
                style={i === 1 ? { background: accent, color: '#fff' } : { background: `${accent}1A`, color: accent }}
              >
                {l}
              </span>
            ))}
          </div>
        </>
      )}

      {kind === 'writing' && (
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
              <Pencil className="size-4" />
            </span>
            <div className="h-2.5 w-2/5 rounded-full bg-foreground/20" />
          </div>
          <div className="mt-4 space-y-2.5">
            <div className={`h-2 w-full ${bar}`} />
            <div className={`h-2 w-full ${bar}`} />
            <div className={`h-2 w-10/12 ${bar}`} />
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-1/2 ${bar}`} />
              <span className="h-4 w-0.5 rounded-full" style={{ background: accent }} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ background: `${accent}1F` }}>
            <div className="h-full w-3/5 rounded-full" style={{ background: accent }} />
          </div>
        </>
      )}

      {kind === 'speaking' && (
        <>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: accent }} />
            <div className="h-2 w-1/3 rounded-full bg-foreground/15" />
          </div>
          <div className="relative mx-auto mt-4 flex size-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full" style={{ border: `6px solid ${accent}1A` }} />
            <span className="absolute inset-2.5 rounded-full" style={{ border: `5px solid ${accent}33` }} />
            <span className="relative flex size-11 items-center justify-center rounded-full text-white" style={{ background: accent }}>
              <Mic className="size-5" />
            </span>
          </div>
          <div className="mt-4 flex h-10 items-center gap-1">
            {WAVE.map((h, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ height: `${h}%`, background: accent, opacity: i % 3 === 0 ? 1 : 0.45 }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function SkillPractice(props: {
  title: string
  desc: string
  listPath: string
  resultsPath: string
  testBaseHref?: string
  toTest: (raw: any) => TestCard
  toResult: (raw: any) => ResultRow
  resultAction?: (id: number, reload: () => void) => ReactNode
  /** Hero'dan keyin ko'rsatiladigan ixtiyoriy blok (masalan, obuna ogohlantirishi). */
  notice?: ReactNode
  /** Natijalardan keyin ko'rsatiladigan ixtiyoriy blok. */
  footer?: ReactNode
  /** Start huquqi: 'loading' — hali aniqlanmagan, 'locked' — lockedAction ko'rsatiladi. Default 'open'. */
  accessState?: 'loading' | 'open' | 'locked'
  /** accessState 'locked' bo'lganda "Boshlash" o'rniga ko'rsatiladigan amallar. */
  lockedAction?: (t: TestCard) => ReactNode
}) {
  const { title, desc, listPath, resultsPath, testBaseHref, toTest, toResult, resultAction, notice, footer, accessState = 'open', lockedAction } = props
  const tests = useApi<any[]>(listPath)
  const results = useApi<any[]>(resultsPath)
  const kind = detectSkill(title)
  const { tint, accent, icon: SkillIcon } = SKILLS[kind]
  const accentVar = { '--accent': accent } as CSSProperties
  // is_practice=false (yoki nofaol) testlar katalogda ko'rsatilmaydi
  const cards = (tests.data ?? []).filter(isPracticeVisible).map((raw) => {
    const t = toTest(raw)
    return { ...t, part: detectPart(t) }
  })
  const partCards = cards.filter((c) => c.part).sort((x, y) => partNum(x.part!) - partNum(y.part!))
  const fullCards = cards.filter((c) => !c.part)
  const hasParts = partCards.length > 0

  const renderMetas = (t: TestCard, dark = false) => {
    const metas = t.meta.filter((m): m is string => !!m && !/mini-?test/i.test(m))
    if (!metas.length) return null
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {metas.map((meta, i) => (
          <span
            key={`${meta}-${i}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              dark ? 'bg-white/10 text-white/80' : 'bg-foreground/5 text-foreground/70'
            }`}
          >
            {/daqiqa|min/i.test(meta) ? <Clock3 aria-hidden="true" className="size-3.5" /> : null}
            {meta}
          </span>
        ))}
      </div>
    )
  }

  // "Boshlash" — dashboarddagi CTA kabi: to'q pill + oq dumaloq strelka (to'q kartada: lime pill)
  const renderAction = (t: TestCard, cls = 'w-full', onDark = false) =>
    accessState === 'locked' ? (
      lockedAction ? lockedAction(t) : null
    ) : accessState === 'loading' ? null : (
      testBaseHref && (
        <Link
          href={`${testBaseHref}/${t.id}`}
          style={onDark ? { background: LIME } : undefined}
          className={`group/btn inline-flex min-h-12 items-center justify-between gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-bold transition active:scale-[0.98] motion-reduce:transition-none ${
            onDark ? 'text-foreground hover:brightness-95' : 'bg-foreground text-white hover:bg-foreground/90'
          } ${FOCUS} ${cls}`}
        >
          Boshlash
          <span
            className={`flex size-9 items-center justify-center rounded-full transition-transform group-hover/btn:rotate-45 motion-reduce:transition-none ${
              onDark ? 'bg-foreground text-white' : 'bg-white text-foreground'
            }`}
          >
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
        </Link>
      )
    )

  const cardBase =
    'group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:ring-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0'

  // Karta tepasi: ko'nikma rangidagi blok, oq ikonka chipi, yorliqlar va suv belgisi
  const renderHead = (t: TestCard, badge: string | null, mark: ReactNode) => (
    <div className="relative isolate flex min-h-32 flex-col justify-between overflow-hidden p-5 sm:min-h-36 sm:p-6" style={{ background: tint }}>
      <Circle color={`${accent}14`} width={16} className="-left-10 -top-14 size-36" />
      {mark}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
          style={{ color: accent }}
        >
          <SkillIcon aria-hidden="true" className="size-6" strokeWidth={1.9} />
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-black/5" style={{ color: accent }}>
              {badge}
            </span>
          )}
          {t.free && <Badge tone="green">Bepul</Badge>}
        </div>
      </div>
    </div>
  )

  // Qismlari yo'q oddiy test kartasi
  const renderCard = (t: TestCard) => (
    <article key={t.id} style={accentVar} className={cardBase}>
      {renderHead(
        t,
        null,
        <SkillIcon
          aria-hidden="true"
          strokeWidth={1}
          style={{ color: accent }}
          className="pointer-events-none absolute -bottom-6 -right-4 z-0 size-32 opacity-[0.16] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none"
        />,
      )}
      <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
        <div>
          <h3 className="line-clamp-2 text-xl font-black leading-snug tracking-tight text-foreground">{t.title}</h3>
          {renderMetas(t)}
        </div>
        <div className="flex flex-wrap items-center gap-2">{renderAction(t)}</div>
      </div>
    </article>
  )

  // Bitta qism (Part N) uchun mini-test kartasi: tepasida katta raqam
  const renderPartCard = (t: TestCard) => {
    const n = partNum(t.part!)
    return (
      <article key={t.id} style={accentVar} className={cardBase}>
        {renderHead(
          t,
          'Mini-test',
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 right-4 z-0 select-none text-[8rem] font-black leading-none tracking-tighter transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            style={{ color: `${accent}29` }}
          >
            {n}
          </span>,
        )}
        <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <h3 className="text-3xl font-black leading-none tracking-tighter text-foreground">{t.part}</h3>
            <p className="mt-1.5 line-clamp-1 text-sm font-medium text-foreground/60">{baseTitle(t.title)}</p>
            {renderMetas(t)}
          </div>
          <div className="flex flex-wrap items-center gap-2">{renderAction(t)}</div>
        </div>
      </article>
    )
  }

  // To'liq test: keng, to'q kartochka
  const renderFullCard = (t: TestCard) => (
    <article
      key={t.id}
      className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 md:flex-row md:items-center md:justify-between"
    >
      <Circle color="rgba(255,255,255,0.06)" width={22} className="-right-16 -top-20 size-56 sm:size-72" />
      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold text-foreground" style={{ background: LIME }}>
            To‘liq test
          </span>
          {t.free && <Badge tone="green">Bepul</Badge>}
        </div>
        <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">{t.title}</h3>
        {renderMetas(t, true)}
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-2 md:shrink-0">{renderAction(t, 'w-full md:w-auto', true)}</div>
    </article>
  )

  const gridCls = 'grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3'

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      <Link
        href="/dashboard"
        className={`-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground active:scale-95 ${FOCUS}`}
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Kabinetga qaytish
      </Link>

      {/* Hero + statistika */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div
          className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 ring-1 ring-black/5 sm:p-8 lg:col-span-3 lg:min-h-80 lg:p-10"
          style={{ background: tint }}
        >
          <Circle color={`${accent}1A`} width={24} className="-right-16 -top-16 size-48 sm:size-72" />
          <Circle color={`${accent}12`} width={18} className="-bottom-24 right-24 hidden size-56 lg:block" />
          <HeroPreview kind={kind} accent={accent} />

          <div className="relative z-10">
            <span
              className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:size-14"
              style={{ color: accent }}
            >
              <SkillIcon aria-hidden="true" className="size-6 sm:size-7" strokeWidth={1.9} />
            </span>
            <h1 className="text-5xl font-black leading-none tracking-tighter text-foreground sm:text-6xl">{title}</h1>
            <p className="mt-3 max-w-md text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base lg:max-w-[18rem] xl:max-w-sm">
              {desc}. Darajangizga mos testni tanlang va natijalaringizni kuzatib boring.
            </p>
          </div>

          <a
            href="#available-tests-heading"
            className={`group relative z-10 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 active:scale-[0.98] motion-reduce:transition-none min-[420px]:w-fit min-[420px]:justify-start ${FOCUS}`}
          >
            Testlarni ko‘rish
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground">
              <ArrowRight aria-hidden="true" className="size-4 rotate-90 transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none" />
            </span>
          </a>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10 flex h-full flex-col gap-5">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Sizning mashqlaringiz</h2>
              <p className="mt-0.5 text-xs text-white/55">{title} bo‘yicha umumiy ko‘rsatkich</p>
            </div>
            <dl className="grid flex-1 gap-3 sm:grid-rows-2">
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground" style={{ background: LIME }}>
                  <SkillIcon aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <dt className="min-w-0 flex-1 text-sm font-medium text-white/70">Mavjud testlar</dt>
                <dd className="text-5xl font-black leading-none tabular-nums sm:text-6xl" style={{ color: LIME }}>
                  {tests.loading ? '—' : cards.length}
                </dd>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-foreground">
                  <CheckCircle2 aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <dt className="min-w-0 flex-1 text-sm font-medium text-white/70">Yakunlangan</dt>
                <dd className="text-5xl font-black leading-none tabular-nums text-white sm:text-6xl">
                  {results.loading ? '—' : results.data?.length ?? 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {notice}

      {/* Testlar */}
      <section aria-labelledby="available-tests-heading" className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="available-tests-heading" className="scroll-mt-6 text-xl font-black tracking-tight text-foreground sm:scroll-mt-20 sm:text-3xl">
            Testlar katalogi
          </h2>
          {!tests.loading && !tests.error && (
            <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-bold tabular-nums text-white">
              {cards.length} ta
            </span>
          )}
        </div>

        {tests.loading ? (
          <Loading rows={2} />
        ) : tests.error ? (
          <ErrorBox message={tests.error.message} onRetry={tests.reload} />
        ) : !cards.length ? (
          <div className="rounded-3xl border border-dashed border-foreground/20 bg-white px-5 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl" style={{ background: tint, color: accent }}>
              <SkillIcon aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-foreground">Hozircha testlar yo‘q.</p>
            <p className="mt-1 text-sm text-foreground/60">Yangi testlar qo‘shilganda shu yerda ko‘rinadi.</p>
          </div>
        ) : !hasParts ? (
          <div className={gridCls}>{cards.map(renderCard)}</div>
        ) : (
          <>
            {fullCards.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground sm:text-xl">To‘liq test</h3>
                  <p className="mt-0.5 text-sm text-foreground/60">Barcha qismlar bitta imtihonda — haqiqiy imtihon sharoitida.</p>
                </div>
                <div className="space-y-3 sm:space-y-4">{fullCards.map(renderFullCard)}</div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-base font-black tracking-tight text-foreground sm:text-xl">Qismlar bo‘yicha mashq</h3>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums" style={{ background: tint, color: accent }}>
                  {partCards.length} ta qism
                </span>
              </div>
              <p className="text-sm text-foreground/60">Har bir qismni alohida mashq qiling — qisqa va aniq.</p>
              <div className={gridCls}>{partCards.map(renderPartCard)}</div>
            </div>
          </>
        )}
      </section>

      {/* Natijalar */}
      <section aria-labelledby="practice-results-heading" className="space-y-3 sm:space-y-4">
        <h2 id="practice-results-heading" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">
          Mening natijalarim
        </h2>

        {results.loading ? (
          <Loading rows={2} />
        ) : results.error ? (
          <ErrorBox message={results.error.message} onRetry={results.reload} />
        ) : !results.data?.length ? (
          <div className="rounded-3xl border border-dashed border-foreground/20 bg-white p-8 text-center">
            <Empty text="Hali natija yo‘q." />
            <p className="mt-1 text-sm text-foreground/60">Birinchi testni yakunlaganingizdan so‘ng natijangiz shu yerda chiqadi.</p>
          </div>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {results.data.map((raw) => {
              const r = toResult(raw)
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:px-6 sm:py-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: tint, color: accent }}
                    >
                      <CheckCircle2 aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{fmtDate(r.date)}</p>
                      <p className="mt-0.5 truncate text-xs text-foreground/60">{r.note || 'Test yakunlandi'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    {r.level && <Badge tone="primary">{r.level}</Badge>}
                    <div className="min-w-14 rounded-2xl px-3 py-1.5 text-center" style={{ background: tint }}>
                      <p className="text-xl font-black leading-tight tabular-nums text-foreground">{r.score}</p>
                      <p className="text-[11px] font-medium text-foreground/60">ball</p>
                    </div>
                    {resultAction?.(r.id, results.reload)}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {footer}
    </div>
  )
}