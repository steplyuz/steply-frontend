'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Search } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { adminCreditsApi, billingApi, getErrorMessage } from '@/shared/api'
import type { AiCreditPlanAdjustResult, AiCreditUserDetail, BillingPlan } from '@/shared/api/types'
import { formatDateTime } from '@/shared/lib/notification-labels'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'
const hintCls = 'mt-1 text-[11px] text-muted-foreground'

/** Musbat son — qo'shish, manfiy — ayirish. Butun son bo'lishi shart. */
function parseDelta(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n !== 0 ? n : null
}

function PlanSection() {
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [planId, setPlanId] = useState('')
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AiCreditPlanAdjustResult | null>(null)

  useEffect(() => {
    billingApi.adminPlans().then(setPlans).catch((e) => setError(getErrorMessage(e)))
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    const plan = plans.find((p) => String(p.id) === planId)
    const n = parseDelta(delta)
    if (!plan) return setError('Tarifni tanlang')
    if (n === null) return setError('Son kiriting (0 dan farqli butun son). Manfiy son ayiradi.')
    if (note.trim().length < 3) return setError('Izoh kamida 3 belgi bo‘lishi kerak')
    const verb = n > 0 ? `+${n} kredit qo‘shiladi` : `${-n} kredit ayiriladi (balansi yetmaganlardan qolgani olinadi)`
    if (!window.confirm(`“${plan.name}” tarifining faol obunachilariga: ${verb}. Davom etasizmi?`)) return
    setBusy(true)
    try {
      setResult(await adminCreditsApi.adjustPlan(plan.id, { delta: n, note: note.trim() }))
      setDelta('')
      setNote('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminSection title="Tarif bo‘yicha" description="Tarifdagi hozirgi faol obunachilarga kredit qo‘shadi yoki ayiradi. Tarifning oylik limitini tariflar sahifasidan o‘zgartiring.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className={labelCls}>Tarif</span>
          <select className={adminInput} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">— tanlang —</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={labelCls}>Kredit soni</span>
            <input className={adminInput} type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="masalan: 50 yoki -20" />
            <p className={hintCls}>Musbat — qo‘shish, manfiy — ayirish.</p>
          </div>
          <div>
            <span className={labelCls}>Izoh</span>
            <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Sabab (audit uchun)" />
          </div>
        </div>
        <button type="submit" disabled={busy} className={adminButtonPrimary}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Bajarish
        </button>
      </form>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {result && (
        <AdminAlert tone="success" className="mt-4">
          {result.plan_name}: obunachilar {result.subscribers}, o‘zgargan {result.affected_users}, o‘tkazib yuborilgan {result.skipped_users}.
          {' '}Jami o‘zgarish: {result.credits_changed_total > 0 ? '+' : ''}{result.credits_changed_total}.
        </AdminAlert>
      )}
    </AdminSection>
  )
}

function UserSection() {
  const [userId, setUserId] = useState('')
  const [detail, setDetail] = useState<AiCreditUserDetail | null>(null)
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async (id: string) => {
    const clean = id.trim()
    if (!UUID_RE.test(clean)) return setError('To‘g‘ri user ID kiriting (UUID)')
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setDetail(await adminCreditsApi.userDetail(clean))
    } catch (e) {
      setDetail(null)
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail) return
    setError(null)
    setNotice(null)
    const n = parseDelta(delta)
    if (n === null) return setError('Son kiriting (0 dan farqli butun son)')
    if (note.trim().length < 3) return setError('Izoh kamida 3 belgi bo‘lishi kerak')
    if (n < 0 && -n > detail.balance) return setError(`Balans yetarli emas (mavjud: ${detail.balance})`)
    setBusy(true)
    try {
      const r = await adminCreditsApi.adjustUser(detail.user_id, { delta: n, note: note.trim() })
      setNotice(`Bajarildi. Yangi balans: ${r.balance}`)
      setDelta('')
      setNote('')
      await load(detail.user_id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminSection title="Foydalanuvchi bo‘yicha" description="Bitta foydalanuvchining AI kreditlarini ko‘ring, qo‘shing yoki ayiring.">
      <div className="flex gap-2">
        <input
          className={adminInput}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID (UUID)"
          aria-label="User ID"
        />
        <button type="button" onClick={() => void load(userId)} disabled={busy} className={adminButtonSecondary}>
          <Search className="size-3.5" aria-hidden="true" /> Yuklash
        </button>
      </div>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {notice && <AdminAlert tone="success" className="mt-4">{notice}</AdminAlert>}

      {detail && (
        <div className="mt-5 space-y-5">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Joriy balans</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{detail.balance}</p>
          </div>

          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
            <div>
              <span className={labelCls}>Kredit soni</span>
              <input className={adminInput} type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+10 yoki -5" />
            </div>
            <div>
              <span className={labelCls}>Izoh</span>
              <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Sabab (audit uchun)" />
            </div>
            <button type="submit" disabled={busy} className={adminButtonPrimary}>Bajarish</button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Yaratilgan</th>
                  <th className="py-2 pr-4">Jami</th>
                  <th className="py-2 pr-4">Qolgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {detail.grants.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Kreditlar yo‘q</td></tr>
                )}
                {detail.grants.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{formatDateTime(g.created_at)}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{g.credits_total}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{g.credits_remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminSection>
  )
}

/** Obunasi yo'q (FREE) foydalanuvchilar uchun oylik AI kredit limiti. */
function FreeSection() {
  const [value, setValue] = useState('')
  const [current, setCurrent] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminCreditsApi.freeLimit()
      .then((r) => { setCurrent(r.monthly_limit); setValue(String(r.monthly_limit)) })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    const n = Number(value)
    if (!Number.isInteger(n) || n < 0) return setError('0 yoki undan katta butun son kiriting')
    setBusy(true)
    try {
      const r = await adminCreditsApi.setFreeLimit(n)
      setCurrent(r.monthly_limit)
      setNotice(`Saqlandi: obunasiz foydalanuvchilar uchun oyiga ${r.monthly_limit} AI kredit`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminSection
      title="Free (obunasiz) foydalanuvchilar"
      description="Obunasi yo‘q foydalanuvchilar har oy shu miqdorda AI kredit oladi (Writing va Speaking). 0 bo‘lsa AI yo‘q. Obunachilarda tarif limiti ishlaydi."
    >
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <div>
          <span className={labelCls}>Oylik AI kredit</span>
          <input
            className={`${adminInput} w-40`}
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className={adminButtonPrimary}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Saqlash
        </button>
        {current !== null && <p className="text-xs text-muted-foreground">Hozirgi qiymat: {current}</p>}
      </form>
      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {notice && <AdminAlert tone="success" className="mt-4">{notice}</AdminAlert>}
    </AdminSection>
  )
}

export default function AdminCreditsPage() {
  return (
    <AdminPageShell
      eyebrow="Moliya"
      title="AI kreditlar"
      description="Tarif obunachilariga yoki bitta foydalanuvchiga AI kreditlarni qo‘shing yoki ayiring. Har bir o‘zgarish audit uchun saqlanadi."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanSection />
        <UserSection />
      </div>

      <FreeSection />
    </AdminPageShell>
  )
}
