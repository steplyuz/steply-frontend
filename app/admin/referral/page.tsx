'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { adminReferralApi, billingApi } from '@/shared/api'
import type { AdminReferralList, BillingPlan, ReferralSettings, ReferralStats, ReferralStatus } from '@/shared/api/types'

export const dynamic = 'force-dynamic'

const PAGE = 50
const card = 'rounded-2xl border border-border bg-card p-5 shadow-xs'
const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40'
const STATUS_LABEL: Record<ReferralStatus, string> = { pending: 'Kutilmoqda', qualified: 'Mukofot berilgan', capped: 'Limitga yetgan' }

type Form = {
  enabled: boolean
  reward_credits: string
  credit_expiry_days: string
  reward_plan_id: string
  reward_tier_days: string
  max_rewards_per_user: string
}

const toForm = (s: ReferralSettings): Form => ({
  enabled: s.enabled,
  reward_credits: String(s.reward_credits),
  credit_expiry_days: s.credit_expiry_days == null ? '' : String(s.credit_expiry_days),
  reward_plan_id: s.reward_plan_id == null ? '' : String(s.reward_plan_id),
  reward_tier_days: String(s.reward_tier_days),
  max_rewards_per_user: s.max_rewards_per_user == null ? '' : String(s.max_rewards_per_user),
})

const toPayload = (f: Form): ReferralSettings => ({
  enabled: f.enabled,
  reward_credits: Number(f.reward_credits) || 0,
  credit_expiry_days: f.credit_expiry_days.trim() ? Number(f.credit_expiry_days) : null,
  reward_plan_id: f.reward_plan_id ? Number(f.reward_plan_id) : null,
  reward_tier_days: Number(f.reward_tier_days) || 0,
  max_rewards_per_user: f.max_rewards_per_user.trim() ? Number(f.max_rewards_per_user) : null,
})

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Xatolik yuz berdi')

export default function AdminReferralPage() {
  const [form, setForm] = useState<Form | null>(null)
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [list, setList] = useState<AdminReferralList | null>(null)
  const [filter, setFilter] = useState<ReferralStatus | ''>('')
  const [offset, setOffset] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  const flash = (tone: 'ok' | 'err', text: string) => {
    setMessage({ tone, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadSummary = useCallback(async () => {
    try {
      const [s, st, p] = await Promise.all([adminReferralApi.settings(), adminReferralApi.stats(), billingApi.adminPlans()])
      setForm(toForm(s))
      setStats(st)
      setPlans(p)
    } catch (e) {
      flash('err', errText(e))
    }
  }, [])

  const loadList = useCallback(async () => {
    try {
      setList(await adminReferralApi.referrals({ status: filter || undefined, offset, limit: PAGE }))
    } catch (e) {
      flash('err', errText(e))
    }
  }, [filter, offset])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { loadList() }, [loadList])

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      setForm(toForm(await adminReferralApi.updateSettings(toPayload(form))))
      flash('ok', 'Sozlamalar saqlandi')
      loadSummary()
    } catch (e) {
      flash('err', errText(e))
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))
  const totalPages = list ? Math.max(1, Math.ceil(list.total / PAGE)) : 1
  const currentPage = Math.floor(offset / PAGE) + 1

  return (
    <div className="container-shell mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Referal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mukofotlar, limitlar va taklif qilingan foydalanuvchilar</p>
        </div>
        <button
          onClick={() => { loadSummary(); loadList() }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <RefreshCw className="size-3.5" /> Yangilash
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.tone === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-error/30 bg-error/10 text-error'}`}>
          {message.text}
        </div>
      )}

      {/* Sozlamalar */}
      <section className={card}>
        <h2 className="text-base font-semibold text-foreground">Mukofot sozlamalari</h2>
        {!form ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-3 text-sm font-semibold text-foreground sm:col-span-2 lg:col-span-3">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} className="size-4" />
              Referal dasturi yoqilgan
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Bonus test kreditlari (har bir do‘st uchun)</span>
              <input className={field} type="number" min={0} max={1000} value={form.reward_credits} onChange={(e) => set('reward_credits', e.target.value)} />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Kredit muddati (kun, bo‘sh = muddatsiz)</span>
              <input className={field} type="number" min={1} value={form.credit_expiry_days} onChange={(e) => set('credit_expiry_days', e.target.value)} />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Maksimal mukofot (bir userga, bo‘sh = cheksiz)</span>
              <input className={field} type="number" min={1} value={form.max_rewards_per_user} onChange={(e) => set('max_rewards_per_user', e.target.value)} />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Tarif mukofoti: plan</span>
              <select className={field} value={form.reward_plan_id} onChange={(e) => set('reward_plan_id', e.target.value)}>
                <option value="">— tanlanmagan —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Tarif mukofoti: necha kun (0 = yo‘q)</span>
              <input className={field} type="number" min={0} max={3650} value={form.reward_tier_days} onChange={(e) => set('reward_tier_days', e.target.value)} />
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
              >
                <Save className="size-3.5" /> {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ['Mukofot berilgan', stats?.by_status.qualified ?? 0],
          ['Kutilmoqda', stats?.by_status.pending ?? 0],
          ['Limitga yetgan', stats?.by_status.capped ?? 0],
          ['Berilgan kreditlar', stats?.credits_granted ?? 0],
          ['Qolgan kreditlar', stats?.credits_remaining ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className={card}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Ro'yxat */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['', 'pending', 'qualified', 'capped'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setFilter(s); setOffset(0) }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filter === s ? 'bg-foreground text-background' : 'border border-border bg-card text-foreground hover:bg-muted'}`}
            >
              {s ? STATUS_LABEL[s] : 'Barchasi'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Taklif qilgan</th>
                <th className="px-4 py-3">Taklif qilingan</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Yaratilgan</th>
                <th className="px-4 py-3">Mukofot berilgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!list && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Yuklanmoqda…</td></tr>}
              {list?.items.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Takliflar yo‘q</td></tr>}
              {list?.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.referrer.name ?? <span className="font-mono text-xs">{r.referrer.id.slice(0, 8)}</span>}</td>
                  <td className="px-4 py-3">{r.referred.name ?? <span className="font-mono text-xs">{r.referred.id.slice(0, 8)}</span>}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[r.status]}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('uz-UZ')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.qualified_at ? new Date(r.qualified_at).toLocaleString('uz-UZ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Jami: {list?.total ?? 0}</span>
          <div className="flex items-center gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Oldingi</button>
            <span className="tabular-nums text-muted-foreground">{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setOffset(offset + PAGE)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Keyingi</button>
          </div>
        </div>
      </section>
    </div>
  )
}
