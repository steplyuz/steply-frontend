'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, ExternalLink, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { AdminAlert, AdminBadge, AdminSection } from '@/features/admin/components/ui'
import { adminButtonDanger, adminButtonPrimary, adminButtonSecondary, adminInput } from '@/features/admin/components/ui/styles'
import { getErrorMessage, onboardingAdminApi } from '@/shared/api'
import type { OnboardingExamDate, OnboardingExamDateInput } from '@/shared/api/types'
import { formatExamDate } from '@/features/onboarding/components/onboarding-constants'

type Form = { title: string; exam_date: string; register_url: string; is_active: boolean }

const BLANK: Form = { title: '', exam_date: '', register_url: '', is_active: true }

/** Forma tekshiruvi. Backend ham tekshiradi, bu esa admin'ga darhol xabar beradi. */
function validate(f: Form): string | null {
  if (!f.title.trim()) return 'Imtihon nomini kiriting'
  if (!f.exam_date) return 'Imtihon sanasini tanlang'
  if (!/^https?:\/\/\S{4,}$/i.test(f.register_url.trim())) return 'Ro‘yxatdan o‘tish linki http:// yoki https:// bilan boshlanishi kerak'
  return null
}

export default function AdminExamDatesPage() {
  const [items, setItems] = useState<OnboardingExamDate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(BLANK)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [rowBusy, setRowBusy] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setItems(await onboardingAdminApi.examDates())
    } catch (e) {
      setLoadError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeCount = useMemo(() => items.filter((x) => x.is_active).length, [items])

  function resetForm() {
    setForm(BLANK)
    setEditingId(null)
    setFormError(null)
  }

  function startEdit(item: OnboardingExamDate) {
    setEditingId(item.id)
    setForm({ title: item.title, exam_date: item.exam_date, register_url: item.register_url, is_active: item.is_active })
    setFormError(null)
    setNotice(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const err = validate(form)
    if (err) return setFormError(err)
    setSaving(true)
    setFormError(null)
    setNotice(null)
    const payload: OnboardingExamDateInput = {
      title: form.title.trim(),
      exam_date: form.exam_date,
      register_url: form.register_url.trim(),
      is_active: form.is_active,
    }
    try {
      if (editingId === null) {
        await onboardingAdminApi.createExamDate(payload)
        setNotice('Imtihon sanasi qo‘shildi')
      } else {
        await onboardingAdminApi.updateExamDate(editingId, payload)
        setNotice('Imtihon sanasi yangilandi')
      }
      resetForm()
      await load()
    } catch (e) {
      setFormError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(item: OnboardingExamDate) {
    setRowBusy(item.id)
    setNotice(null)
    try {
      await onboardingAdminApi.updateExamDate(item.id, { is_active: !item.is_active })
      await load()
    } catch (e) {
      setLoadError(getErrorMessage(e))
    } finally {
      setRowBusy(null)
    }
  }

  async function archive(item: OnboardingExamDate) {
    if (!window.confirm(`“${item.title}” sanasini arxivlaysizmi? Talabalar uni tanlay olmaydi, mavjud rejalar saqlanadi.`)) return
    setRowBusy(item.id)
    setNotice(null)
    try {
      await onboardingAdminApi.archiveExamDate(item.id)
      if (editingId === item.id) resetForm()
      setNotice('Imtihon sanasi arxivlandi')
      await load()
    } catch (e) {
      setLoadError(getErrorMessage(e))
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <AdminPageShell
      eyebrow="Onboarding"
      title="Imtihon sanalari"
      description="Talabalar onboardingda shu sanalardan birini tanlaydi. Ro‘yxatdan o‘tish linki mygov sahifasiga olib boradi."
      actions={
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarDays aria-hidden className="size-4" />
          Faol: {activeCount} / Jami: {items.length}
        </span>
      }
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-6 sm:px-5 lg:px-8">
        {notice ? <AdminAlert tone="success">{notice}</AdminAlert> : null}
        {loadError ? <AdminAlert tone="error">{loadError}</AdminAlert> : null}

        <AdminSection
          title={editingId === null ? 'Yangi imtihon sanasi' : 'Sanani tahrirlash'}
          description="Sana o‘tib ketganda talabalar uni tanlay olmaydi. Nofaol qilingan sana ro‘yxatda ko‘rinmaydi."
        >
          <form onSubmit={submit} noValidate className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Imtihon nomi</span>
              <input
                className={adminInput}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="IELTS Academic — Dekabr 2026"
                maxLength={255}
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Imtihon sanasi</span>
              <input
                type="date"
                className={adminInput}
                value={form.exam_date}
                onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                required
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Ro‘yxatdan o‘tish linki (mygov)</span>
              <input
                type="url"
                className={adminInput}
                value={form.register_url}
                onChange={(e) => setForm({ ...form, register_url: e.target.value })}
                placeholder="https://www.mygov.uz/..."
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground md:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-foreground"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Faol (talabalar tanlay oladi)
            </label>

            {formError ? (
              <div className="md:col-span-2">
                <AdminAlert tone="error">{formError}</AdminAlert>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className={adminButtonPrimary}>
                {editingId === null ? <Plus aria-hidden className="size-4" /> : <Save aria-hidden className="size-4" />}
                {saving ? 'Saqlanmoqda…' : editingId === null ? 'Qo‘shish' : 'Saqlash'}
              </button>
              {editingId !== null ? (
                <button type="button" onClick={resetForm} className={adminButtonSecondary}>
                  <X aria-hidden className="size-3.5" /> Bekor qilish
                </button>
              ) : null}
            </div>
          </form>
        </AdminSection>

        <AdminSection title="Ro‘yxat">
          {loading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Hozircha imtihon sanalari yo‘q. Yuqoridagi forma orqali qo‘shing.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const busy = rowBusy === item.id
                return (
                  <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{item.title}</span>
                        <AdminBadge tone={item.is_active ? 'success' : 'warning'}>{item.is_active ? 'Faol' : 'Nofaol'}</AdminBadge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">{formatExamDate(item.exam_date)}</span>
                        <a href={item.register_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground">
                          Ro‘yxat linki <ExternalLink aria-hidden className="size-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy} onClick={() => startEdit(item)} className={adminButtonSecondary}>
                        <Pencil aria-hidden className="size-3.5" /> Tahrirlash
                      </button>
                      <button type="button" disabled={busy} onClick={() => toggleActive(item)} className={adminButtonSecondary}>
                        <RotateCcw aria-hidden className="size-3.5" /> {item.is_active ? 'Nofaol qilish' : 'Faollashtirish'}
                      </button>
                      <button type="button" disabled={busy} onClick={() => archive(item)} className={adminButtonDanger}>
                        <Trash2 aria-hidden className="size-3.5" /> Arxivlash
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </AdminSection>
      </div>
    </AdminPageShell>
  )
}
