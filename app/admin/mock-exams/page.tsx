'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, GraduationCap, MapPin, Pencil, Plus, RefreshCw, Save, Trash2, Users } from 'lucide-react'
import { mockExamsApi } from '@/lib/api/modules/mock-exams'
import { readingApi } from '@/lib/api/modules/reading'
import { listeningApi } from '@/lib/api/modules/listening'
import { writingApi } from '@/lib/api/modules/writing'
import { speakingApi } from '@/lib/api/modules/speaking'
import type { MockExam, ExamSession, ExamSessionCreateInput } from '@/lib/api/types/mock-exams'

/* ───────────── Types & constants ───────────── */

type Opt = { id: string; title: string }
type RawOpt = { id: string | number; title?: string | null }
type SkillBucket = 'reading' | 'listening' | 'writing' | 'speaking'
type DeliveryMode = 'COMPUTER' | 'PAPER'
type Tab = 'exams' | 'sessions'

const SKILLS = [
  { key: 'reading_id', name: 'Reading', bucket: 'reading' },
  { key: 'listening_id', name: 'Listening', bucket: 'listening' },
  { key: 'writing_id', name: 'Writing', bucket: 'writing' },
  { key: 'speaking_id', name: 'Speaking', bucket: 'speaking' },
] as const

const LEVELS = ['Multilevel', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const DELIVERY_LABEL: Record<DeliveryMode, string> = {
  COMPUTER: 'Kompyuterda',
  PAPER: 'Qog‘ozda',
}

const blankExam = () => ({
  title: '',
  description: '',
  cefr_level: 'Multilevel',
  duration_minutes: 180,
  price: 0,
  is_active: true,
  reading_id: '',
  listening_id: '',
  writing_id: '',
  speaking_id: '',
})

const blankSession = (mockExamId = '') => ({
  mock_exam_id: mockExamId,
  exam_date: '',
  center_name: '',
  room_name: '',
  location_address: '',
  capacity: 30,
  required_documents: 'Pasport yoki ID karta',
  is_active: true,
  delivery_mode: 'COMPUTER' as DeliveryMode,
})

type ExamForm = ReturnType<typeof blankExam>
type SessionForm = ReturnType<typeof blankSession>

const toOpts = (items: unknown): Opt[] =>
  (items as RawOpt[]).map(x => ({ id: String(x.id), title: x.title || String(x.id) }))

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

/* ───────────── Styles ─────────────
   Muhim: `primary` rangi och-yashil (lime), shuning uchun `text-primary` matn sifatida
   o‘qilmaydi. Primary faqat fon / chiziq sifatida, matn esa `text-primary-foreground`
   yoki `text-foreground` bilan ishlatiladi. */

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30'
const labelCls = 'mb-1 block text-xs font-semibold text-muted-foreground'
const cardCls = 'rounded-xl border border-border bg-card'
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50'
const btnOutline =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-muted'

/* ───────────── Small components ───────────── */

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

function Badge({ active, on, off }: { active: boolean; on: string; off: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >
      {active ? on : off}
    </span>
  )
}

function SkillChip({ name, title }: { name: string; title?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
      <span className={`size-2 shrink-0 rounded-full ${title ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
      <span className="font-semibold">{name}</span>
      <span className={`truncate ${title ? 'text-foreground' : 'text-muted-foreground'}`} title={title}>
        {title || 'biriktirilmagan'}
      </span>
    </div>
  )
}

/* ───────────── Page ───────────── */

export default function AdminMockExamsPage() {
  const [tab, setTab] = useState<Tab>('exams')
  const [exams, setExams] = useState<MockExam[]>([])
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [opts, setOpts] = useState<Record<SkillBucket, Opt[]>>({ reading: [], listening: [], writing: [], speaking: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ExamForm>(blankExam())
  const [session, setSession] = useState<SessionForm>(blankSession())

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [e, s, r, l, w, p] = await Promise.all([
        mockExamsApi.adminList(),
        mockExamsApi.adminSessions(),
        readingApi.adminList(),
        listeningApi.adminList(),
        writingApi.adminList(),
        speakingApi.adminList(),
      ])
      setExams(e)
      setSessions(s)
      setOpts({ reading: toOpts(r), listening: toOpts(l), writing: toOpts(w), speaking: toOpts(p) })
      setSession(x => ({ ...x, mock_exam_id: x.mock_exam_id || e[0]?.id || '' }))
    } catch (err) {
      setError(errMsg(err, 'Ma’lumotlarni yuklashda xatolik'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const flash = (msg: string) => {
    setError('')
    setNotice(msg)
  }

  const setF = <K extends keyof ExamForm>(k: K, v: ExamForm[K]) => setForm(f => ({ ...f, [k]: v }))
  const setS = <K extends keyof SessionForm>(k: K, v: SessionForm[K]) => setSession(s => ({ ...s, [k]: v }))

  const startEdit = (e: MockExam) => {
    setEditing(e.id)
    setNotice('')
    setForm({
      ...blankExam(),
      title: e.title,
      description: e.description || '',
      cefr_level: e.cefr_level,
      duration_minutes: e.duration_minutes || 180,
      price: Number(e.price || 0),
      is_active: e.is_active,
      reading_id: e.reading_id || '',
      listening_id: e.listening_id || '',
      writing_id: e.writing_id || '',
      speaking_id: e.speaking_id || '',
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm(blankExam())
  }

  const saveExam = async (ev: FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (editing) {
        const payload = {
          ...form,
          description: form.description || null,
          reading_id: form.reading_id || null,
          listening_id: form.listening_id || null,
          writing_id: form.writing_id || null,
          speaking_id: form.speaking_id || null,
        }
        await mockExamsApi.update(editing, payload as unknown as Parameters<typeof mockExamsApi.update>[1])
      } else {
        const missing = SKILLS.filter(s => !form[s.key]).map(s => s.name)
        if (missing.length) throw new Error(`Mock imtihon yaratish uchun barcha testlarni tanlang: ${missing.join(', ')}.`)
        await mockExamsApi.create({ ...form, description: form.description || null })
      }
      flash(editing ? 'Mock imtihon yangilandi.' : 'Mock imtihon yaratildi.')
      cancelEdit()
      await load()
    } catch (err) {
      setError(errMsg(err, 'Saqlashda xatolik'))
    } finally {
      setSaving(false)
    }
  }

  const removeExam = async (e: MockExam) => {
    if (!confirm(`“${e.title}” o‘chirilsinmi?`)) return
    try {
      await mockExamsApi.remove(e.id)
      if (editing === e.id) cancelEdit()
      flash('Mock imtihon o‘chirildi.')
      await load()
    } catch (err) {
      setError(errMsg(err, 'O‘chirishda xatolik'))
    }
  }

  const saveSession = async (ev: FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload: ExamSessionCreateInput = {
        mock_exam_id: session.mock_exam_id,
        exam_date: new Date(session.exam_date).toISOString(),
        center_name: session.center_name || null,
        room_name: session.room_name || null,
        location_address: session.location_address,
        capacity: Number(session.capacity) || null,
        required_documents: session.required_documents,
        is_active: session.is_active,
        delivery_mode: session.delivery_mode as ExamSessionCreateInput['delivery_mode'],
      }
      await mockExamsApi.createSession(payload)
      flash('Imtihon sessiyasi yaratildi.')
      setSession(blankSession(session.mock_exam_id))
      await load()
    } catch (err) {
      setError(errMsg(err, 'Sessiyani yaratishda xatolik'))
    } finally {
      setSaving(false)
    }
  }

  const removeSession = async (s: ExamSession) => {
    if (!confirm('Sessiya o‘chirilsinmi? (faqat bo‘sh sessiyani o‘chirish mumkin)')) return
    try {
      await mockExamsApi.deleteSession(s.id)
      flash('Sessiya o‘chirildi.')
      await load()
    } catch (err) {
      setError(errMsg(err, 'Sessiyani o‘chirishda xatolik'))
    }
  }

  const examTitle = (id: string) => exams.find(e => e.id === id)?.title || id

  /* ───────── Render ───────── */

  return (
    <main className="container-shell space-y-6 py-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-3 text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mock imtihonlar</h1>
            <p className="text-sm text-muted-foreground">Imtihon yaratish, test biriktirish va sanalarni rejalashtirish</p>
          </div>
        </div>
        <button onClick={() => void load()} className={btnOutline + ' !px-3 !py-2 !text-sm'}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <nav className="flex gap-2 border-b border-border">
        {(
          [
            ['exams', 'Mock katalogi', null],
            ['sessions', 'Sanalar va sessiyalar', CalendarDays],
          ] as const
        ).map(([key, text, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold transition ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon && <Icon className="size-4" />}
            {text}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : tab === 'exams' ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Katalog */}
          <section className="space-y-3">
            {exams.map(e => (
              <article
                key={e.id}
                className={`${cardCls} p-4 transition ${editing === e.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold">{e.title}</h2>
                      <Badge active={e.is_active} on="Faol" off="Faol emas" />
                    </div>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {e.cefr_level} · {e.duration_minutes} daq · {Number(e.price).toLocaleString('uz-UZ')} so‘m
                    </p>
                    <p className="break-all text-[11px] text-muted-foreground/70">{e.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(e)} className={btnOutline}>
                      <Pencil className="size-3.5" />
                      Tahrirlash
                    </button>
                    <button
                      aria-label="O‘chirish"
                      onClick={() => void removeExam(e)}
                      className="rounded-lg border border-red-200 px-2.5 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {SKILLS.map(s => {
                    const id = e[s.key]
                    const title = id ? opts[s.bucket].find(o => o.id === id)?.title || id : undefined
                    return <SkillChip key={s.key} name={s.name} title={title} />
                  })}
                </div>
              </article>
            ))}
            {!exams.length && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Hozircha mock imtihonlar yo‘q.
              </p>
            )}
          </section>

          {/* Imtihon formasi */}
          <form onSubmit={saveExam} className={`${cardCls} space-y-4 p-5 xl:sticky xl:top-6`}>
            <h2 className="font-bold">{editing ? 'Mock imtihonni tahrirlash' : 'Yangi mock imtihon'}</h2>

            <Field label="Nomi *">
              <input required minLength={3} className={inputCls} value={form.title} onChange={e => setF('title', e.target.value)} />
            </Field>

            <Field label="Tavsif">
              <textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Daraja">
                <select className={inputCls} value={form.cefr_level} onChange={e => setF('cefr_level', e.target.value)}>
                  {LEVELS.map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Daqiqa">
                <input required type="number" min={1} className={inputCls} value={form.duration_minutes} onChange={e => setF('duration_minutes', Number(e.target.value))} />
              </Field>
            </div>

            <Field label="Narxi (so‘m)">
              <input required type="number" min={0} className={inputCls} value={form.price} onChange={e => setF('price', Number(e.target.value))} />
            </Field>

            <fieldset className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <legend className="px-1 text-sm font-bold">Testlarni biriktirish</legend>
              {SKILLS.map(s => (
                <Field key={s.key} label={s.name}>
                  <select required className={inputCls} value={form[s.key]} onChange={e => setF(s.key, e.target.value)}>
                    <option value="">Testni tanlang</option>
                    {opts[s.bucket].map(o => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={form.is_active} onChange={e => setF('is_active', e.target.checked)} />
              Faol holatda
            </label>

            <div className="flex gap-2">
              <button disabled={saving} className={`${btnPrimary} flex-1`}>
                {editing ? <Save className="size-4" /> : <Plus className="size-4" />}
                {saving ? 'Saqlanmoqda…' : editing ? 'Saqlash' : 'Yaratish'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="rounded-lg border border-border px-4 text-sm transition hover:bg-muted">
                  Bekor
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          {/* Sessiya formasi */}
          <form onSubmit={saveSession} className={`${cardCls} space-y-4 p-5 xl:sticky xl:top-6`}>
            <h2 className="font-bold">Yangi sana / sessiya</h2>

            <Field label="Mock imtihon *">
              <select required className={inputCls} value={session.mock_exam_id} onChange={e => setS('mock_exam_id', e.target.value)}>
                <option value="">Tanlang</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sana va vaqt *">
              <input required type="datetime-local" className={inputCls} value={session.exam_date} onChange={e => setS('exam_date', e.target.value)} />
            </Field>

            <Field label="Topshirish usuli *">
              <select required className={inputCls} value={session.delivery_mode} onChange={e => setS('delivery_mode', e.target.value as DeliveryMode)}>
                {(Object.keys(DELIVERY_LABEL) as DeliveryMode[]).map(m => (
                  <option key={m} value={m}>
                    {DELIVERY_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Markaz nomi">
                <input className={inputCls} value={session.center_name} onChange={e => setS('center_name', e.target.value)} />
              </Field>
              <Field label="Xona">
                <input className={inputCls} value={session.room_name} onChange={e => setS('room_name', e.target.value)} />
              </Field>
            </div>

            <Field label="Manzil *">
              <input required className={inputCls} value={session.location_address} onChange={e => setS('location_address', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Sig‘im">
                <input type="number" min={1} className={inputCls} value={session.capacity} onChange={e => setS('capacity', Number(e.target.value))} />
              </Field>
              <Field label="Kerakli hujjatlar">
                <input className={inputCls} value={session.required_documents} onChange={e => setS('required_documents', e.target.value)} />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={session.is_active} onChange={e => setS('is_active', e.target.checked)} />
              Ro‘yxatdan o‘tish faol
            </label>

            <button disabled={saving || !exams.length} className={`${btnPrimary} w-full`}>
              <Plus className="size-4" />
              {saving ? 'Saqlanmoqda…' : 'Sessiya yaratish'}
            </button>
          </form>

          {/* Sessiyalar ro‘yxati */}
          <section className="space-y-3">
            <h2 className="font-bold">Rejalashtirilgan sessiyalar ({sessions.length})</h2>
            {sessions.map(s => {
              const mode = (s as ExamSession & { delivery_mode?: DeliveryMode }).delivery_mode
              const registered = s.registered_count || 0
              return (
                <article key={s.id} className={`${cardCls} p-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{examTitle(s.mock_exam_id)}</h3>
                        <Badge active={s.is_active} on="Faol" off="Yopiq" />
                        {mode && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {DELIVERY_LABEL[mode] ?? mode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium">{new Date(s.exam_date).toLocaleString('uz-UZ')}</p>
                    </div>
                    <button
                      aria-label="Sessiyani o‘chirish"
                      disabled={registered > 0}
                      title={registered > 0 ? 'Ro‘yxatdan o‘tganlar bor — o‘chirib bo‘lmaydi' : undefined}
                      onClick={() => void removeSession(s)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-4 shrink-0" />
                      <span>
                        {s.center_name || 'Markaz belgilanmagan'}
                        {s.room_name ? ` · ${s.room_name}` : ''}
                        {s.location_address ? ` — ${s.location_address}` : ''}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="size-4 shrink-0" />
                      {registered} / {s.capacity ?? '∞'} joy
                    </p>
                  </div>
                </article>
              )
            })}
            {!sessions.length && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Hali sessiya yo‘q.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  )
}