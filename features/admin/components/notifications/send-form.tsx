'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { AdminAlert, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminInput } from '@/features/admin/components/ui/styles'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type {
  EmailAccount, NotificationCategory, NotificationChannel, NotificationSendResult, NotificationTemplate,
} from '@/shared/api/types'
import {
  CATEGORY_LABEL, CHANNEL_LABEL, CHANNEL_ORDER, extractPlaceholders, splitList,
} from '@/shared/lib/notification-labels'

type Mode = 'template' | 'custom'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'
const hintCls = 'mt-1 text-[11px] text-muted-foreground'
const PLACEHOLDER_HINT: Record<NotificationChannel, string> = {
  sms: '+998901234567',
  telegram: '123456789 (chat_id)',
  email: 'user@example.com',
  in_app: '',
}

/** Admin: bir yoki bir nechta qabul qiluvchiga shablon yoki bir martalik matn bilan xabar yuborish. */
export function SendForm({ onSent }: { onSent?: () => void }) {
  const [channel, setChannel] = useState<NotificationChannel>('in_app')
  const [mode, setMode] = useState<Mode>('template')
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [templateCode, setTemplateCode] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [userIds, setUserIds] = useState('')
  const [addresses, setAddresses] = useState('')
  const [category, setCategory] = useState<NotificationCategory>('transactional')
  const [accountId, setAccountId] = useState('')
  const [link, setLink] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NotificationSendResult | null>(null)

  useEffect(() => {
    adminNotificationsApi.templates().then(setTemplates).catch(() => setTemplates([]))
    adminNotificationsApi.emailAccounts().then(setAccounts).catch(() => setAccounts([]))
  }, [])

  const channelTemplates = useMemo(
    () => templates.filter((t) => t.channel === channel && t.is_active),
    [templates, channel],
  )
  const selected = channelTemplates.find((t) => t.code === templateCode) ?? null
  // "name" foydalanuvchi profilidan backend tomonidan avtomatik qo'yiladi — so'ramaymiz.
  const fields = useMemo(() => {
    const names = mode === 'template' ? selected?.placeholders ?? [] : extractPlaceholders(`${subject}\n${body}`)
    return names.filter((n) => n !== 'name')
  }, [mode, selected, subject, body])
  const usableAccounts = accounts.filter((a) => a.is_active && a.status === 'ok')

  const changeChannel = (next: NotificationChannel) => {
    setChannel(next)
    setTemplateCode('')
    setAccountId('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    const ids = splitList(userIds)
    const addrs = channel === 'in_app' ? [] : splitList(addresses)
    if (ids.length + addrs.length === 0) return setError('Kamida bitta qabul qiluvchi kiriting')
    const badId = ids.find((id) => !UUID_RE.test(id))
    if (badId) return setError(`Noto‘g‘ri user ID: ${badId}`)
    if (mode === 'template' && !templateCode) return setError('Shablonni tanlang')
    if (mode === 'custom' && !body.trim()) return setError('Xabar matnini kiriting')
    if (mode === 'custom' && channel === 'email' && !subject.trim()) return setError('Email uchun mavzu (subject) kerak')
    const missing = fields.filter((f) => !(variables[f] ?? '').trim())
    if (missing.length) return setError(`Qiymat kiriting: ${missing.join(', ')}`)

    const warn = category === 'marketing' ? '\n\nReklama: opt-out qilganlarga yuborilmaydi.' : ''
    if (!window.confirm(`${ids.length + addrs.length} ta qabul qiluvchiga ${CHANNEL_LABEL[channel]} orqali yuboriladi.${warn}\n\nDavom etasizmi?`)) return

    setBusy(true)
    try {
      const res = await adminNotificationsApi.send({
        channel,
        template_code: mode === 'template' ? templateCode : null,
        subject: mode === 'custom' && channel === 'email' ? subject.trim() : null,
        body: mode === 'custom' ? body : null,
        user_ids: ids,
        recipients: addrs,
        variables: Object.fromEntries(fields.map((f) => [f, (variables[f] ?? '').trim()])),
        category,
        email_account_id: channel === 'email' && accountId ? Number(accountId) : null,
        link: channel === 'in_app' && link.trim() ? link.trim() : null,
        // Ikki marta bosilganda ham bitta to'plam navbatga tushadi
        idempotency_key: crypto.randomUUID(),
      })
      setResult(res)
      onSent?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminSection title="Xabar yuborish" description="Shablon yoki bir martalik matn bilan bir yoki bir nechta qabul qiluvchiga yuboring">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <span className={labelCls}>Kanal</span>
            <select className={adminInput} value={channel} onChange={(e) => changeChannel(e.target.value as NotificationChannel)}>
              {CHANNEL_ORDER.map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
            </select>
          </div>

          <div>
            <span className={labelCls}>Matn manbai</span>
            <div className="flex gap-2">
              {(['template', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'template' ? 'Shablon' : 'Bir martalik matn'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'template' ? (
            <div>
              <span className={labelCls}>Shablon</span>
              <select className={adminInput} value={templateCode} onChange={(e) => setTemplateCode(e.target.value)}>
                <option value="">— tanlang —</option>
                {channelTemplates.map((t) => <option key={t.code} value={t.code}>{t.title} ({t.code})</option>)}
              </select>
              {channelTemplates.length === 0 && (
                <p className={hintCls}>
                  Bu kanal uchun faol shablon yo‘q. <Link href="/admin/notifications/templates" className="underline">Shablon yarating</Link>.
                </p>
              )}
            </div>
          ) : (
            <>
              {channel === 'email' && (
                <div>
                  <span className={labelCls}>Mavzu (subject)</span>
                  <input className={adminInput} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} />
                </div>
              )}
              <div>
                <span className={labelCls}>Matn</span>
                <textarea className={`${adminInput} min-h-32`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} />
                <p className={hintCls}>{'{{name}}'} kabi o‘zgaruvchilar qo‘shsangiz, ularning qiymatini quyida kiritasiz.</p>
              </div>
            </>
          )}

          {fields.length > 0 && (
            <div className="space-y-3">
              <span className={labelCls}>O‘zgaruvchilar</span>
              {fields.map((f) => (
                <div key={f}>
                  <label htmlFor={`var-${f}`} className="mb-1 block text-xs text-muted-foreground">{`{{${f}}}`}</label>
                  <input
                    id={`var-${f}`}
                    className={adminInput}
                    value={variables[f] ?? ''}
                    onChange={(e) => setVariables((v) => ({ ...v, [f]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={labelCls}>Foydalanuvchi ID lari (UUID)</span>
            <textarea
              className={`${adminInput} min-h-24 font-mono text-xs`}
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              placeholder="Har qatorda bitta UUID"
            />
          </div>

          {channel !== 'in_app' && (
            <div>
              <span className={labelCls}>To‘g‘ridan-to‘g‘ri manzillar (ixtiyoriy)</span>
              <textarea
                className={`${adminInput} min-h-20 font-mono text-xs`}
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder={PLACEHOLDER_HINT[channel]}
              />
              <p className={hintCls}>Bu manzillar hech qanday foydalanuvchiga bog‘lanmaydi.</p>
            </div>
          )}

          {channel === 'email' && (
            <div>
              <span className={labelCls}>Yuboruvchi hisob</span>
              <select className={adminInput} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Default (Gmail yoki Resend)</option>
                {usableAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.email}{a.is_default ? ' (default)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          {channel === 'in_app' && (
            <div>
              <span className={labelCls}>Havola (ixtiyoriy)</span>
              <input className={adminInput} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard/billing" />
              <p className={hintCls}>Bildirishnoma bosilganda ochiladi: ichki yo‘l (/...) yoki https:// manzil.</p>
            </div>
          )}

          <div>
            <span className={labelCls}>Turi</span>
            <select className={adminInput} value={category} onChange={(e) => setCategory(e.target.value as NotificationCategory)}>
              {(Object.keys(CATEGORY_LABEL) as NotificationCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            {category === 'marketing' && (
              <p className={hintCls}>Reklama: opt-out qilganlarga yuborilmaydi, xatda “bekor qilish” havolasi bo‘ladi.</p>
            )}
          </div>

          <div className="pt-1">
            <button type="submit" disabled={busy} className={adminButtonPrimary}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              Yuborish
            </button>
          </div>
        </div>
      </form>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {result && (
        <AdminAlert tone="success" className="mt-4">
          Navbatga qo‘yildi: {result.queued} ta
          {result.skipped_opted_out ? `, opt-out bo‘yicha o‘tkazildi: ${result.skipped_opted_out}` : ''}.{' '}
          <Link href="/admin/notifications/messages" className="underline">Navbatni ko‘rish</Link>
        </AdminAlert>
      )}
    </AdminSection>
  )
}
