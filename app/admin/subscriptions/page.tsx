'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { adminSubscriptionsApi, billingApi, getErrorMessage } from '@/shared/api'
import type { AdminSubscriptionItem, AdminSubscriptionStatus, BillingPlan } from '@/shared/api/types'
import { formatDateTime } from '@/shared/lib/notification-labels'

const PAGE = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'

const STATUS_OPTIONS: { value: AdminSubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Faol' },
  { value: 'expired', label: 'Muddati tugagan' },
  { value: 'all', label: 'Barchasi' },
]

/** ISO sanani datetime-local input qiymatiga (mahalliy vaqt) o'giradi. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const isLive = (s: AdminSubscriptionItem) => s.is_active && new Date(s.end_date) > new Date()

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState<AdminSubscriptionStatus>('active')
  const [planId, setPlanId] = useState('')
  const [userInput, setUserInput] = useState('')
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined)
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState<AdminSubscriptionItem[]>([])
  const [total, setTotal] = useState(0)
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [selected, setSelected] = useState<AdminSubscriptionItem | null>(null)
  const [note, setNote] = useState('')
  const [days, setDays] = useState('30')
  const [newPlanId, setNewPlanId] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    billingApi.adminPlans().then(setPlans).catch(() => setPlans([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await adminSubscriptionsApi.list({
        status,
        plan_id: planId ? Number(planId) : undefined,
        user_id: userFilter,
        offset,
        limit: PAGE,
      })
      setItems(page.items)
      setTotal(page.total)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [status, planId, userFilter, offset])

  useEffect(() => {
    void load()
  }, [load])

  const select = (s: AdminSubscriptionItem) => {
    setSelected(s)
    setNewPlanId(String(s.plan_id))
    setEndLocal(toLocalInput(s.end_date))
    setNote('')
    setError(null)
    setNotice(null)
  }

  /** Har bir amal: izoh tekshiruvi -> API -> ro'yxatni yangilash. */
  const run = async (action: () => Promise<AdminSubscriptionItem>, done: string) => {
    if (!selected) return
    if (note.trim().length < 3) {
      setError('Izoh kamida 3 belgi bo‘lishi kerak')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await action()
      setSelected(updated)
      setNotice(done)
      setNote('')
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const applyUser = () => {
    const clean = userInput.trim()
    if (clean && !UUID_RE.test(clean)) {
      setError('To‘g‘ri user ID kiriting (UUID)')
      return
    }
    setError(null)
    setUserFilter(clean || undefined)
    setOffset(0)
  }

  const extend = () => {
    if (!selected) return
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1) {
      setError('Kunlar soni kamida 1 bo‘lsin')
      return
    }
    void run(() => adminSubscriptionsApi.extend(selected.id, { days: n, note: note.trim() }), `+${n} kun qo‘shildi`)
  }

  const changePlan = () => {
    if (!selected) return
    if (!newPlanId || Number(newPlanId) === selected.plan_id) {
      setError('Yangi tarifni tanlang')
      return
    }
    void run(
      () => adminSubscriptionsApi.update(selected.id, { plan_id: Number(newPlanId), note: note.trim() }),
      'Tarif o‘zgartirildi',
    )
  }

  const setEnd = () => {
    if (!selected) return
    if (!endLocal) {
      setError('Sanani tanlang')
      return
    }
    void run(
      () => adminSubscriptionsApi.update(selected.id, { end_date: new Date(endLocal).toISOString(), note: note.trim() }),
      'Muddat o‘rnatildi',
    )
  }

  const toggle = () => {
    if (!selected) return
    const next = !selected.is_active
    void run(
      () => adminSubscriptionsApi.update(selected.id, { is_active: next, note: note.trim() }),
      next ? 'Obuna faollashtirildi' : 'Obuna o‘chirildi',
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE))
  const currentPage = Math.floor(offset / PAGE) + 1

  return (
    <AdminPageShell
      eyebrow="Moliya"
      title="Obuna boshqaruvi"
      description="Foydalanuvchi obunalarini ko‘ring: muddatni uzaytiring, tarifni o‘zgartiring yoki obunani o‘chiring. Har bir o‘zgarish izoh bilan saqlanadi."
      actions={
        <button type="button" onClick={() => void load()} className={adminButtonSecondary}>
          <RefreshCw className="size-3.5" aria-hidden="true" /> Yangilash
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { setStatus(o.value); setOffset(0) }}
              aria-pressed={status === o.value}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                status === o.value ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
          <select
            className={`${adminInput} w-auto`}
            value={planId}
            onChange={(e) => { setPlanId(e.target.value); setOffset(0) }}
            aria-label="Tarif bo‘yicha filtr"
          >
            <option value="">Barcha tariflar</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              className={`${adminInput} w-64`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="User ID (UUID)"
              aria-label="User ID bo‘yicha qidirish"
            />
            <button type="button" onClick={applyUser} className={adminButtonSecondary}>Qidirish</button>
            {userFilter && (
              <button type="button" onClick={() => { setUserInput(''); setUserFilter(undefined); setOffset(0) }} className={adminButtonSecondary}>
                Tozalash
              </button>
            )}
          </div>
        </div>

        {error && <AdminAlert>{error}</AdminAlert>}
        {notice && <AdminAlert tone="success">{notice}</AdminAlert>}

        {selected && (
          <AdminSection
            title={`Obuna #${selected.id}: ${selected.full_name ?? selected.user_id.slice(0, 8)}`}
            description={`Joriy tarif: ${selected.plan_name}. Tugaydi: ${formatDateTime(selected.end_date)}`}
          >
            <div className="space-y-5">
              <div>
                <span className={labelCls}>Izoh (majburiy, audit uchun)</span>
                <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Sabab" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className={labelCls}>Muddatni uzaytirish (kun)</span>
                  <div className="flex gap-2">
                    <input className={adminInput} type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} />
                    <button type="button" onClick={extend} disabled={busy} className={adminButtonPrimary}>Uzaytirish</button>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className={labelCls}>Tarifni o‘zgartirish</span>
                  <div className="flex gap-2">
                    <select className={adminInput} value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="button" onClick={changePlan} disabled={busy} className={adminButtonPrimary}>Saqlash</button>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className={labelCls}>Tugash sanasini o‘rnatish</span>
                  <div className="flex gap-2">
                    <input className={adminInput} type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
                    <button type="button" onClick={setEnd} disabled={busy} className={adminButtonPrimary}>Saqlash</button>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className={labelCls}>Holat</span>
                  <button type="button" onClick={toggle} disabled={busy} className={adminButtonSecondary}>
                    {selected.is_active ? 'Obunani o‘chirish' : 'Obunani faollashtirish'}
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => setSelected(null)} className={adminButtonSecondary}>Yopish</button>
            </div>
          </AdminSection>
        )}

        <AdminSection>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Foydalanuvchi</th>
                  <th className="py-2 pr-4">Tarif</th>
                  <th className="py-2 pr-4">Boshlangan</th>
                  <th className="py-2 pr-4">Tugaydi</th>
                  <th className="py-2 pr-4">Qolgan kun</th>
                  <th className="py-2 pr-4">Holat</th>
                  <th className="py-2 pr-4">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && items.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Yuklanmoqda…</td></tr>
                )}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Obuna topilmadi</td></tr>
                )}
                {items.map((s) => (
                  <tr key={s.id} className={selected?.id === s.id ? 'bg-muted/60' : ''}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{s.full_name ?? '—'}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{s.user_id.slice(0, 8)}…</p>
                    </td>
                    <td className="py-3 pr-4">{s.plan_name}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted-foreground">{formatDateTime(s.start_date)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted-foreground">{formatDateTime(s.end_date)}</td>
                    <td className="py-3 pr-4 tabular-nums">{isLive(s) ? s.days_left : 0}</td>
                    <td className="py-3 pr-4">
                      {isLive(s) ? <AdminBadge tone="success">Faol</AdminBadge>
                        : s.is_active ? <AdminBadge tone="error">Muddati tugagan</AdminBadge>
                        : <AdminBadge tone="warning">O‘chirilgan</AdminBadge>}
                    </td>
                    <td className="py-3 pr-4">
                      <button type="button" onClick={() => select(s)} className={adminButtonSecondary}>Boshqarish</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Jami: {total}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className={adminButtonSecondary}>Oldingi</button>
              <span className="tabular-nums text-muted-foreground">{currentPage} / {totalPages}</span>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setOffset(offset + PAGE)} className={adminButtonSecondary}>Keyingi</button>
            </div>
          </div>
        </AdminSection>
      </div>
    </AdminPageShell>
  )
}
