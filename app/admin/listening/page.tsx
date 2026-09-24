/**
 * app/admin/listening/page.tsx
 * =============================
 * Admin — CEFR Listening testlari ro'yxati va yangi test yaratish.
 */
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, FileDown, Headphones, Plus, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { listeningApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { ListeningTest } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

const LISTENING_JSON_TEMPLATE = `{
  "title": "Listening B1 #1",
  "level": "B1",
  "duration": 35,
  "audio_mode": "PARTS",
  "audio_url": null,
  "sections": "Part 1 | Part 2 | Part 3",
  "parts": [
    {
      "part_number": 1,
      "title": "Part 1",
      "instruction": "Listen and answer the questions.",
      "task_type": "MULTIPLE_CHOICE",
      "audio_url": "/static/listening_audio/part-1.mp3",
      "context": "",
      "passage": "",
      "map_image": "",
      "questions": [
        {
          "question_number": 1,
          "type": "MULTIPLE_CHOICE",
          "question": "Where does the conversation take place?",
          "correct_answer": "A",
          "options": [
            {"label": "A", "value": "First option"},
            {"label": "B", "value": "Second option"},
            {"label": "C", "value": "Third option"},
            {"label": "D", "value": "Fourth option"}
          ]
        }
      ]
    }
  ]
}`

const EMPTY_FORM = {
  title: '',
  level: 'B1',
  duration: 35,
}

export default function AdminListeningListPage() {
  const { user, isLoading } = useAuth()
  const [tests, setTests] = useState<ListeningTest[] | null>(null)
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
    try { setTests(await listeningApi.getAll()) }
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
      if (!String(data.level ?? '').trim()) throw new Error('level majburiy.')
      if (!Array.isArray(data.parts)) throw new Error('parts array bo‘lishi kerak.')

      const totalQuestions = data.total_questions == null
        ? data.parts.reduce((n: number, p: any) => n + (Array.isArray(p?.questions) ? p.questions.length : 0), 0)
        : Number(data.total_questions)

      const sections = String(
        data.sections ??
        data.parts.map((p: any) => p?.title).filter(Boolean).join(' | ') ??
        ''
      )

      const audioMode: 'EXAM' | 'PARTS' = data.audio_mode === 'EXAM' ? 'EXAM' : 'PARTS'
      const parts = data.parts.map((p: any, pIndex: number) => ({
        ...p,
        part_number: Number(p.part_number ?? pIndex + 1),
        audio_url: p.audio_url ?? p.audio_label ?? null,
        questions: Array.isArray(p.questions) ? p.questions.map((q: any) => ({
          ...q,
          question: q.question ?? q.text ?? '',
          options: Array.isArray(q.options) ? q.options.map((o: any, i: number) =>
            typeof o === 'string' ? { label: String.fromCharCode(65 + i), value: o } : o
          ) : [],
        })) : [],
        options: Array.isArray(p.options) ? p.options.map((o: any, i: number) =>
          typeof o === 'string' ? { label: String.fromCharCode(65 + i), value: o } : o
        ) : [],
      }))

      const normalized = {
        title: String(data.title).trim(),
        level: String(data.level),
        duration: Number(data.duration ?? 35),
        total_questions: parts.reduce((n: number, p: any) => n + p.questions.length, 0),
        sections,
        audio_mode: audioMode,
        audio_url: data.audio_url ?? null,
        is_demo: Boolean(data.is_demo ?? false),
        is_free: Boolean(data.is_free ?? false),
        is_mock: Boolean(data.is_mock ?? false),
        is_active: Boolean(data.is_active ?? true),
        parts,
      }

      if (!Number.isFinite(normalized.duration) || normalized.duration < 1) {
        throw new Error('duration noto‘g‘ri.')
      }
      if (!Number.isInteger(normalized.total_questions) || normalized.total_questions < 0) {
        throw new Error('total_questions noto‘g‘ri.')
      }

      await listeningApi.create(normalized)
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
      await listeningApi.create({
        title: form.title.trim(),
        level: form.level,
        duration: Number(form.duration),
        total_questions: 0,
        sections: '',
        audio_mode: 'PARTS',
        audio_url: null,
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
    if (!confirm(`"${id}" Listening testini butunlay o'chirishni tasdiqlaysizmi?`)) return
    setBusy(b => ({ ...b, [id]: true }))
    try {
      await listeningApi.remove(id)
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
            <Headphones className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Listening testlari</h1>
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
          <h2 className="mb-2 font-bold">Yangi Listening test</h2><p className="mb-5 text-sm text-muted-foreground">To‘liq testni JSON orqali ham bir martada import qilishingiz mumkin.</p>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label-xs">Sarlavha *</span>
              <input required minLength={3} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Listening Test #1" className="field" />
            </label>
            <label className="block">
              <span className="label-xs">CEFR darajasi *</span>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="field">
                {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label-xs">Davomiyligi (daqiqa)</span>
              <input type="number" min={10} max={90} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className="field" />
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
            Hozircha Listening testlar yo'q. "Yangi test" tugmasini bosing.
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(t => {
              const qCount = t.parts?.reduce((n, p) => n + (p.questions?.length ?? 0), 0) ?? 0
              return (
                <div key={t.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/listening/${t.id}`} className="text-sm font-semibold hover:underline truncate block">
                      {t.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.id} · {t.level} · {t.parts?.length ?? 0} qism · {qCount} savol · {t.duration} daq
                      {!t.is_active && <span className="ml-1.5 text-red-500">· Nofaol</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => dl(listeningApi.paperPdfUrl(t.id), `${t.id}-paper.pdf`)}
                      disabled={!!busy[`${t.id}-paper.pdf`]}
                      title="Savol qog'ozi (PDF)"
                      className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <FileDown className="size-3" /> Paper
                    </button>
                    <button
                      onClick={() => dl(listeningApi.answerSheetUrl(t.id), `${t.id}-answer-sheet.pdf`)}
                      disabled={!!busy[`${t.id}-answer-sheet.pdf`]}
                      title="OMR javob varag'i"
                      className="flex h-8 items-center gap-1 rounded border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <FileDown className="size-3" /> OMR
                    </button>
                    <Link
                      href={`/admin/listening/${t.id}`}
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
          To‘liq Listening testini bitta JSON fayl orqali import qilish mumkin.
          <code>id</code> yuborilmaydi — backend avtomatik ID beradi.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-4 text-xs">{LISTENING_JSON_TEMPLATE}</pre>
      </div>
    </main>
  )
}
