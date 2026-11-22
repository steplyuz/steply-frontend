'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonDanger, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type {
  NotificationCategory, NotificationChannel, NotificationMessage, NotificationMessageFilters,
  NotificationMessageStatus,
} from '@/shared/api/types'
import {
  CATEGORY_LABEL, CHANNEL_LABEL, CHANNEL_ORDER, STATUS_LABEL, formatDateTime,
} from '@/shared/lib/notification-labels'

const PAGE = 50

const STATUS_TONE: Record<NotificationMessageStatus, 'info' | 'success' | 'error' | 'warning'> = {
  queued: 'info',
  sent: 'success',
  failed: 'error',
  cancelled: 'warning',
}

/** Yuborilgan va navbatdagi xabarlar: filtr, qayta urinish, bekor qilish. */
export default function NotificationMessagesPage() {
  const [channel, setChannel] = useState<NotificationChannel | ''>('')
  const [status, setStatus] = useState<NotificationMessageStatus | ''>('')
  const [category, setCategory] = useState<NotificationCategory | ''>('')
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState<NotificationMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const filters: NotificationMessageFilters = {
      channel: channel || undefined,
      status: status || undefined,
      category: category || undefined,
      offset,
      limit: PAGE,
    }
    try {
      const page = await adminNotificationsApi.messages(filters)
      setItems(page.items)
      setTotal(page.total)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [channel, status, category, offset])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (id: number, action: () => Promise<unknown>, done: string) => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      await action()
      setNotice(done)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const processNow = async () => {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const r = await adminNotificationsApi.process(50)
      setNotice(`Ishlandi: ${r.picked} ta. Yuborildi: ${r.sent}, xato: ${r.failed}, qayta urinish: ${r.retry}.`)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
      setLoading(false)
    }
  }

  const resetOffset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setOffset(0)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE))
  const currentPage = Math.floor(offset / PAGE) + 1

  return (
    <AdminPageShell
      eyebrow="Xabarnomalar"
      title="Xabarlar navbati"
      description="Yuborilgan va navbatdagi xabarlar. Xato bo‘lganlarni qayta yuborish yoki navbatdagilarni bekor qilish mumkin."
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} className={adminButtonSecondary}>
            <RefreshCw className="size-3.5" aria-hidden="true" /> Yangilash
          </button>
          <button type="button" onClick={processNow} disabled={loading} className={adminButtonSecondary}>
            Navbatni yuborish
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <select className={adminInput} value={channel} onChange={(e) => resetOffset(setChannel)(e.target.value as NotificationChannel | '')} aria-label="Kanal">
            <option value="">Barcha kanallar</option>
            {CHANNEL_ORDER.map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
          </select>
          <select className={adminInput} value={status} onChange={(e) => resetOffset(setStatus)(e.target.value as NotificationMessageStatus | '')} aria-label="Holat">
            <option value="">Barcha holatlar</option>
            {(Object.keys(STATUS_LABEL) as NotificationMessageStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select className={adminInput} value={category} onChange={(e) => resetOffset(setCategory)(e.target.value as NotificationCategory | '')} aria-label="Turi">
            <option value="">Barcha turlar</option>
            {(Object.keys(CATEGORY_LABEL) as NotificationCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>

        {error && <AdminAlert>{error}</AdminAlert>}
        {notice && <AdminAlert tone="success">{notice}</AdminAlert>}

        <AdminSection>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Vaqt</th>
                  <th className="py-2 pr-4">Kanal</th>
                  <th className="py-2 pr-4">Qabul qiluvchi</th>
                  <th className="py-2 pr-4">Xabar</th>
                  <th className="py-2 pr-4">Holat</th>
                  <th className="py-2 pr-4">Urinish</th>
                  <th className="py-2 pr-4">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border align-top">
                {loading && items.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" aria-hidden="true" /></td></tr>
                )}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Xabar topilmadi</td></tr>
                )}
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">{m.id}</td>
                    <td className="py-3 pr-4 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(m.created_at)}</td>
                    <td className="py-3 pr-4">
                      <AdminBadge tone="info">{CHANNEL_LABEL[m.channel]}</AdminBadge>
                      {m.category === 'marketing' && <div className="mt-1"><AdminBadge tone="warning">Reklama</AdminBadge></div>}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {m.recipient.length > 26 ? `${m.recipient.slice(0, 24)}…` : m.recipient}
                    </td>
                    <td className="max-w-xs py-3 pr-4">
                      {m.subject && <p className="truncate font-medium text-foreground">{m.subject}</p>}
                      <p className="line-clamp-2 text-xs text-muted-foreground">{m.body}</p>
                      {m.last_error && <p className="mt-1 line-clamp-2 text-xs text-error" title={m.last_error}>{m.last_error}</p>}
                    </td>
                    <td className="py-3 pr-4"><AdminBadge tone={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</AdminBadge></td>
                    <td className="py-3 pr-4 tabular-nums text-xs text-muted-foreground">{m.attempts}/{m.max_attempts}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1.5">
                        {(m.status === 'failed' || m.status === 'cancelled') && (
                          <button
                            type="button"
                            disabled={busyId === m.id}
                            onClick={() => act(m.id, () => adminNotificationsApi.retryMessage(m.id), 'Qayta navbatga qo‘yildi')}
                            className={adminButtonSecondary}
                          >
                            Qayta yuborish
                          </button>
                        )}
                        {m.status === 'queued' && (
                          <button
                            type="button"
                            disabled={busyId === m.id}
                            onClick={() => {
                              if (window.confirm('Bu xabar bekor qilinsinmi?')) {
                                void act(m.id, () => adminNotificationsApi.cancelMessage(m.id), 'Xabar bekor qilindi')
                              }
                            }}
                            className={adminButtonDanger}
                          >
                            Bekor qilish
                          </button>
                        )}
                      </div>
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
