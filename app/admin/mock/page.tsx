/**
 * app/admin/mock/page.tsx
 * =======================
 * Admin sessiyalar va davomat boshqaruvi.
 *
 * Imkoniyatlar:
 *  - Yangi sessiya yaratish (mock_exam_id tanlash, sana, manzil, viloyat, sig'im)
 *  - Barcha sessiyalar ro'yxati (accordion)
 *  - Har bir sessiya: ro'yxatdan o'tganlar jadvali
 *  - Davomat tasdiqlash ("Keldi" tugmasi)
 *  - Javob varaqlari ZIP va to'liq paket yuklab olish
 */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, Archive, Calendar, Check,
  ChevronDown, ChevronUp, FileDown, MapPin, Plus, ShieldAlert, Users,
} from 'lucide-react'
import { mockExamsApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { ExamSession, ExamSessionCreateInput, MockExam, Region, SessionRegistration } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'

// ── Viloyatlar ──────────────────────────────────────────────────────────────
const REGIONS: { value: Region; label: string }[] = [
  { value: 'tashkent_city',   label: 'Toshkent shahri' },
  { value: 'tashkent_region', label: 'Toshkent viloyati' },
  { value: 'andijan',         label: 'Andijon' },
  { value: 'bukhara',         label: 'Buxoro' },
  { value: 'fergana',         label: 'Farg\'ona' },
  { value: 'jizzakh',         label: 'Jizzax' },
  { value: 'kashkadarya',     label: 'Qashqadaryo' },
  { value: 'navoiy',          label: 'Navoiy' },
  { value: 'namangan',        label: 'Namangan' },
  { value: 'samarkand',       label: 'Samarqand' },
  { value: 'surkhandarya',    label: 'Surxondaryo' },
  { value: 'syrdarya',        label: 'Sirdaryo' },
  { value: 'khorezm',         label: 'Xorazm' },
  { value: 'karakalpakstan',  label: 'Qoraqalpog\'iston' },
]

// ── Holat ────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlangan',
  ATTENDED: 'Qatnashdi', CANCELLED: 'Bekor qilingan',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  ATTENDED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

function fmtDt(dt: string) {
  return new Date(dt).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  mock_exam_id: '',
  exam_date: '',
  center_name: '',
  room_name: '',
  location_address: '',
  region: '' as Region | '',
  capacity: '' as number | '',
  required_documents: '',
  is_active: true,
}

export default function AdminMockPage() {
  const { user, isLoading } = useAuth()
  const [exams, setExams]         = useState<MockExam[]>([])
  const [sessions, setSessions]   = useState<ExamSession[]>([])
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [regs, setRegs]           = useState<Record<number, SessionRegistration[]>>({})
  const [error, setError]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [busy, setBusy]           = useState<Record<string, boolean>>({})

  const isAdmin = user?.global_role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    mockExamsApi.adminList().then(setExams).catch(() => {})
    loadSessions()
  }, [isAdmin])

  async function loadSessions() {
    try { setSessions(await mockExamsApi.adminSessions()) }
    catch { setSessions([]) }
  }

  async function loadRegs(sessionId: number) {
    if (regs[sessionId]) return
    try {
      const data = await mockExamsApi.sessionRegistrations(sessionId)
      setRegs(prev => ({ ...prev, [sessionId]: data }))
    } catch {
      setRegs(prev => ({ ...prev, [sessionId]: [] }))
    }
  }

  function toggleSession(id: number) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    loadRegs(id)
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await mockExamsApi.createSession({
        mock_exam_id: form.mock_exam_id,
        exam_date: new Date(form.exam_date).toISOString(),
        center_name: form.center_name || undefined,
        room_name: form.room_name || undefined,
        location_address: form.location_address,
        region: form.region || undefined,
        capacity: form.capacity !== '' ? Number(form.capacity) : undefined,
        required_documents: form.required_documents || undefined,
        is_active: form.is_active,
      } as ExamSessionCreateInput)
      await loadSessions()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Sessiya yaratishda xatolik')
    } finally { setSaving(false) }
  }

  async function handleConfirm(regId: number, sessionId: number) {
    if (!confirm('Bu talabaning kelganini tasdiqlaysizmi?')) return
    setBusy(b => ({ ...b, [`confirm-${regId}`]: true }))
    try {
      await mockExamsApi.confirmAttendance(regId)
      const updated = await mockExamsApi.sessionRegistrations(sessionId)
      setRegs(prev => ({ ...prev, [sessionId]: updated }))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Tasdiqlashda xatolik')
    } finally {
      setBusy(b => ({ ...b, [`confirm-${regId}`]: false }))
    }
  }

  async function dl(url: string, filename: string) {
    setBusy(b => ({ ...b, [filename]: true }))
    await authenticatedDownload(url, { filename, onError: setError })
    setBusy(b => ({ ...b, [filename]: false }))
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Yuklanmoqda...
    </div>
  )
  if (!isAdmin) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administratorlar kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container-shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <span className="font-semibold">Admin · Sessiyalar va davomat</span>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Yangi sessiya
          </button>
        </div>
      </header>

      <main className="container-shell py-10 space-y-8">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* ── Yangi sessiya formasi ── */}
        {showForm && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-5 font-bold">Yangi sessiya yaratish</h2>
            <form onSubmit={handleCreateSession} className="grid gap-4 sm:grid-cols-2">

              <label className="block">
                <span className="label-xs">Mock imtihon *</span>
                <select
                  required
                  value={form.mock_exam_id}
                  onChange={e => setForm(f => ({ ...f, mock_exam_id: e.target.value }))}
                  className="field"
                >
                  <option value="">— tanlang —</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="label-xs">Imtihon sanasi va vaqti *</span>
                <input
                  type="datetime-local" required
                  value={form.exam_date}
                  onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
                  className="field"
                />
              </label>

              <label className="block">
                <span className="label-xs">Markaz</span>
                <input value={form.center_name} onChange={e => setForm(f => ({ ...f, center_name: e.target.value }))} placeholder="Mock Center" className="field" />
              </label>
              <label className="block">
                <span className="label-xs">Xona</span>
                <input value={form.room_name} onChange={e => setForm(f => ({ ...f, room_name: e.target.value }))} placeholder="301-xona" className="field" />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-xs">Manzil *</span>
                <input
                  required
                  value={form.location_address}
                  onChange={e => setForm(f => ({ ...f, location_address: e.target.value }))}
                  placeholder="Toshkent sh., Chilonzor t., 5-uy"
                  className="field"
                />
              </label>

              <label className="block">
                <span className="label-xs">Viloyat</span>
                <select
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value as Region | '' }))}
                  className="field"
                >
                  <option value="">— ixtiyoriy —</option>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="label-xs">Sig'imi (ixtiyoriy)</span>
                <input
                  type="number" min={1}
                  value={form.capacity}
                  onChange={e => setForm(f => ({
                    ...f, capacity: e.target.value ? Number(e.target.value) : '',
                  }))}
                  placeholder="100"
                  className="field"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-xs">Talab qilinadigan hujjatlar (nuqtali vergul bilan)</span>
                <input
                  value={form.required_documents}
                  onChange={e => setForm(f => ({ ...f, required_documents: e.target.value }))}
                  placeholder="Pasport;To'lov kvitansiyasi;Rasm"
                  className="field"
                />
              </label>

              <div className="sm:col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox" checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  Faol (foydalanuvchilarga ko'rinadi)
                </label>
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => setShowForm(false)}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit" disabled={saving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Sessiyalar ro'yxati ── */}
        <div>
          <h2 className="mb-4 text-lg font-bold">Barcha sessiyalar</h2>
          {sessions.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
              Hozircha sessiyalar yo'q. "Yangi sessiya" tugmasini bosing.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => {
                const exam    = exams.find(e => e.id === session.mock_exam_id)
                const open    = expanded === session.id
                const regList = regs[session.id]
                const attended = regList?.filter(r => r.status === 'ATTENDED').length ?? 0

                return (
                  <div key={session.id} className="rounded-xl border bg-card overflow-hidden">
                    {/* Accordion sarlavha */}
                    <button
                      onClick={() => toggleSession(session.id)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Calendar className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {exam?.title ?? session.mock_exam_id}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0 text-xs text-muted-foreground">
                          <span><Calendar className="inline size-3 mr-0.5" />{fmtDt(session.exam_date)}</span>
                          <span><MapPin className="inline size-3 mr-0.5" />{session.location_address}</span>
                          <span>
                            <Users className="inline size-3 mr-0.5" />
                            {session.registered_count}
                            {session.capacity ? `/${session.capacity}` : ''} ta
                            {open && regList && ` · ${attended} keldi`}
                          </span>
                          {!session.is_active && <span className="text-red-500">· Nofaol</span>}
                        </div>
                      </div>

                      {/* Download tugmalari */}
                      <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                        {[
                          {
                            label: 'Javob varaqlari',
                            icon: <Archive className="size-3" />,
                            url: mockExamsApi.answerSheetsBulkZipUrl(session.id),
                            file: `session-${session.id}-answer-sheets.zip`,
                          },
                          {
                            label: 'To\'liq paket',
                            icon: <FileDown className="size-3" />,
                            url: mockExamsApi.sessionBundleZipUrl(session.id),
                            file: `session-${session.id}-bundle.zip`,
                          },
                        ].map(btn => (
                          <button
                            key={btn.file}
                            onClick={() => dl(btn.url, btn.file)}
                            disabled={!!busy[btn.file]}
                            title={btn.label}
                            className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                          >
                            {btn.icon}
                            {busy[btn.file] ? '...' : btn.label}
                          </button>
                        ))}
                      </div>

                      {open ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                             : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Accordion kengaytmasi — ro'yxat */}
                    {open && (
                      <div className="border-t">
                        {!regList ? (
                          <p className="p-6 text-center text-sm text-muted-foreground">Yuklanmoqda...</p>
                        ) : regList.length === 0 ? (
                          <p className="p-6 text-center text-sm text-muted-foreground">
                            Bu sessiyaga hali hech kim ro'yxatdan o'tmagan.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/40 text-xs text-muted-foreground">
                                <tr>
                                  {['#','F.I.Sh.','Talaba ID','Yosh','Jins','Viloyat','Holat','Sana','Amal']
                                    .map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {regList.map((r, i) => (
                                  <tr key={r.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                                    <td className="px-4 py-2.5 font-medium">{r.full_name}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.student_id ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{r.age}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{r.gender === 'male' ? 'Erkak' : 'Ayol'}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground capitalize text-xs">{r.region?.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-2.5">
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                                        {STATUS_LABEL[r.status] ?? r.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                      {r.created_at ? new Date(r.created_at).toLocaleDateString('uz-UZ') : '—'}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {r.status !== 'ATTENDED' && r.status !== 'CANCELLED' ? (
                                        <button
                                          onClick={() => handleConfirm(r.id, session.id)}
                                          disabled={!!busy[`confirm-${r.id}`]}
                                          className="flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                        >
                                          <Check className="size-3" />
                                          {busy[`confirm-${r.id}`] ? '...' : 'Keldi'}
                                        </button>
                                      ) : r.status === 'ATTENDED' ? (
                                        <span className="text-xs text-emerald-600 font-medium">✓ Keldi</span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
