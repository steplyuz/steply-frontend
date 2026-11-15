'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, RefreshCw, Search, X } from 'lucide-react'
import { adminApi } from '@/shared/api'
import type {
  AdminActivityPoint,
  AdminStatsSort,
  AdminStatsUserDetail,
  AdminStatsUserRow,
  AdminStatsUsersPage,
  AdminStatsOverview,
} from '@/shared/api/types'

export const dynamic = 'force-dynamic'

const PAGE_LIMIT = 50

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} soat ${m} daq`
  if (m > 0) return `${m} daq`
  return `${seconds} s`
}

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }) : '—'
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : 'Statistikani yuklab bo‘lmadi'
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ActivityChart({ points }: { points: AdminActivityPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.active_users))
  return (
    <div className="flex h-44 items-end gap-1">
      {points.map((p) => (
        <div key={p.date} className="group relative flex h-full flex-1 items-end">
          <div
            className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
            style={{ height: `${(p.active_users / max) * 100}%`, minHeight: p.active_users ? 4 : 0 }}
          />
          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
            {p.date.slice(5)} · {p.active_users} user · {fmtDuration(p.active_seconds)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SortHeader({
  label, field, sort, desc, onSort,
}: {
  label: string
  field: AdminStatsSort
  sort: AdminStatsSort
  desc: boolean
  onSort: (f: AdminStatsSort) => void
}) {
  const active = sort === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 whitespace-nowrap text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
    >
      {label}
      {active && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
    </button>
  )
}

export default function AdminStatisticsPage() {
  const [overview, setOverview] = useState<AdminStatsOverview | null>(null)
  const [activity, setActivity] = useState<AdminActivityPoint[]>([])
  const [usersPage, setUsersPage] = useState<AdminStatsUsersPage | null>(null)
  const [sort, setSort] = useState<AdminStatsSort>('total_tests')
  const [desc, setDesc] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminStatsUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const [ov, act] = await Promise.all([adminApi.statsOverview(), adminApi.statsActivity(30)])
      setOverview(ov)
      setActivity(act.points)
    } catch (e) {
      setError(errorText(e))
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setUsersPage(
        await adminApi.statsUsers({ sort, desc, search: query || undefined, offset, limit: PAGE_LIMIT }),
      )
    } catch (e) {
      setError(errorText(e))
    }
  }, [sort, desc, query, offset])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { loadUsers() }, [loadUsers])

  useEffect(() => {
    if (!selected) { setDetail(null); return }
    let cancelled = false
    adminApi.statsUserDetail(selected)
      .then((d) => { if (!cancelled) setDetail(d) })
      .catch((e) => { if (!cancelled) setError(errorText(e)) })
    return () => { cancelled = true }
  }, [selected])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([loadSummary(), loadUsers()])
    setLoading(false)
  }

  const onSort = (field: AdminStatsSort) => {
    if (field === sort) setDesc((d) => !d)
    else { setSort(field); setDesc(true) }
    setOffset(0)
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setOffset(0)
    setQuery(searchInput.trim())
  }

  const totalPages = usersPage ? Math.max(1, Math.ceil(usersPage.total / PAGE_LIMIT)) : 1
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1
  const skillTotals = overview?.tests_all_time

  return (
    <div className="container-shell mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistika</h1>
          <p className="mt-1 text-sm text-muted-foreground">Faol vaqt, yechilgan testlar va foydalanuvchilar faolligi</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Umumiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Bugun faol" value={overview?.active_today ?? '—'} sub={`Jami user: ${overview?.total_users ?? '—'}`} />
        <StatCard label="7 kun faol" value={overview?.active_7d ?? '—'} />
        <StatCard label="30 kun faol" value={overview?.active_30d ?? '—'} />
        <StatCard
          label="O‘rtacha vaqt (30 kun)"
          value={overview ? fmtDuration(overview.avg_time_per_active_user_30d_seconds) : '—'}
          sub="Faol userga to‘g‘ri keladi"
        />
        <StatCard
          label="Jami vaqt (30 kun)"
          value={overview ? fmtDuration(overview.time_30d_seconds) : '—'}
        />
        <StatCard
          label="Yechilgan testlar"
          value={skillTotals?.total ?? '—'}
          sub={`${overview?.test_takers_all_time ?? 0} ta user ishlagan`}
        />
      </div>

      {/* Skill bo'yicha */}
      {skillTotals && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reading" value={skillTotals.reading} sub={`30 kun: ${overview?.tests_30d.reading ?? 0}`} />
          <StatCard label="Listening" value={skillTotals.listening} sub={`30 kun: ${overview?.tests_30d.listening ?? 0}`} />
          <StatCard label="Writing" value={skillTotals.writing} sub={`30 kun: ${overview?.tests_30d.writing ?? 0}`} />
          <StatCard label="Speaking" value={skillTotals.speaking} sub={`30 kun: ${overview?.tests_30d.speaking ?? 0}`} />
        </div>
      )}

      {/* Kunlik faollik */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground">So‘nggi 30 kun: kunlik faol userlar</h2>
        <div className="mt-5">
          {activity.length ? <ActivityChart points={activity} /> : <div className="h-44 animate-pulse rounded-xl bg-muted" />}
        </div>
      </section>

      {/* Userlar jadvali */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Foydalanuvchilar</h2>
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ism yoki username"
                className="w-64 rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
              />
            </div>
            <button type="submit" className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted">
              Qidirish
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Foydalanuvchi</span></th>
                <th className="px-4 py-3"><SortHeader label="Reading" field="reading" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Listening" field="listening" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Writing" field="writing" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Speaking" field="speaking" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Jami test" field="total_tests" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Faol vaqt" field="active_seconds" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Oxirgi faollik" field="last_seen_at" sort={sort} desc={desc} onSort={onSort} /></th>
                <th className="px-4 py-3"><SortHeader label="Oxirgi kirish" field="last_login_at" sort={sort} desc={desc} onSort={onSort} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!usersPage && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Yuklanmoqda…</td></tr>
              )}
              {usersPage?.items.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Foydalanuvchi topilmadi</td></tr>
              )}
              {usersPage?.items.map((u: AdminStatsUserRow) => (
                <tr
                  key={u.id}
                  className={`cursor-pointer transition hover:bg-muted/40 ${selected === u.id ? 'bg-primary/5' : ''}`}
                  onClick={() => setSelected(u.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{u.username ? `@${u.username}` : u.role}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u.reading}</td>
                  <td className="px-4 py-3 tabular-nums">{u.listening}</td>
                  <td className="px-4 py-3 tabular-nums">{u.writing}</td>
                  <td className="px-4 py-3 tabular-nums">{u.speaking}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{u.total_tests}</td>
                  <td className="px-4 py-3 tabular-nums">{fmtDuration(u.active_seconds)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.last_seen_at)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.last_login_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Jami: {usersPage?.total ?? 0}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_LIMIT))}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="tabular-nums text-muted-foreground">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setOffset(offset + PAGE_LIMIT)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        </div>
      </section>

      {/* Tanlangan user tafsiloti */}
      {selected && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">{detail?.full_name ?? 'Yuklanmoqda…'}</h2>
              {detail && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Jami faol vaqt: {fmtDuration(detail.active_seconds_all_time)} · Oxirgi kirish: {fmtDate(detail.last_login_at)}
                </p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Yopish">
              <X className="size-4" />
            </button>
          </div>

          {detail && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(['reading', 'listening', 'writing', 'speaking', 'total'] as const).map((k) => (
                  <div key={k} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k === 'total' ? 'Jami' : k}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">{detail.tests[k]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Sana</th>
                      <th className="px-4 py-2">Faol vaqt</th>
                      <th className="px-4 py-2">Heartbeat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...detail.daily].reverse().map((d) => (
                      <tr key={d.date}>
                        <td className="px-4 py-2">{d.date}</td>
                        <td className="px-4 py-2 tabular-nums">{fmtDuration(d.active_seconds)}</td>
                        <td className="px-4 py-2 tabular-nums">{d.heartbeats}</td>
                      </tr>
                    ))}
                    {detail.daily.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">So‘nggi 30 kunda faollik yo‘q</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
