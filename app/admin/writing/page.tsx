'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { writingApi, mockCenterApi } from '@/lib/api/endpoints'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'
import type { WritingExam, WritingPendingItem } from '@/lib/api/types'

const CEFR_LEVELS = ['B1', 'B2', 'C1']

const EMPTY_FORM = {
  title: '',
  cefr_level: 'B1',
  duration_minutes: 60,
}

export default function AdminWritingPage() {
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<'grading' | 'tests'>('grading')
  const [tests, setTests] = useState<WritingExam[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // --- Baholash navbati (qog'ozdagi insho) ---
  const [queueStatus, setQueueStatus] = useState<'pending' | 'graded'>('pending')
  const [queue, setQueue] = useState<WritingPendingItem[] | null>(null)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, string>>({})
  const [scoringId, setScoringId] = useState<number | null>(null)

  const isAdmin = user?.global_role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    loadQueue()
  }, [isAdmin, queueStatus])

  async function loadQueue() {
    setQueueError(null)
    try {
      setQueue(await mockCenterApi.writingPending(queueStatus))
    } catch (err) {
      setQueue([])
      setQueueError(err instanceof ApiRequestError ? err.message : 'Ro‘yxatni yuklashda xatolik')
    }
  }

  async function submitScore(item: WritingPendingItem) {
    const raw = scoreDrafts[item.skill_attempt_id]
    const score = Number(raw)
    if (!raw || Number.isNaN(score) || score < 0 || score > 75) {
      setQueueError('Ball 0–75 oralig‘ida bo‘lishi kerak.')
      return
    }
    setScoringId(item.skill_attempt_id)
    setQueueError(null)
    try {
      await mockCenterApi.scoreSkill(item.attempt_id, 'WRITING', score)
      setQueue(prev => prev?.filter((x: WritingPendingItem) => x.skill_attempt_id !== item.skill_attempt_id) ?? null)
      setMessage(`${item.full_name} uchun Writing bahosi (${score}) saqlandi.`)
    } catch (err) {
      setQueueError(err instanceof ApiRequestError ? err.message : 'Bahoni saqlashda xatolik')
    } finally {
      setScoringId(null)
    }
  }

  async function load() {
    try {
      setTests(await writingApi.getAll())
    } catch {
      setTests([])
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await writingApi.create({
        title: form.title.trim(),
        cefr_level: form.cefr_level,
        duration_minutes: Number(form.duration_minutes),
        tasks: [],
      })
      await load()
      setShowForm(false)
      setForm(EMPTY_FORM)
      setMessage('Writing testi yaratildi. Endi tasklarni JSON orqali yoki editor orqali to‘ldirishingiz mumkin.')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Test yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const raw = JSON.parse(await file.text())
      const data = raw?.exam ?? raw

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('JSON root object bo‘lishi kerak.')
      }
      if (!String(data.title ?? '').trim()) throw new Error('title majburiy.')
      if (!['B1', 'B2', 'C1'].includes(String(data.cefr_level))) {
        throw new Error('cefr_level faqat B1, B2 yoki C1 bo‘lishi kerak.')
      }
      if (!Array.isArray(data.tasks)) throw new Error('tasks array bo‘lishi kerak.')

      const seen = new Set<string>()
      for (const task of data.tasks) {
        if (!task || typeof task !== 'object') throw new Error('Har bir task object bo‘lishi kerak.')
        if (!Number.isInteger(Number(task.part_number)) || Number(task.part_number) < 1) {
          throw new Error('Har bir task uchun part_number >= 1 bo‘lishi kerak.')
        }
        const key = `${Number(task.part_number)}:${task.sub_part == null ? '' : Number(task.sub_part)}`
        if (seen.has(key)) throw new Error(`Bir xil task structure mavjud: ${key}`)
        seen.add(key)

        if (!String(task.topic ?? '').trim()) throw new Error('Har bir task uchun topic majburiy.')
        if (!String(task.instruction ?? '').trim()) throw new Error('Har bir task uchun instruction majburiy.')
        if (task.format_id != null && (!Number.isInteger(Number(task.format_id)) || Number(task.format_id) < 1)) {
          throw new Error('format_id berilsa, u musbat integer bo‘lishi kerak.')
        }
        if (task.word_limit != null && typeof task.word_limit !== 'number' && (typeof task.word_limit !== 'object' || task.word_limit.min == null || task.word_limit.max == null)) {
          throw new Error('word_limit son yoki {min,max} object bo‘lishi kerak.')
        }
      }

      const payload = {
        title: String(data.title).trim(),
        cefr_level: String(data.cefr_level),
        duration_minutes: Number(data.duration_minutes ?? 60),
        is_demo: Boolean(data.is_demo ?? false),
        is_free: Boolean(data.is_free ?? false),
        is_mock: Boolean(data.is_mock ?? false),
        is_active: Boolean(data.is_active ?? true),
        tasks: data.tasks,
      }

      if (!Number.isInteger(payload.duration_minutes) || payload.duration_minutes < 10 || payload.duration_minutes > 240) {
        throw new Error('duration_minutes 10–240 oralig‘ida integer bo‘lishi kerak.')
      }

      await writingApi.create(payload)
      await load()
      setShowForm(false)
      setMessage('Writing testi JSON orqali muvaffaqiyatli qo‘shildi.')
    } catch (err) {
      if (err instanceof SyntaxError) setError('JSON fayl formati noto‘g‘ri.')
      else setError(err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : 'JSON importda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm(`"${id}" Writing testini butunlay o‘chirishni tasdiqlaysizmi?`)) return

    setBusy(b => ({ ...b, [id]: true }))
    setError(null)
    try {
      await writingApi.remove(id)
      setTests(prev => prev?.filter(t => t.id !== id) ?? null)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'O‘chirishda xatolik')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="font-semibold">Bu bo‘limga faqat administratorlar kira oladi.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
      </div>
    )
  }

  return (
    <main className="container-shell py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-xl font-bold tracking-tight">Writing</h1>
        </div>

        {tab === 'tests' && (
        <div className="flex items-center gap-2">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleJsonUpload}
          />
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Upload className="size-4" /> JSON import
          </button>

          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Yangi test
          </button>
        </div>
        )}
      </div>

      <div className="flex gap-1 border-b">
        {([
          ['grading', 'Baholash (qog‘ozdagi insho)'],
          ['tests', 'Testlar (topshiriqlar banki)'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg border bg-muted px-4 py-3 text-sm">{message}</p>}

      {tab === 'grading' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {([
              ['pending', 'Kutilmoqda'],
              ['graded', 'Baholangan'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setQueueStatus(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  queueStatus === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {queueError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{queueError}</p>}

          <div className="rounded-xl border bg-card overflow-hidden">
            {queue === null ? (
              <p className="p-5 text-sm text-muted-foreground">Yuklanmoqda...</p>
            ) : queue.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                {queueStatus === 'pending' ? 'Hozircha baholanishi kerak bo‘lgan insho yo‘q.' : 'Hali baholangan insho yo‘q.'}
              </p>
            ) : (
              <div className="divide-y">
                {queue.map(item => (
                  <div key={item.skill_attempt_id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.full_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.student_id ?? '—'} · {item.mock_exam_title}
                        {item.exam_date ? ` · ${new Date(item.exam_date).toLocaleDateString('uz-UZ')}` : ''}
                      </p>
                    </div>

                    {item.is_checked ? (
                      <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-primary">
                        {item.scaled_score.toFixed(1)} ball
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={75}
                          step={0.5}
                          placeholder="Ball (0–75)"
                          value={scoreDrafts[item.skill_attempt_id] ?? ''}
                          onChange={e => setScoreDrafts(d => ({ ...d, [item.skill_attempt_id]: e.target.value }))}
                          className="field w-32"
                        />
                        <button
                          type="button"
                          onClick={() => submitScore(item)}
                          disabled={scoringId === item.skill_attempt_id}
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {scoringId === item.skill_attempt_id ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'tests' && (
      <>
      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-bold">Yangi Writing test</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Bo‘sh test yaratadi. To‘liq testni esa JSON import bilan bir martada qo‘shish tavsiya qilinadi.
          </p>

          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="label-xs">Sarlavha *</span>
              <input
                required
                minLength={3}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Writing Test #1"
                className="field"
              />
            </label>

            <label className="block">
              <span className="label-xs">CEFR *</span>
              <select value={form.cefr_level} onChange={e => setForm(f => ({ ...f, cefr_level: e.target.value }))} className="field">
                {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="label-xs">Davomiyligi (daqiqa)</span>
              <input
                type="number"
                min={10}
                max={240}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="field"
              />
            </label>

            <div className="flex items-end sm:col-span-2">
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? 'Saqlanmoqda...' : 'Yaratish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Mavjud testlar</h2>
        </div>

        {tests === null ? (
          <p className="p-5 text-sm text-muted-foreground">Yuklanmoqda...</p>
        ) : tests.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Hozircha Writing testi yo‘q.</p>
        ) : (
          <div className="divide-y">
            {tests.map(test => (
              <div key={test.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <span className="font-semibold">{test.title}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {test.id} · {test.cefr_level} · {test.tasks?.length ?? 0} task · {test.duration_minutes} daqiqa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(test.id)}
                  disabled={busy[test.id]}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                  title="O‘chirish"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">JSON format</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Writing tasklari uchun <code>format_id</code> backendda oldindan yaratilgan Writing Format ID bo‘lishi kerak.
          JSON import test va barcha tasklarni bitta API request bilan yaratadi.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-4 text-xs">{`{
  "title": "Writing B1 #1",
  "cefr_level": "B1",
  "duration_minutes": 60,
  "tasks": [
    {
      "part_number": 1,
      "sub_part": 1,
      "topic": "Email to a friend",
      "instruction": "Write an email to your friend.",
      "context_text": "You are planning a trip.",
      "format_id": 1
    },
    {
      "part_number": 1,
      "sub_part": 2,
      "topic": "Short message",
      "instruction": "Write a short message.",
      "format_id": 1
    },
    {
      "part_number": 2,
      "topic": "Opinion essay",
      "instruction": "Write an essay discussing both sides.",
      "format_id": 2
    }
  ]
}`}</pre>
      </div>
      </>
      )}
    </main>
  )
}
