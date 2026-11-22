'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminSection } from '@/features/admin/components/ui'
import { adminInput } from '@/features/admin/components/ui/styles'
import { EmailAccountsPanel } from '@/features/admin/components/notifications/email-accounts-panel'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type { NotificationChannel, NotificationEvent, NotificationRule, NotificationTemplate } from '@/shared/api/types'
import { CHANNEL_LABEL, CHANNEL_ORDER } from '@/shared/lib/notification-labels'

/** Hodisa -> kanal -> shablon matritsasi. Har bir katakda shablon va faollik belgisi. */
export default function NotificationRulesPage() {
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [ev, ru, tp] = await Promise.all([
        adminNotificationsApi.events(),
        adminNotificationsApi.rules(),
        adminNotificationsApi.templates(),
      ])
      setEvents(ev)
      setRules(ru)
      setTemplates(tp)
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const ruleOf = (event: string, channel: NotificationChannel) =>
    rules.find((r) => r.event_code === event && r.channel === channel) ?? null

  const cellKey = (event: string, channel: NotificationChannel) => `${event}:${channel}`

  const changeTemplate = async (event: string, channel: NotificationChannel, templateCode: string) => {
    const current = ruleOf(event, channel)
    const key = cellKey(event, channel)
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      if (!templateCode) {
        if (current) await adminNotificationsApi.deleteRule(event, channel)
        setNotice('Qoida o‘chirildi')
      } else {
        await adminNotificationsApi.upsertRule({
          event_code: event,
          channel,
          template_code: templateCode,
          is_active: current?.is_active ?? true,
        })
        setNotice('Qoida saqlandi')
      }
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const toggleActive = async (event: string, channel: NotificationChannel) => {
    const current = ruleOf(event, channel)
    if (!current) return
    setBusy(cellKey(event, channel))
    setError(null)
    try {
      await adminNotificationsApi.upsertRule({
        event_code: event,
        channel,
        template_code: current.template_code,
        is_active: !current.is_active,
      })
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <AdminPageShell
      eyebrow="Xabarnomalar"
      title="Hodisalar va email"
      description="Tizim hodisalari (ro‘yxatdan o‘tish, to‘lov, referal) qaysi kanal va shablon bilan xabar yuborishini belgilang"
    >
      <div className="space-y-6">
        {error && <AdminAlert>{error}</AdminAlert>}
        {notice && <AdminAlert tone="success">{notice}</AdminAlert>}

        <AdminSection
          title="Hodisa qoidalari"
          description="Hodisa yuz berganda tanlangan kanal orqali shablon yuboriladi. Foydalanuvchida shu kanal manzili bo‘lmasa, o‘tkazib yuboriladi."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Hodisa</th>
                  {CHANNEL_ORDER.map((c) => <th key={c} className="py-2 pr-4">{CHANNEL_LABEL[c]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border align-top">
                {events.map((ev) => (
                  <tr key={ev.event_code}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{ev.description}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{ev.event_code}</p>
                    </td>
                    {CHANNEL_ORDER.map((c) => {
                      const rule = ruleOf(ev.event_code, c)
                      const options = templates.filter((t) => t.channel === c && (t.is_active || t.code === rule?.template_code))
                      const key = cellKey(ev.event_code, c)
                      return (
                        <td key={c} className="py-3 pr-4">
                          <select
                            className={adminInput}
                            value={rule?.template_code ?? ''}
                            disabled={busy === key}
                            onChange={(e) => changeTemplate(ev.event_code, c, e.target.value)}
                            aria-label={`${ev.description} — ${CHANNEL_LABEL[c]} shabloni`}
                          >
                            <option value="">— yo‘q —</option>
                            {options.map((t) => (
                              <option key={t.code} value={t.code}>{t.title}{t.is_active ? '' : ' (o‘chirilgan)'}</option>
                            ))}
                          </select>
                          {rule && (
                            <label className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={rule.is_active}
                                disabled={busy === key}
                                onChange={() => toggleActive(ev.event_code, c)}
                                className="size-3.5"
                              />
                              Faol
                            </label>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>

        <EmailAccountsPanel />
      </div>
    </AdminPageShell>
  )
}
