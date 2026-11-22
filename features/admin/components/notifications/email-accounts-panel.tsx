'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonDanger, adminButtonSecondary } from '@/features/admin/components/ui/styles'
import { adminNotificationsApi, getErrorMessage } from '@/shared/api'
import type { EmailAccount } from '@/shared/api/types'

/** Backend Gmail OAuth'dan keyin ?gmail=... bilan qaytaradi. */
const GMAIL_RESULT: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: 'Gmail hisob ulandi' },
  cancelled: { ok: false, text: 'Gmail ulash bekor qilindi' },
  no_refresh_token: { ok: false, text: 'Google yangi ruxsat bermadi. Qayta ulab, ruxsatni tasdiqlang.' },
  error: { ok: false, text: 'Gmail ulashda xatolik. Qayta urinib ko‘ring.' },
}

/** Email yuboruvchi hisoblar: Gmail ulash, default, faollik, sinov xati. */
export function EmailAccountsPanel() {
  const [accounts, setAccounts] = useState<EmailAccount[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    try {
      setAccounts(await adminNotificationsApi.emailAccounts())
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Google'dan qaytgandan keyin natijani ko'rsatamiz va URL'dan parametrni olib tashlaymiz.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('gmail')
    if (!status) return
    const result = GMAIL_RESULT[status]
    if (result?.ok) setNotice(result.text)
    else if (result) setError(result.text)
    params.delete('gmail')
    const qs = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    void load()
  }, [load])

  const connect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const { url } = await adminNotificationsApi.gmailConnect()
      window.location.href = url
    } catch (e) {
      setError(getErrorMessage(e))
      setConnecting(false)
    }
  }

  const run = async (id: number, action: () => Promise<unknown>, done: string) => {
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

  const makeDefault = (a: EmailAccount) => run(a.id, () => adminNotificationsApi.updateEmailAccount(a.id, { is_default: true }), 'Default hisob o‘zgartirildi')
  const toggleActive = (a: EmailAccount) =>
    run(a.id, () => adminNotificationsApi.updateEmailAccount(a.id, { is_active: !a.is_active }), a.is_active ? 'Hisob o‘chirildi' : 'Hisob yoqildi')

  const sendTest = (a: EmailAccount) => {
    const to = window.prompt('Sinov xati qaysi manzilga yuborilsin?', a.email)
    if (!to) return
    void run(
      a.id,
      () => adminNotificationsApi.testEmailAccount(a.id, { to: to.trim(), subject: 'Steply test xabari', body: 'Bu sinov xati. Gmail ulanishi ishlayapti.' }),
      `Sinov xati yuborildi: ${to.trim()}`,
    )
  }

  const remove = (a: EmailAccount) => {
    if (!window.confirm(`${a.email} hisobini o‘chirasizmi? Bu hisobdan keyin xat yuborilmaydi.`)) return
    void run(a.id, () => adminNotificationsApi.deleteEmailAccount(a.id), 'Hisob o‘chirildi')
  }

  return (
    <AdminSection
      title="Email yuboruvchi hisoblar"
      description="Gmail akkauntingizni ulang: email xatlar shu manzildan yuboriladi. Ulanmasa, sozlangan bo‘lsa Resend ishlatiladi."
    >
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={connect} disabled={connecting} className={adminButtonSecondary}>
          <Mail className="size-3.5" aria-hidden="true" /> {connecting ? 'Yo‘naltirilmoqda…' : 'Gmail ulash'}
        </button>
      </div>

      {error && <AdminAlert className="mt-4">{error}</AdminAlert>}
      {notice && <AdminAlert tone="success" className="mt-4">{notice}</AdminAlert>}

      <div className="mt-4 overflow-x-auto">
        {accounts && accounts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Gmail ulanmagan.</p>
        )}
        {accounts && accounts.length > 0 && (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Holat</th>
                <th className="py-2 pr-4">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{a.email}</p>
                    {a.display_name && <p className="text-xs text-muted-foreground">{a.display_name}</p>}
                    {a.last_error && <p className="mt-1 text-xs text-error">{a.last_error}</p>}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === 'ok' ? <AdminBadge tone="success">Ulangan</AdminBadge> : <AdminBadge tone="warning">Qayta ulash kerak</AdminBadge>}
                      {a.is_default && <AdminBadge tone="info">Default</AdminBadge>}
                      {!a.is_active && <AdminBadge tone="warning">O‘chirilgan</AdminBadge>}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {!a.is_default && a.is_active && a.status === 'ok' && (
                        <button type="button" disabled={busyId === a.id} onClick={() => makeDefault(a)} className={adminButtonSecondary}>Default qilish</button>
                      )}
                      {a.status === 'ok' && (
                        <button type="button" disabled={busyId === a.id} onClick={() => sendTest(a)} className={adminButtonSecondary}>
                          <Send className="size-3.5" aria-hidden="true" /> Sinov
                        </button>
                      )}
                      <button type="button" disabled={busyId === a.id} onClick={() => toggleActive(a)} className={adminButtonSecondary}>
                        {a.is_active ? 'O‘chirish' : 'Yoqish'}
                      </button>
                      <button type="button" disabled={busyId === a.id} onClick={() => remove(a)} className={adminButtonDanger}>O‘chirib tashlash</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminSection>
  )
}
