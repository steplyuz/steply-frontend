'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpRight, ChevronLeft, ChevronRight, CheckCircle2, Clock3, Crown, Sparkles } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import type { PracticeCatalog, PracticeSkill } from '@/lib/api/types'
import { isLockedTest } from '@/lib/practice/access'
import { useSpeakingGrading } from '@/lib/speaking/access'
import { FOCUS, LIME } from '@/lib/brand'
import { SpeakingGradingNotice } from './speaking-grading-notice'
import { SpeakingHistory } from './speaking-history'
import { SpeakingLockedActions } from './speaking-locked'
import { SKILLS, LockedBadge, PremiumLockButton, baseTitle, isPracticeVisible } from './skill-practice'
import { PRACTICE_CONFIG, SKILL_ORDER, type HubTest } from './practice-config'
import { Badge, Empty, ErrorBox, Loading, btn, fmtDate } from './ui'

const PAGE_SIZE = 12

type Card = HubTest & { raw: any; num: number | null; part: string | null; locked: boolean; premium: boolean }

/** Sarlavhadan test raqamini ajratadi: "Speaking Test 43 (Energy)" → 43, "Paper 2 — Part 1" → 2 */
function testNumber(title: string): number | null {
  const m = title.match(/(?:test|paper|#)\s*(\d+)/i) ?? title.match(/(\d+)(?!.*\d)/)
  return m ? parseInt(m[1], 10) : null
}

/** Katta raqam ko'rinadigan sarlavha: "Speaking Test 43 (Energy)" → "Test 43 (Energy)" ning o'rniga ko'nikma nomini olib tashlaymiz */
function cleanTitle(title: string, label: string) {
  return baseTitle(title).replace(new RegExp(`^${label}\\s*[-—:]?\\s*`, 'i'), '').trim() || baseTitle(title)
}

export function PracticeHub() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get('skill') as PracticeSkill | null
  const active: PracticeSkill = requested && SKILL_ORDER.includes(requested) ? requested : 'reading'
  const cfg = PRACTICE_CONFIG[active]
  const { tint, accent, icon: SkillIcon } = SKILLS[active]

  const catalog = useApi<PracticeCatalog>('/practice/tests')
  const results = useApi<any[]>(cfg.resultsPath)
  const speaking = useSpeakingGrading()
  const [page, setPage] = useState(1)

  useEffect(() => setPage(1), [active])

  const select = (s: PracticeSkill) => router.replace(`${pathname}?skill=${s}`, { scroll: false })

  const cards: Card[] = useMemo(() => {
    const list = (catalog.data?.items?.[active] ?? []).filter(isPracticeVisible).map((raw: any) => {
      const t = cfg.toTest(raw)
      return {
        ...t, raw,
        num: testNumber(t.title),
        part: raw.practice_part_number ? `Part ${raw.practice_part_number}` : null,
        locked: isLockedTest(raw ?? {}),
        premium: raw?.access === 'premium',
      }
    })
    // Yangi (katta raqamli) testlar tepada
    return list.every((c) => c.num !== null) ? [...list].sort((a, b) => (b.num! - a.num!) || (a.part ?? '').localeCompare(b.part ?? '')) : list
  }, [catalog.data, active, cfg])

  const pages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = cards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const counts = (s: PracticeSkill) => (catalog.data?.items?.[s] ?? []).filter(isPracticeVisible).length

  const speakingState = active === 'speaking' ? (speaking.loading ? 'loading' : speaking.canGrade ? 'open' : 'locked') : 'open'

  const renderAction = (t: Card) => {
    if (t.locked) return <PremiumLockButton cls="w-full" />
    if (speakingState === 'locked') return <SpeakingLockedActions testId={t.id} title={t.title} />
    if (speakingState === 'loading') return null
    return (
      <Link
        href={`${cfg.testBaseHref}/${t.id}`}
        className={`group/btn inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] motion-reduce:transition-none ${FOCUS}`}
      >
        Boshlash
        <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover/btn:rotate-45 motion-reduce:transition-none">
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    )
  }

  const accentVar = { '--accent': accent } as CSSProperties

  return (
    <div className="space-y-6 pb-6 sm:space-y-8">
      {/* Sarlavha + umumiy ko'rsatkichlar */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black leading-none tracking-tighter text-foreground sm:text-5xl">Practice</h1>
          <p className="mt-2 text-sm font-medium text-foreground/60 sm:text-base">Ko‘nikmani tanlang, testni boshlang va natijangizni kuzating.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-foreground px-4 py-2 text-xs font-bold tabular-nums text-white">
            <span style={{ color: LIME }}>{catalog.loading ? '—' : cards.length}</span> ta test
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-bold tabular-nums text-foreground ring-1 ring-black/10">
            {results.loading ? '—' : results.data?.length ?? 0} ta yakunlangan
          </span>
        </div>
      </header>

      {/* Ko'nikma tablari */}
      <div role="tablist" aria-label="Ko‘nikmalar" className="flex gap-2 overflow-x-auto border-b border-black/10 pb-3">
        {SKILL_ORDER.map((s) => {
          const on = s === active
          const { icon: Icon } = SKILLS[s]
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => select(s)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-95 motion-reduce:transition-none ${
                on ? 'bg-foreground text-white' : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
              } ${FOCUS}`}
            >
              <span
                className="flex size-6 items-center justify-center rounded-full"
                style={on ? { background: LIME, color: '#111' } : { color: SKILLS[s].accent }}
              >
                <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
              </span>
              {PRACTICE_CONFIG[s].label}
              <span className={`text-xs tabular-nums ${on ? 'text-white/60' : 'text-foreground/40'}`}>{catalog.loading ? '' : counts(s)}</span>
            </button>
          )
        })}
      </div>

      {active === 'speaking' && (
        <div className="space-y-3">
          <SpeakingGradingNotice />
          <Link href="/dashboard/speaking/ai" className={btn.outline}>
            <Sparkles className="size-4" /> AI baholash va kamchiliklar
          </Link>
        </div>
      )}

      {/* Testlar */}
      <section aria-labelledby="available-tests-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 id="available-tests-heading" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">Mavjud testlar</h2>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: tint, color: accent }}>{cfg.desc}</span>
        </div>

        {catalog.loading ? (
          <Loading rows={3} />
        ) : catalog.error ? (
          <ErrorBox message={catalog.error.message} onRetry={catalog.reload} />
        ) : !cards.length ? (
          <div className="rounded-3xl border border-dashed border-foreground/20 bg-white px-5 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl" style={{ background: tint, color: accent }}>
              <SkillIcon aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-foreground">Hozircha testlar yo‘q.</p>
            <p className="mt-1 text-sm text-foreground/60">Yangi testlar qo‘shilganda shu yerda ko‘rinadi.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((t, i) => {
                const metas = t.meta.filter((m): m is string => !!m && !/mini-?test/i.test(m))
                const num = t.num ?? (safePage - 1) * PAGE_SIZE + i + 1
                return (
                  <article
                    key={t.id}
                    style={accentVar}
                    className="group relative flex min-h-48 flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:ring-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-1 -top-3 z-0 select-none text-[6.5rem] font-black leading-none tracking-tighter transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      style={{ color: `${accent}24` }}
                    >
                      {num}
                    </span>

                    <div className="relative z-10 min-w-0 pr-16">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {t.part && <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: tint, color: accent }}>{t.part}</span>}
                        {t.free && <Badge tone="green">Bepul</Badge>}
                        {t.locked ? <LockedBadge /> : t.premium ? <Badge tone="amber"><Crown aria-hidden="true" className="mr-1 size-3" />Premium</Badge> : null}
                      </div>
                      <h3 className="line-clamp-2 text-lg font-black leading-snug tracking-tight text-foreground">{cleanTitle(t.title, cfg.label)}</h3>
                      {metas.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {metas.map((m, k) => (
                            <span key={`${m}-${k}`} className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold text-foreground/70">
                              {/daqiqa|min/i.test(m) ? <Clock3 aria-hidden="true" className="size-3" /> : null}
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">{renderAction(t)}</div>
                  </article>
                )
              })}
            </div>

            {pages > 1 && (
              <nav aria-label="Sahifalar" className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-4 text-sm font-bold ring-1 ring-black/10 transition hover:bg-foreground/5 disabled:opacity-40 ${FOCUS}`}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" /> Oldingi
                </button>
                <span className="px-2 text-sm font-semibold tabular-nums text-foreground/60">{safePage} / {pages}</span>
                <button
                  type="button"
                  disabled={safePage === pages}
                  onClick={() => setPage(safePage + 1)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-bold text-white transition hover:bg-foreground/90 disabled:opacity-40 ${FOCUS}`}
                >
                  Keyingi <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Natijalar */}
      <section aria-labelledby="practice-results-heading" className="space-y-3 sm:space-y-4">
        <h2 id="practice-results-heading" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          {cfg.label} natijalarim
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
              const r = cfg.toResult(raw)
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:px-6 sm:py-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: tint, color: accent }}>
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
                    {cfg.resultAction?.(r.id, results.reload)}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {active === 'speaking' && <SpeakingHistory />}
    </div>
  )
}
