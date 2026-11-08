'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Download, MapPin, Users } from 'lucide-react'

import { applyApi } from '@/shared/api/modules/apply'
import { mockCenterApi } from '@/shared/api/modules/exam/mock-center'
import { mockExamsApi } from '@/shared/api/modules/exam/mock-exams'
import { authenticatedDownload } from '@/shared/api/download'
import { getErrorMessage } from '@/shared/api/client'
import type { ExamSession, Gender, MockExam, Region, SessionRegistration } from '@/shared/api/types'
import { formatDateTime } from '@/shared/lib/format'
import { FOCUS } from '@/shared/lib/brand'
import { GENDER_LABEL, REGIONS, REGION_LABEL, REGISTRATION_STATUS_LABEL, ageFromDob } from '@/shared/lib/mock-labels'
import { Badge, Empty, ErrorBox, Field, Loading, Section, btn, input } from '@/shared/ui/dashboard-kit'

interface RegisterForm {
  full_name: string
  date_of_birth: string
  gender: Gender
  region: Region | ''
  photo_url: string
  photo_name: string
}

const blankForm = (): RegisterForm => ({
  full_name: '',
  date_of_birth: '',
  gender: 'male',
  region: '',
  photo_url: '',
  photo_name: '',
})

const cardCls = 'rounded-2xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.07]'

/**
 * Talaba uchun mock imtihon ro'yxatdan o'tish paneli:
 * ochiq sessiyalar, ro'yxatdan o'tish formasi va o'z ro'yxatlari (ruxsatnoma PDF bilan).
 */
