'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Eye, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonPrimary, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { ApiRequestError, adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type {
  NotificationChannel, NotificationPreview, NotificationTemplate, NotificationTemplateInput,
} from '@/shared/api/types'
import { CHANNEL_LABEL, CHANNEL_ORDER, extractPlaceholders } from '@/shared/lib/notification-labels'

const CODE_RE = /^[a-z][a-z0-9_]{2,63}$/
const labelCls = 'mb-1.5 block text-xs font-semibold text-muted-foreground'

interface Draft {
  code: string
  channel: NotificationChannel
  title: string
  subject: string
  body: string
  html_body: string
  is_active: boolean
}

const BLANK: Draft = { code: '', channel: 'in_app', title: '', subject: '', body: '', html_body: '', is_active: true }

/** Xabar shablonlari: ro'yxat, yaratish, tahrirlash, email HTML va ko'rib chiqish. */
export default function NotificationTemplatesPage() {
  const [items, setItems] = useState<NotificationTemplate[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<NotificationPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await adminNotificationsApi.templates())
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const placeholders = useMemo(
    () => extractPlaceholders(`${draft.subject}\n${draft.body}\n${draft.html_body}`).filter((n) => n !== 'name'),
    [draft.subject, draft.body, draft.html_body],
  )

  const pick = (t: NotificationTemplate) => {
    setEditing(t.code)
    setDraft({
      code: t.code,
      channel: t.channel,
      title: t.title,
      subject: t.subject ?? '',
      body: t.body,
      html_body: t.html_body ?? '',
      is_active: t.is_active,
    })
    setVars({})
    setPreview(null)
    setError(null)
    setNotice(null)
  }

  /** Standart shablon va qoidalarni qo'shadi (mavjudlari o'zgarmaydi). */
  const seed = async () => {
    setError(null)
    setNotice(null)
    try {
      const r = await adminNotificationsApi.seedDefaults()
      setNotice(`Standart shablonlar: ${r.templates_created} ta shablon, ${r.rules_created} ta qoida qo‘shildi`)
      await load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  /** O'chirish. Shablon qoidada ishlatilsa (409), foydalanuvchi tasdiqlasa qoidalar bilan birga o'chiriladi. */
  const remove = async () => {
    if (!editing) return
    if (!window.confirm(`“${editing}” shablonini o‘chirasizmi? Bu amalni qaytarib bo‘lmaydi.`)) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await adminNotificationsApi.deleteTemplate(editing)
      startNew()
      setNotice('Shablon o‘chirildi')
      await load()
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 409) {
        if (window.confirm(`${e.message}\n\nShablon va unga bog‘liq qoidalar birga o‘chirilsinmi?`)) {
          try {
            await adminNotificationsApi.deleteTemplate(editing, { force: true })
            startNew()
            setNotice('Shablon va bog‘liq qoidalar o‘chirildi')
            await load()
          } catch (err) {
            setError(getErrorMessage(err))
          }
        } else {
          setError(e.message)
        }
      } else {
        setError(getErrorMessage(e))
      }
    } finally {
      setSaving(false)
    }
  }

  const startNew = () => {
    setEditing(null)
    setDraft(BLANK)
    setVars({})
    setPreview(null)
    setError(null)
    setNotice(null)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!editing && draft.code && !CODE_RE.test(draft.code)) {
      setError('Kod: kichik lotin harf, raqam va _ (3–64 belgi), harf bilan boshlanishi kerak. Bo‘sh qoldirsangiz avtomatik beriladi')
      return
    }
    if (!draft.title.trim()) return setError('Sarlavha kiriting')
    if (!draft.body.trim()) return setError('Matn kiriting (ilova ichida va email’ning oddiy matni uchun)')
    if (draft.channel === 'email' && !draft.subject.trim()) return setError('Email shablon uchun mavzu (subject) kerak')

    setSaving(true)
    const subject = draft.channel === 'email' ? draft.subject.trim() : null
    const html_body = draft.channel === 'email' ? draft.html_body.trim() || null : null
    try {
      if (editing) {
        const updated = await adminNotificationsApi.updateTemplate(editing, {
          title: draft.title.trim(), subject, body: draft.body, html_body, is_active: draft.is_active,
        })
        pick(updated)
        setNotice('Shablon saqlandi')
      } else {
        const input: NotificationTemplateInput = {
          code: draft.code.trim() || undefined, channel: draft.channel, title: draft.title.trim(), subject, body: draft.body,
          html_body, is_active: draft.is_active,
        }
        const created = await adminNotificationsApi.createTemplate(input)
        pick(created)
        setNotice(`Shablon yaratildi: ${created.code}`)
      }
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const runPreview = async () => {
    if (!editing) {
      setError('Avval shablonni saqlang, so‘ng ko‘rib chiqing')
      return
    }
    setError(null)
    try {
      setPreview(await adminNotificationsApi.previewTemplate(editing, vars))
    } catch (e) {
      setPreview(null)
      setError(getErrorMessage(e))
    }
  }

  const isEditing = editing !== null

  return (
    <AdminPageShell
      eyebrow="Xabarnomalar"
      title="Shablonlar"
      description="Xabar matnlari. {{nom}} ko‘rinishidagi o‘zgaruvchilar yuborishda qiymat bilan almashtiriladi."
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={seed} className={adminButtonSecondary}>
            <Sparkles className="size-3.5" aria-hidden="true" /> Standart shablonlar
          </button>
          <button type="button" onClick={startNew} className={adminButtonSecondary}>
            <Plus className="size-3.5" aria-hidden="true" /> Yangi shablon
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <AdminSection title="Ro‘yxat">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Shablonlar yo‘q. Yangisini yarating.</p>}
          <ul className="divide-y divide-border">
            {items.map((t) => (
              <li key={t.code}>
                <button
                  type="button"
                  onClick={() => pick(t)}
                  className={`flex w-full flex-col gap-1.5 px-3 py-3 text-left transition hover:bg-muted/60 ${editing === t.code ? 'bg-muted/70' : ''}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{t.title}</span>
                    <AdminBadge tone="info">{CHANNEL_LABEL[t.channel]}</AdminBadge>
                    {t.html_body && <AdminBadge tone="success">HTML</AdminBadge>}
                    {!t.is_active && <AdminBadge tone="warning">O‘chirilgan</AdminBadge>}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title={isEditing ? `Tahrirlash: ${editing}` : 'Yangi shablon'}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={labelCls}>Kod</span>
                <input
                  className={adminInput}
                  value={isEditing ? editing ?? '' : draft.code}
                  disabled={isEditing}
                  onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.trim() }))}
                  placeholder="Bo‘sh = avtomatik (tpl_N)"
                />
              </div>
              <div>
                <span className={labelCls}>Kanal</span>
                <select
                  className={adminInput}
                  value={draft.channel}
                  disabled={isEditing}
                  onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value as NotificationChannel }))}
                >
                  {CHANNEL_ORDER.map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <span className={labelCls}>Sarlavha</span>
              <input className={adminInput} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={200} />
            </div>

            {draft.channel === 'email' && (
              <div>
                <span className={labelCls}>Mavzu (subject)</span>
                <input className={adminInput} value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} maxLength={255} />
              </div>
            )}

            <div>
              <span className={labelCls}>Matn (oddiy)</span>
              <textarea
                className={`${adminInput} min-h-28`}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                maxLength={10000}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ilova ichida va HTML bo‘lmagan emaillar uchun. Ishlatilgan o‘zgaruvchilar:{' '}
                {placeholders.length ? placeholders.map((p) => `{{${p}}}`).join(', ') : 'yo‘q'}.
              </p>
            </div>

            {draft.channel === 'email' && (
              <div>
                <span className={labelCls}>HTML (ixtiyoriy)</span>
                <textarea
                  className={`${adminInput} min-h-48 font-mono text-xs`}
                  value={draft.html_body}
                  onChange={(e) => setDraft((d) => ({ ...d, html_body: e.target.value }))}
                  maxLength={50000}
                  placeholder={'<p>Salom, {{name}}!</p>\n<p><a href="https://steply.uz" style="background:#0F3D26;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;">Boshlash</a></p>'}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Faqat ichki qism. Sarlavha va footer Steply dizaynida avtomatik qo‘shiladi. HTML bo‘sh bo‘lsa, matndan avtomatik yasaladi.
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))} className="size-4" />
              Faol
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className={adminButtonPrimary}>
                <Save className="size-4" aria-hidden="true" /> {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
              {isEditing && (
                <button type="button" disabled={saving} onClick={remove} className={adminButtonSecondary}>
                  <Trash2 className="size-3.5" aria-hidden="true" /> O‘chirish
                </button>
              )}
            </div>
          </form>

          {isEditing && (
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <p className="text-xs font-semibold text-muted-foreground">Ko‘rib chiqish (saqlangan matn bo‘yicha)</p>
              {placeholders.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {placeholders.map((p) => (
                    <div key={p}>
                      <label htmlFor={`pv-${p}`} className="mb-1 block text-xs text-muted-foreground">{`{{${p}}}`}</label>
                      <input id={`pv-${p}`} className={adminInput} value={vars[p] ?? ''} onChange={(e) => setVars((v) => ({ ...v, [p]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={runPreview} className={adminButtonSecondary}>
                <Eye className="size-3.5" aria-hidden="true" /> Ko‘rish
              </button>
              {preview && (
                <div className="space-y-3">
                  {preview.subject && <p className="text-sm font-semibold text-foreground">Mavzu: {preview.subject}</p>}
                  {draft.channel === 'email' ? (
                    <iframe
                      title="Email ko‘rinishi"
                      sandbox=""
                      srcDoc={preview.html}
                      className="h-[520px] w-full rounded-lg border border-border bg-white"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-4 font-sans text-sm text-foreground">{preview.body}</pre>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
          {notice && <AdminAlert tone="success" className="mt-4">{notice}</AdminAlert>}
        </AdminSection>
      </div>
    </AdminPageShell>
  )
}
