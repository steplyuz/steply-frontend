'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChartNoAxesCombined, ChevronRight, CirclePlay, RefreshCw, Video } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import { Empty, ErrorBox, Loading, btn } from '@/components/dashboard/ui'
import {
  Circle, LIME, SKILLS, barColor, fmtDay, scoreOf,
  type AnalysisVideo, type Quota, type Skill, type SkillResult,
} from '@/components/dashboard/analysis-shared'

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const ratio = limit && limit > 0 ? Math.min(used / limit, 1) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-white/75">{label}</span>
        <span className="text-sm tabular-nums text-white/55">
          <b className="text-base font-bold text-white">{used}</b> / {limit ?? '∞'}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${ratio * 100}%`, background: barColor(ratio) }}
        />
      </div>
    </div>
  )
}

const RESULT_SKILLS = ['READING', 'LISTENING'] as const
const PREVIEW = 4

export default function AnalysisPage() {
  const videos = useApi<AnalysisVideo[]>('/analysis/videos')
  const limits = useApi<Quota>('/analysis/quota')
  const readingResults = useApi<SkillResult[]>('/reading-tests/me/results')
  const listeningResults = useApi<SkillResult[]>('/listening-tests/me/results')
  const [filter, setFilter] = useState<Skill | 'ALL'>('ALL')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: videos.data?.length ?? 0 }
    videos.data?.forEach((v) => { c[v.skill] = (c[v.skill] ?? 0) + 1 })
    return c
  }, [videos.data])
  const visible = (videos.data ?? []).filter((v) => filter === 'ALL' || v.skill === filter)
  const quota = limits.data
  const resultSources = { READING: readingResults, LISTENING: listeningResults }
  const totalResults = (readingResults.data?.length ?? 0) + (listeningResults.data?.length ?? 0)

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {/* Hero + limit */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div
          className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 text-foreground sm:rounded-[32px] sm:p-8 lg:col-span-3 lg:min-h-72 lg:p-10"
          style={{ background: LIME }}
        >
          <Circle color="rgba(0,0,0,0.07)" width={24} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
          <Circle color="rgba(0,0,0,0.06)" width={18} className="-bottom-24 right-10 hidden size-56 sm:block" />

          <div className="relative z-10">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-foreground text-white shadow-sm sm:size-14" style={{ color: LIME }}>
              <ChartNoAxesCombined aria-hidden="true" className="size-6 sm:size-7" strokeWidth={2} />
            </span>
            <h1 className="text-5xl font-black leading-none tracking-tighter sm:text-7xl">Analysis</h1>
            <p className="mt-3 max-w-md text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
              Test natijalaringiz va tahlil videolari. Xatolaringizni tushunib, keyingi urinishda yaxshilang.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/10 px-4 py-2 text-sm font-bold tabular-nums">{totalResults} ta natija</span>
            <span className="rounded-full bg-black/10 px-4 py-2 text-sm font-bold tabular-nums">{counts.ALL} ta video</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:rounded-[32px] sm:p-8 lg:col-span-2" aria-live="polite">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold sm:text-lg">Video limiti</h2>
                <p className="mt-0.5 text-xs text-white/55">Haftalik va oylik tahlil videolari</p>
              </div>
              {quota && (
                <span className="rounded-full px-3 py-1 text-xs font-bold text-foreground" style={{ background: LIME }}>
                  {quota.tier.toUpperCase()}
                </span>
              )}
            </div>

            {limits.loading && !quota ? (
              <div className="mt-6 space-y-4" aria-busy="true">
                <div className="h-14 w-24 animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
                <div className="h-3 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
              </div>
            ) : limits.error ? (
              <div role="alert" className="mt-6">
                <p className="text-sm font-semibold">Limitlarni yuklab bo‘lmadi</p>
                <p className="mt-1 text-sm text-white/60">{limits.error.message}</p>
                <button type="button" onClick={limits.reload} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">
                  <RefreshCw className="size-4" aria-hidden="true" /> Qayta urinish
                </button>
              </div>
            ) : quota ? (
              <div className="mt-6 space-y-6">
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black leading-none tabular-nums sm:text-7xl" style={{ color: LIME }}>
                    {quota.weekly_remaining ?? '∞'}
                  </span>
                  <span className="pb-1 text-sm font-medium text-white/65">video bu hafta qoldi</span>
                </div>
                <div className="space-y-5">
                  <UsageBar label="Haftalik" used={quota.weekly_used} limit={quota.weekly_limit} />
                  <UsageBar label="Oylik" used={quota.monthly_used} limit={quota.monthly_limit} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Natijalar */}
      <section aria-labelledby="analysis-results" className="space-y-3 sm:space-y-4">
        <div>
          <h2 id="analysis-results" className="text-xl font-black tracking-tight sm:text-3xl">Imtihon natijalari</h2>
          <p className="mt-1 text-sm text-foreground/60">Natijani bosing — savollar bo‘yicha batafsil tahlil ochiladi.</p>
        </div>

        <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          {RESULT_SKILLS.map((skill) => {
            const { label, icon: Icon, tint, accent } = SKILLS[skill]
            const resource = resultSources[skill]
            const all = resource.data ?? []
            const shown = expanded[skill] ? all : all.slice(0, PREVIEW)
            return (
              <section key={skill} aria-label={`${label} natijalari`} className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 sm:rounded-[28px]">
                <div className="relative isolate flex items-center justify-between gap-3 overflow-hidden p-4 sm:p-5" style={{ background: tint }}>
                  <Circle color={`${accent}14`} width={14} className="-right-8 -top-10 size-28" />
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: accent }}>
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.9} />
                    </span>
                    <h3 className="text-xl font-black tracking-tight">{label}</h3>
                  </div>
                  <span className="relative z-10 rounded-full bg-white/80 px-3 py-1 text-xs font-bold tabular-nums" style={{ color: accent }}>
                    {all.length} ta
                  </span>
                </div>

                <div className="p-3 sm:p-4">
                  {resource.loading ? (
                    <Loading rows={2} />
                  ) : resource.error ? (
                    <ErrorBox message={resource.error.message} onRetry={resource.reload} />
                  ) : all.length === 0 ? (
                    <Empty text={`${label} bo‘yicha topshirilgan test natijalari hozircha yo‘q.`} />
                  ) : (
                    <>
                      <ul className="space-y-2">
                        {shown.map((r) => (
                          <li key={`${skill}-${r.id}`}>
                            <Link
                              href={`/dashboard/analysis/results/${skill.toLowerCase()}/${encodeURIComponent(String(r.id))}`}
                              className="group flex min-h-16 items-center gap-3 rounded-2xl p-2.5 pr-3 transition active:scale-[0.99] hover:bg-foreground/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground motion-reduce:transition-none"
                            >
                              <span
                                className="flex w-16 shrink-0 flex-col items-center rounded-2xl py-2"
                                style={{ background: tint, color: accent }}
                              >
                                <span className="text-xl font-black leading-none tabular-nums">{scoreOf(r).toFixed(1)}</span>
                                <span className="mt-1 text-[11px] font-bold">{r.cefr_level || 'ball'}</span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-mono text-sm font-bold text-foreground">{r.exam_id}</span>
                                <span className="mt-0.5 block truncate text-xs text-foreground/60">
                                  {fmtDay(r.created_at)} · {Math.round(r.percentage ?? 0)}%
                                </span>
                              </span>
                              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-foreground/35 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {all.length > PREVIEW && (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [skill]: !e[skill] }))}
                          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-bold text-foreground/70 transition active:scale-[0.99] hover:bg-foreground/5"
                        >
                          {expanded[skill] ? 'Kamroq ko‘rsatish' : `Yana ${all.length - PREVIEW} ta natija`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </section>

      {/* Videolar */}
      <section aria-labelledby="analysis-videos" className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h2 id="analysis-videos" className="text-xl font-black tracking-tight sm:text-3xl">Tahlil videolari</h2>
        </div>

        <div role="group" aria-label="Ko‘nikma bo‘yicha filtr" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {(['ALL', ...Object.keys(SKILLS)] as (Skill | 'ALL')[]).map((k) => {
            const on = filter === k
            const s = k === 'ALL' ? null : SKILLS[k]
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(k)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none ${
                  on ? 'bg-foreground text-white' : 'bg-white text-foreground/75 ring-1 ring-black/10 hover:bg-foreground/5'
                }`}
              >
                {k === 'ALL' ? 'Hammasi' : s!.label}
                <span
                  className="rounded-full px-2 py-0.5 text-xs tabular-nums"
                  style={on ? { background: LIME, color: '#111' } : { background: s?.tint ?? '#F1F1F1', color: s?.accent ?? '#555' }}
                >
                  {counts[k] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {videos.loading ? (
          <Loading rows={3} />
        ) : videos.error ? (
          <ErrorBox message={videos.error.message} onRetry={videos.reload} />
        ) : !visible.length ? (
          <div className="rounded-3xl border border-dashed border-foreground/20 bg-white p-8 text-center">
            <Empty text={filter === 'ALL' ? 'Hozircha tahlil videosi joylanmagan. Administrator video qo‘shganidan keyin shu yerda ko‘rinadi.' : 'Bu ko‘nikma bo‘yicha video yo‘q.'} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {visible.map((item) => {
              const s = SKILLS[item.skill]
              const Icon = s?.icon ?? Video
              const tint = s?.tint ?? '#F1F1F1'
              const accent = s?.accent ?? '#111'
              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-[28px]"
                >
                  <div className="relative isolate flex min-h-32 flex-col justify-between overflow-hidden p-5 sm:p-6" style={{ background: tint }}>
                    <Circle color={`${accent}14`} width={16} className="-left-10 -top-14 size-36" />
                    <CirclePlay
                      aria-hidden="true"
                      strokeWidth={1}
                      style={{ color: accent }}
                      className="pointer-events-none absolute -bottom-6 -right-4 z-0 size-32 opacity-[0.16] transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
                    />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: accent }}>
                        <Icon aria-hidden="true" className="size-6" strokeWidth={1.9} />
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold" style={{ color: accent }}>
                        {s?.label ?? item.skill}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                    <div>
                      <h3 className="line-clamp-2 text-xl font-black leading-snug tracking-tight">{item.title}</h3>
                      <p className="mt-2 inline-flex rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70">
                        Test {item.test_id}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/analysis/videos/${item.skill.toLowerCase()}/${encodeURIComponent(item.test_id)}`}
                      className={`${btn.primary} inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition active:scale-[0.98] motion-reduce:transition-none`}
                    >
                      <CirclePlay aria-hidden="true" className="size-4" /> Tahlilni ko‘rish
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}