export function MockRegistrationPanel() {
  const [exams, setExams] = useState<MockExam[]>([])
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [mine, setMine] = useState<SessionRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [active, setActive] = useState<ExamSession | null>(null)
  const [form, setForm] = useState<RegisterForm>(blankForm)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const examTitle = useCallback(
    (id: string) => exams.find(e => e.id === id)?.title ?? 'Mock imtihon',
    [exams],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [e, s, m] = await Promise.all([
        mockExamsApi.getAll(),
        mockExamsApi.openSessions(),
        mockExamsApi.myRegistrations(),
      ])
      setExams(e)
      setSessions(s)
      setMine(m)
    } catch (err) {
      setError(getErrorMessage(err, 'Ma’lumotlarni yuklashda xatolik'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const registeredSessionIds = useMemo(
    () => new Set(mine.filter(r => r.status !== 'CANCELLED').map(r => r.session_id)),
    [mine],
  )

  const openForm = (session: ExamSession) => {
    setActive(session)
    setForm(blankForm())
    setFormError(null)
    setNotice(null)
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file || !active) return
    setUploading(true)
    setFormError(null)
    try {
      const res = await applyApi.uploadPhoto(active.registration_slug, file)
      setForm(f => ({ ...f, photo_url: res.photo_url, photo_name: file.name }))
    } catch (err) {
      setFormError(getErrorMessage(err, 'Rasm yuklanmadi'))
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!active) return
    const name = form.full_name.trim()
    if (name.length < 3) return setFormError('F.I.O. kamida 3 belgidan iborat bo‘lishi kerak.')
    if (!form.date_of_birth) return setFormError('Tug‘ilgan sanani kiriting.')
    const age = ageFromDob(form.date_of_birth)
    if (age < 10 || age > 100) return setFormError('Yosh 10 dan 100 gacha bo‘lishi kerak.')
    if (!form.region) return setFormError('Viloyatni tanlang.')
    if (!form.photo_url) return setFormError('3x4 rasm yuklang.')

    setSubmitting(true)
    setFormError(null)
    try {
      await mockExamsApi.registerForSession({
        session_id: active.id,
        full_name: name,
        age,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        region: form.region,
        photo_url: form.photo_url,
      })
      setActive(null)
      setNotice('Ro‘yxatdan o‘tdingiz. Ruxsatnomani pastdagi ro‘yxatdan yuklab olishingiz mumkin.')
      await load()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Ro‘yxatdan o‘tishda xatolik'))
    } finally {
      setSubmitting(false)
    }
  }

  const downloadPermit = (r: SessionRegistration) =>
    authenticatedDownload(mockCenterApi.permitUrl(r.id), {
      filename: `ruxsatnoma-${r.student_id}.pdf`,
      onError: msg => setError(msg),
    })

  const paymentNote = (exam: MockExam | undefined, session: ExamSession) => {
    if (!exam || !exam.price || exam.price <= 0) return 'Bepul'
    return session.requires_online_payment
      ? 'Oldindan onlayn to‘lov talab qilinadi'
      : 'To‘lov imtihon markazida'
  }

  if (loading) return <Loading rows={3} />

  return (
    <div className="space-y-6">
      {error && <ErrorBox message={error} onRetry={() => void load()} />}
      {notice && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      <Section title="Ochiq sanalar" description="Yozilish uchun sana tanlang. Har bir sanada joylar cheklangan.">
        {!sessions.length ? (
          <Empty text="Hozircha ochiq sana yo‘q." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map(s => {
              const exam = exams.find(e => e.id === s.mock_exam_id)
              const already = registeredSessionIds.has(s.id)
              const full = !!s.is_full
              return (
                <article key={s.id} className={`${cardCls} flex flex-col gap-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-snug">{examTitle(s.mock_exam_id)}</h3>
                    <Badge tone={already ? 'green' : full ? 'red' : 'primary'}>
                      {already ? 'Yozilgansiz' : full ? 'Joy yo‘q' : 'Ochiq'}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-foreground/70">
                    <li className="flex items-center gap-2"><CalendarDays className="size-4" />{formatDateTime(s.exam_date)}</li>
                    <li className="flex items-center gap-2"><MapPin className="size-4" />{s.location_address}</li>
                    <li className="flex items-center gap-2"><Users className="size-4" />
                      {s.available_seats != null ? `${s.available_seats} ta bo‘sh joy` : 'Joylar soni cheklanmagan'}
                    </li>
                  </ul>
                  <p className="text-xs font-semibold text-foreground/60">{paymentNote(exam, s)}</p>
                  <button
                    type="button"
                    disabled={already || full}
                    onClick={() => openForm(s)}
                    className={`${btn.primary} w-full`}
                  >
                    {already ? 'Allaqachon yozilgansiz' : 'Yozilish'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </Section>

      {active && (
        <Section title="Ro‘yxatdan o‘tish" description={`${examTitle(active.mock_exam_id)} — ${formatDateTime(active.exam_date)}`}>
          <form onSubmit={submit} className={`${cardCls} grid gap-4 sm:grid-cols-2`}>
            <Field label="F.I.O.">
              <input className={input} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Familiya Ism Sharif" />
            </Field>
            <Field label="Tug‘ilgan sana">
              <input type="date" className={input} max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            </Field>
            <Field label="Jins">
              <div className="flex gap-4 pt-2 text-sm">
                {(['male', 'female'] as Gender[]).map(g => (
                  <label key={g} className="flex items-center gap-2">
                    <input type="radio" name="gender" checked={form.gender === g} onChange={() => setForm(f => ({ ...f, gender: g }))} />
                    {GENDER_LABEL[g]}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Viloyat">
              <select className={input} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value as Region | '' }))}>
                <option value="">Tanlang</option>
                {REGIONS.map(r => <option key={r} value={r}>{REGION_LABEL[r]}</option>)}
              </select>
            </Field>
            <Field label="3x4 rasm">
              <div className="flex flex-wrap items-center gap-3">
                <label className={`${btn.outline} cursor-pointer`}>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => void onPhoto(e.target.files?.[0])} disabled={uploading} />
                  {uploading ? 'Yuklanmoqda…' : form.photo_url ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                </label>
                {form.photo_name && <span className="truncate text-xs text-foreground/60">{form.photo_name}</span>}
              </div>
            </Field>
            {formError && <p className="sm:col-span-2 text-sm font-semibold text-red-700">{formError}</p>}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" disabled={submitting || uploading} className={btn.primary}>
                {submitting ? 'Yuborilmoqda…' : 'Yozilishni tasdiqlash'}
              </button>
              <button type="button" onClick={() => setActive(null)} className={btn.outline}>Bekor qilish</button>
            </div>
          </form>
        </Section>
      )}

      <Section title="Mening ro‘yxatlarim" description="Ruxsatnomani yuklab oling va imtihon kuni olib keling.">
        {!mine.length ? (
          <Empty text="Siz hali hech qanday sanaga yozilmagansiz." />
        ) : (
          <div className="grid gap-3">
            {mine.map(r => (
              <article key={r.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <h3 className="font-bold">{examTitle(r.mock_exam_id)}</h3>
                  <p className="text-sm text-foreground/70">
                    {r.exam_date ? formatDateTime(r.exam_date) : '—'}
                    {r.location_address ? ` · ${r.location_address}` : ''}
                  </p>
                  <p className="mt-1 font-mono text-xs text-foreground/60">MK ID: {r.student_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={r.status === 'ATTENDED' ? 'green' : r.status === 'CANCELLED' ? 'red' : 'sky'}>
                    {REGISTRATION_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                  {r.status !== 'CANCELLED' && (
                    <button type="button" onClick={() => void downloadPermit(r)} className={`${btn.outline} ${FOCUS}`}>
                      <Download className="size-4" /> Ruxsatnoma
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
