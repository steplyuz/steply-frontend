'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Search } from 'lucide-react'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { adminReferralApi, getErrorMessage } from '@/shared/api'
import type { AdminReferralUserDetail, ReferralStatus } from '@/shared/api/types'
import { formatDateTime } from '@/shared/lib/notification-labels'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'
const STATUS_TEXT: Record<ReferralStatus, string> = {
  pending: 'Kutilmoqda',
  qualified: 'Mukofot berilgan',
  capped: 'Limitga yetgan',
  voided: 'Bekor qilingan',
}

/** Bitta foydalanuvchi bo'yicha referal: kod, taklif qilganlar, kreditlar; kredit qo'shish/ayirish; kodni yangilash. */
export function ReferralUserPanel() {
  const [userId, setUserId] = useState('')
  const [detail, setDetail] = useState<AdminReferralUserDetail | null>(null)
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
      setDetail(await adminReferralApi.userDetail(clean))
    } catch (e) {
      setDetail(null)
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const adjust = async (e: FormEvent) => {
    e.preventDefault()
    if (!detail) return
    setError(null)
    setNotice(null)
    const n = Number(delta)
    if (!Number.isInteger(n) || n === 0) return setError('Son kiriting (0 dan farqli butun son). Manfiy son ayiradi.')
    if (note.trim().length < 3) return setError('Izoh kamida 3 belgi bo‘lishi kerak')
    const verb = n > 0 ? `+${n} bonus kredit qo‘shiladi` : `${-n} bonus kredit ayiriladi`
    if (!window.confirm(`${verb}. Davom etasizmi?`)) return
    setBusy(true)
    try {
      await adminReferralApi.adjustCredits(detail.user_id, { delta: n, note: note.trim() })
      setNotice('Kreditlar yangilandi')
      setDelta('')
      setNote('')
      await load(detail.user_id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const resetCode = async () => {
    if (!detail) return
    if (!window.confirm('Eski referal kod ishlamay qoladi va yangi kod beriladi. Davom etasizmi?')) return
    setBusy(true)
    setError(null)
    try {
      const r = await adminReferralApi.resetCode(detail.user_id)
      setNotice(`Yangi referal kod: ${r.code}`)
      await load(detail.user_id)
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AdminSection title="Foydalanuvchi bo‘yicha" description="User ID bo‘yicha referal kodi, taklif qilganlari va kreditlarini ko‘ring hamda boshqaring.">
      <div className="flex gap-2">
        <input className={adminInput} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID (UUID)" aria-label="User ID" />
        <button type="button" onClick={() => void load(userId)} disabled={busy} className={adminButtonSecondary}>
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Search className="size-3.5" aria-hidden="true" />} Qidirish
        </button>
      </div>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {notice && <AdminAlert tone="success" className="mt-4">{notice}</AdminAlert>}

      {detail && (
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Kod', detail.summary.code],
              ['Taklif qilgan', detail.summary.invited],
              ['Kutilmoqda', detail.summary.pending],
              ['Mukofot berilgan', detail.summary.qualified],
              ['Limitga yetgan', detail.summary.capped],
              ['Mavjud kredit', detail.summary.credits_available],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {detail.referred_by && (
            <p className="text-sm text-muted-foreground">
              Bu foydalanuvchi referal orqali kelgan: taklif qiluvchi <span className="font-mono text-xs">{detail.referred_by.referrer_id.slice(0, 8)}</span>,
              holat: <AdminBadge tone="info">{STATUS_TEXT[detail.referred_by.status]}</AdminBadge>
            </p>
          )}

          <form onSubmit={adjust} className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
            <div>
              <span className={labelCls}>Bonus kredit</span>
              <input className={adminInput} type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+5 yoki -2" />
            </div>
            <div>
              <span className={labelCls}>Izoh</span>
              <input className={adminInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Sabab (audit uchun)" />
            </div>
            <button type="submit" disabled={busy} className={adminButtonPrimary}>Bajarish</button>
          </form>

          <div>
            <button type="button" onClick={resetCode} disabled={busy} className={adminButtonSecondary}>Referal kodni yangilash</button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Taklif qilganlari ({detail.referrals.length})</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                  <thead className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Taklif qilingan</th>
                      <th className="py-2 pr-3">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.referrals.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Yo‘q</td></tr>}
                    {detail.referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 tabular-nums">{r.id}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{r.referred_id.slice(0, 8)}</td>
                        <td className="py-2 pr-3 text-xs">{STATUS_TEXT[r.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Kreditlar ({detail.credits.length})</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Yaratilgan</th>
                      <th className="py-2 pr-3">Jami / qolgan</th>
                      <th className="py-2 pr-3">Sabab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.credits.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Yo‘q</td></tr>}
                    {detail.credits.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDateTime(c.created_at)}</td>
                        <td className="py-2 pr-3 tabular-nums">{c.amount_total} / {c.amount_remaining}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{c.reason ?? (c.referral_id ? `Referal #${c.referral_id}` : '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminSection>
  )
}
