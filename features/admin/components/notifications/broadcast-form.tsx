'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, Megaphone } from 'lucide-react'
import { AdminAlert, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminInput } from '@/features/admin/components/ui/styles'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type {
  NotificationBroadcastResult, NotificationCategory, NotificationChannel, NotificationTemplate,
} from '@/shared/api/types'
import {
  CATEGORY_LABEL, CHANNEL_LABEL, CHANNEL_ORDER, extractPlaceholders,
} from '@/shared/lib/notification-labels'

const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'
const hintCls = 'mt-1 text-[11px] text-muted-foreground'

/** Barcha faol foydalanuvchilarga bir vaqtda: ilova ichida, email yoki ikkalasi bo'yicha. */
export function BroadcastForm({ onSent }: { onSent?: () => void }) {
  const [picked, setPicked] = useState<NotificationChannel[]>(['in_app'])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [templateCode, setTemplateCode] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [html, setHtml] = useState('')
  const [link, setLink] = useState('')
  const [category, setCategory] = useState<NotificationCategory>('transactional')
  const [vars, setVars] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NotificationBroadcastResult | null>(null)

  useEffect(() => {
    adminNotificationsApi.templates().then(setTemplates).catch(() => setTemplates([]))
  }, [])

  const tpl = templates.find((t) => t.code === templateCode && t.is_active) ?? null
  // Shablon tanlansa, kanal shablon kanali bilan bir xil bo'ladi (backend shunday talab qiladi)
  const channels: NotificationChannel[] = tpl ? [tpl.channel] : picked
  const hasEmail = channels.includes('email')
  const hasInApp = channels.includes('in_app')

  // "name" foydalanuvchi ismi bilan avtomatik to'ldiriladi
  const names = useMemo(() => {
    const list = tpl ? tpl.placeholders : extractPlaceholders(`${subject}\n${body}\n${html}`)
    return list.filter((n) => n !== 'name')
  }, [tpl, subject, body, html])

  const toggle = (c: NotificationChannel) =>
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (channels.length === 0) return setError('Kamida bitta kanal tanlang')
    if (!templateCode && !body.trim()) return setError('Xabar matnini yozing yoki shablon tanlang')
    if (!templateCode && hasEmail && !subject.trim()) return setError('Email uchun mavzu (subject) kerak')
    const missing = names.filter((n) => !(vars[n] ?? '').trim())
    if (missing.length) return setError(`Qiymat kiriting: ${missing.join(', ')}`)

    const labels = channels.map((c) => CHANNEL_LABEL[c]).join(', ')
    const warn = category === 'marketing' ? '\n\nReklama: opt-out qilganlarga yuborilmaydi.' : ''
    if (!window.confirm(`BARCHA faol foydalanuvchilarga yuboriladi (${labels}).${warn}\n\nDavom etasizmi?`)) return

    setBusy(true)
    try {
      const res = await adminNotificationsApi.broadcast({
        channels,
        template_code: templateCode || null,
        subject: !templateCode && hasEmail ? subject.trim() : null,
        body: !templateCode ? body : null,
        html_body: !templateCode && hasEmail && html.trim() ? html : null,
        link: hasInApp && link.trim() ? link.trim() : null,
        variables: Object.fromEntries(names.map((n) => [n, (vars[n] ?? '').trim()])),
        category,
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
    <AdminSection
      title="Hammaga yuborish"
      description="Barcha faol foydalanuvchilarga bir vaqtda: ilova ichida va/yoki email orqali. Email xabarga Steply dizayni avtomatik qo‘shiladi."
    >
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <span className={labelCls}>Kanallar</span>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_ORDER.map((c) => {
                const on = channels.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!!tpl}
                    onClick={() => toggle(c)}
                    aria-pressed={on}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      on ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {CHANNEL_LABEL[c]}
                  </button>
                )
              })}
            </div>
            {tpl && <p className={hintCls}>Shablon kanali: {CHANNEL_LABEL[tpl.channel]}. Kanalni o‘zgartirish uchun shablonni olib tashlang.</p>}
          </div>

          <div>
            <span className={labelCls}>Shablon (ixtiyoriy)</span>
            <select className={adminInput} value={templateCode} onChange={(e) => { setTemplateCode(e.target.value); setVars({}) }}>
              <option value="">— shablonsiz, matn bilan —</option>
              {templates.filter((t) => t.is_active).map((t) => (
                <option key={t.code} value={t.code}>{t.title} ({CHANNEL_LABEL[t.channel]})</option>
              ))}
            </select>
          </div>

          {!tpl && hasEmail && (
            <div>
              <span className={labelCls}>Mavzu (subject)</span>
              <input className={adminInput} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} />
            </div>
          )}

          {!tpl && (
            <div>
              <span className={labelCls}>Matn</span>
              <textarea className={`${adminInput} min-h-28`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} />
              <p className={hintCls}>Ilova ichida va email’ning oddiy matni. {'{{name}}'} foydalanuvchi ismi bilan almashtiriladi.</p>
            </div>
          )}

          {!tpl && hasEmail && (
            <div>
              <span className={labelCls}>HTML (ixtiyoriy, faqat email)</span>
              <textarea className={`${adminInput} min-h-40 font-mono text-xs`} value={html} onChange={(e) => setHtml(e.target.value)} maxLength={50000} />
              <p className={hintCls}>
                Faqat ichki qism (paragraf, tugma, rasm havolasi). Sarlavha va footer Steply dizaynida avtomatik qo‘shiladi.
                script, iframe, style va on...= atributlari rad etiladi.
              </p>
            </div>
          )}

          {names.length > 0 && (
            <div className="space-y-3">
              <span className={labelCls}>O‘zgaruvchilar</span>
              {names.map((n) => (
                <div key={n}>
                  <label htmlFor={`bc-${n}`} className="mb-1 block text-xs text-muted-foreground">{`{{${n}}}`}</label>
                  <input id={`bc-${n}`} className={adminInput} value={vars[n] ?? ''} onChange={(e) => setVars((v) => ({ ...v, [n]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {hasInApp && (
            <div>
              <span className={labelCls}>Havola (ixtiyoriy, ilova ichida)</span>
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
              <p className={hintCls}>Reklama: opt-out qilganlarga yuborilmaydi, emailda “bekor qilish” havolasi bo‘ladi.</p>
            )}
          </div>

          <div className="pt-1">
            <button type="submit" disabled={busy} className={adminButtonPrimary}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Megaphone className="size-4" aria-hidden="true" />}
              Hammaga yuborish
            </button>
          </div>
        </div>
      </form>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {result && (
        <AdminAlert tone="success" className="mt-4">
          Navbatga qo‘yildi: {result.queued} ta
          {channels.length > 0 && ` (${channels.map((c) => `${CHANNEL_LABEL[c]}: ${result.per_channel[c] ?? 0}`).join(', ')})`}.
          {result.skipped_opted_out ? ` Opt-out bo‘yicha o‘tkazildi: ${result.skipped_opted_out}.` : ''}
          {result.skipped_no_address ? ` Manzili yo‘q: ${result.skipped_no_address}.` : ''}
        </AdminAlert>
      )}
    </AdminSection>
  )
}
