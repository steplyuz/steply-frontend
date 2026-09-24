/**
 * app/admin/reading/page.tsx
 * ==========================
 * Admin — CEFR Reading testlari ro'yxati va yangi test yaratish.
 * Har bir test kartasi: holat (DRAFT/LOCKED), qismlar/savollar soni,
 * tahrirlash havolasi, paper PDF va OMR javob varag'ini yuklab olish.
 */
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, ChevronRight, FileDown, Plus, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { readingApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { ReadingTest } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

const READING_JSON_TEMPLATE = `{
  "title": "Reading B1 #1",
  "cefr_level": "B1",
  "language": "en",
  "duration_minutes": 60,
  "parts": [
    {
      "title": "Part 1",
      "description": "Read the text and answer the questions.",
      "passage": "Your passage text...",
      "questions": [
        {
          "question_number": 1,
          "type": "MULTIPLE_CHOICE",
          "text": "What is the main idea?",
          "word_limit": 0,
          "correct_answer": ["A"],
          "options": [
            {"label": "A", "value": "First option"},
            {"label": "B", "value": "Second option"}
          ]
        }
      ]
    }
  ]
}`

const EMPTY_FORM = {
  title: '',
  cefr_level: 'B1',
  language: 'en',
  duration_minutes: 60,
}

export default function AdminReadingListPage() {
  const { user, isLoading } = useAuth()
  const [tests, setTests] = useState<ReadingTest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const isAdmin = user?.global_role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  async function load() {
    try { setTests(await readingApi.getAll()) }
    catch { setTests([]) }
  }

  const jsonInputRef = useRef<HTMLInputElement>(null)

  async function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setSaving(true)
    setError(null)
    try {
      const raw = JSON.parse(await file.text())
      const data = raw?.exam ?? raw
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('JSON root object bo‘lishi kerak.')
      }
      if (!String(data.title ?? '').trim()) throw new Error('title majburiy.')
      if (!String(data.cefr_level ?? '').trim()) throw new Error('cefr_level majburiy.')
      if (!Array.isArray(data.parts)) throw new Error('parts array bo‘lishi kerak.')

      const normalized = {
        title: String(data.title).trim(),
        cefr_level: String(data.cefr_level),
        language: String(data.language ?? 'en'),
        duration_minutes: Number(data.duration_minutes ?? 60),
        total_questions: data.total_questions == null
          ? data.parts.reduce((n: number, p: any) => n + (Array.isArray(p?.questions) ? p.questions.length : 0), 0)
          : Number(data.total_questions),
        is_demo: Boolean(data.is_demo ?? false),
        is_free: Boolean(data.is_free ?? false),
        is_mock: Boolean(data.is_mock ?? false),
        is_active: Boolean(data.is_active ?? true),
        parts: data.parts,
      }

      if (!Number.isFinite(normalized.duration_minutes) || normalized.duration_minutes < 1) {
        throw new Error('duration_minutes noto‘g‘ri.')
      }

      await readingApi.create(normalized)
      await load()
      setShowForm(false)
    } catch (err) {
      if (err instanceof SyntaxError) setError('JSON fayl formati noto‘g‘ri.')
      else setError(err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : 'JSON importda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await readingApi.create({
        title: form.title.trim(),
        cefr_level: form.cefr_level,
        language: form.language,
        duration_minutes: Number(form.duration_minutes),
        parts: [],
      })
      await load()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Test yaratishda xatolik')
    } finally { setSaving(false) }
  }

  async function handleRemove(id: string) {
    if (!confirm(`"${id}" Reading testini butunlay o'chirishni tasdiqlaysizmi?`)) return
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await readingApi.remove(id)
      setTests(prev => prev?.filter(t => t.id !== id) ?? null)
    } catch {
      setError("O'chirishda xatolik")
    } finally { setBusy(b => ({ ...b, [id]: false })) }
  }

  async function dl(url: string, filename: string) {
    setBusy(b => ({ ...b, [filename]: true }))
    await authenticatedDownload(url, { filename, onError: setError })
    setBusy(b => ({ ...b, [filename]: false }))
  }

  if (isLoading) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  )
  if (!isAdmin) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administratorlar kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
    </div>
  )

  return (
    <main className="container-shell py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <BookOpen className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reading testlari</h1>
        </div>
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
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Yangi test
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-bold">Yangi Reading test</h2><p className="mb-5 text-sm text-muted-foreground">To‘liq testni JSON orqali ham bir martada import qilishingiz mumkin.</p>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label-xs">Sarlavha *</span>
              <input required minLength={3} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Reading Test #1" className="field" />
            </label>
            <label className="block">
              <span className="label-xs">CEFR darajasi *</span>
              <select value={form.cefr_level} onChange={e => setForm(f => ({ ...f, cefr_level: e.target.value }))} className="field">
                {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label-xs">Davomiyligi (daqiqa)</span>
              <input type="number" min={10} max={180} value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="field" />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">
                Bekor
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? 'Yaratilmoqda...' : "Yaratish va qismlar qo'shishga o'tish"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {tests === null ? (
          <p className="py-6 text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>
        ) : tests.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            Hozircha Reading testlar yo'q. "Yangi test" tugmasini bosing.
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(t => {
              const qCount = t.parts?.reduce((n, p) => n + (p.questions?.length ?? 0), 0) ?? 0
              return (
                <div key={t.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/reading/${t.id}`} className="text-sm font-semibold hover:underline truncate block">
                      {t.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.id} · {t.cefr_level} · {t.parts?.length ?? 0} qism · {qCount} savol · {t.duration_minutes} daq
                      {!t.is_active && <span className="ml-1.5 text-red-500">· Nofaol</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => dl(readingApi.paperPdfUrl(t.id), `${t.id}-paper.pdf`)}
                      disabled={!!busy[`${t.id}-paper.pdf`]}
                      title="Savol qog'ozi (PDF)"
                      className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <FileDown className="size-3" /> Paper
                    </button>
                    <button
                      onClick={() => dl(readingApi.answerSheetUrl(t.id), `${t.id}-answer-sheet.pdf`)}
                      disabled={!!busy[`${t.id}-answer-sheet.pdf`]}
                      title="OMR javob varag'i"
                      className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <FileDown className="size-3" /> OMR
                    </button>
                    <Link
                      href={`/admin/reading/${t.id}`}
                      className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-semibold text-primary hover:bg-secondary"
                    >
                      Tahrirlash <ChevronRight className="size-3" />
                    </Link>
                    <button
                      onClick={() => handleRemove(t.id)}
                      disabled={!!busy[t.id]}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">JSON format</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          To‘liq Reading testini bitta JSON fayl orqali import qilish mumkin.
          <code>id</code> yuborilmaydi — backend avtomatik ID beradi.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-4 text-xs">{READING_JSON_TEMPLATE}</pre>
      </div>
    </main>
  )
}
