'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminSection, AdminStatCard } from '@/features/admin/components/ui'
import { adminButtonSecondary } from '@/features/admin/components/ui/styles'
import { SendForm } from '@/features/admin/components/notifications/send-form'
import { BroadcastForm } from '@/features/admin/components/notifications/broadcast-form'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type { NotificationMessageStatus, NotificationProcessResult, NotificationStats } from '@/shared/api/types'
import { CHANNEL_LABEL, CHANNEL_ORDER } from '@/shared/lib/notification-labels'

export default function AdminNotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    try {
      setStats(await adminNotificationsApi.stats())
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const total = (status: NotificationMessageStatus) =>
    Object.values(stats ?? {}).reduce((sum, row) => sum + (row?.[status] ?? 0), 0)

  const processNow = async () => {
    setProcessing(true)
    setNotice(null)
    try {
      const r: NotificationProcessResult = await adminNotificationsApi.process(50)
      setNotice(`Ishlandi: ${r.picked} ta. Yuborildi: ${r.sent}, xato: ${r.failed}, qayta urinish: ${r.retry}.`)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <AdminPageShell
      eyebrow="Xabarnomalar"
      title="Yuborish va holat"
      description="SMS, Telegram, email va ilova ichidagi xabarlarni yuboring hamda navbat holatini kuzating"
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} className={adminButtonSecondary}>
            <RefreshCw className="size-3.5" aria-hidden="true" /> Yangilash
          </button>
          <button type="button" onClick={processNow} disabled={processing} className={adminButtonSecondary}>
            {processing && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />} Navbatni yuborish
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <AdminAlert>{error}</AdminAlert>}
        {notice && <AdminAlert tone="success">{notice}</AdminAlert>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AdminStatCard label="Navbatda" value={total('queued')} />
          <AdminStatCard label="Yuborilgan" value={total('sent')} />
          <AdminStatCard label="Xato" value={total('failed')} />
          <AdminStatCard label="Bekor qilingan" value={total('cancelled')} />
        </div>

        <AdminSection
          title="Kanal bo‘yicha"
          description={<>Batafsil ro‘yxat: <Link href="/admin/notifications/messages" className="underline">Xabarlar navbati</Link></>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Kanal</th>
                  <th className="py-2 pr-4">Navbatda</th>
                  <th className="py-2 pr-4">Yuborilgan</th>
                  <th className="py-2 pr-4">Xato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CHANNEL_ORDER.map((c) => (
                  <tr key={c}>
                    <td className="py-2.5 pr-4 font-medium">{CHANNEL_LABEL[c]}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{stats?.[c]?.queued ?? 0}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{stats?.[c]?.sent ?? 0}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{stats?.[c]?.failed ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>

        <SendForm onSent={load} />

        <BroadcastForm onSent={load} />
      </div>
    </AdminPageShell>
  )
}
