/**
 * app/admin/reading/[id]/page.tsx
 * ================================
 * Admin — Reading test tahrirlash.
 * Savollarni 3 xil usulda qo'shish:
 *   1. Oddiy — forma orqali bitta savol
 *   2. JSON  — to'g'ridan-to'g'ri JSON kiritish
 *   3. Shablon — tez tanlash uchun tayyor shablonlar
 */
'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, Braces, FileDown, FileText,
  Layout, Lock, Plus, Save, ShieldAlert, Trash2, Unlock, X,
} from 'lucide-react'
import { readingApi } from '@/lib/api/endpoints'
import { authenticatedDownload } from '@/lib/api/download'
import type { ReadingPart, ReadingQuestion, ReadingTest, ExamVersion } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'
import { READING_QUESTION_TYPES, READING_LANGUAGES } from '@/lib/cefr-question-types'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

// ─── Savol shablonlari ─────────────────────────────────────────────────────
const Q_TEMPLATES: { label: string; desc: string; q: Partial<ReadingQuestion> }[] = [
  {
    label: 'Gap Fill (to\'ldirish)',
    desc: 'Matndan so\'z topib bo\'sh joyga yozish',
    q: { type: 'GAP_FILL', text: 'Complete the sentence using NO MORE THAN TWO WORDS from the passage.', word_limit: 2, correct_answer: [], options: [] },
  },
  {
    label: 'Multiple Choice (A-D)',
    desc: '4 variantdan birini tanlash',
    q: {
      type: 'MULTIPLE_CHOICE', text: 'According to the passage, which statement is correct?', word_limit: null,
      correct_answer: ['A'],
      options: [
        { label: 'A', value: '' },
        { label: 'B', value: '' },
        { label: 'C', value: '' },
        { label: 'D', value: '' },
      ],
    },
  },
  {
    label: 'True / False / Not Given',
    desc: 'Bayonot to\'g\'ri, noto\'g\'ri yoki matnda yo\'qmi',
    q: {
      type: 'TRUE_FALSE_NOT_GIVEN', text: '', word_limit: null,
      correct_answer: ['TRUE'],
      options: [
        { label: 'TRUE', value: 'TRUE' },
        { label: 'FALSE', value: 'FALSE' },
        { label: 'NOT GIVEN', value: 'NOT_GIVEN' },
      ],
    },
  },
  {
    label: 'Headings Match',
    desc: 'Qism sarlavhasini paragrafga moslashtirish',
    q: { type: 'HEADINGS_MATCH', text: 'Choose the correct heading for the paragraph from the list below.', word_limit: null, correct_answer: [], options: [] },
  },
  {
    label: 'Multiple Select',
    desc: 'Bir nechta to\'g\'ri javob tanlash',
    q: {
      type: 'MULTIPLE_SELECT', text: 'Choose TWO correct statements from the following.', word_limit: null,
      correct_answer: [],
      options: [
        { label: 'A', value: '' },
        { label: 'B', value: '' },
        { label: 'C', value: '' },
        { label: 'D', value: '' },
        { label: 'E', value: '' },
      ],
    },
  },
]

type AddMode = 'simple' | 'json' | 'template'

function emptyQuestion(num: number): ReadingQuestion {
  return { question_number: num, type: 'GAP_FILL', text: '', word_limit: null, correct_answer: [], options: [] }
}
function emptyPart(): ReadingPart {
  return { title: '', description: '', passage: '', questions: [] }
}

// ─── Add Question Modal ────────────────────────────────────────────────────
interface AddModalProps {
  partIdx: number
  nextNum: number
  onAdd: (partIdx: number, q: ReadingQuestion) => void
  onClose: () => void
}

function AddQuestionModal({ partIdx, nextNum, onAdd, onClose }: AddModalProps) {
  const [mode, setMode] = useState<AddMode>('simple')

  // Simple mode state
  const [simple, setSimple] = useState<ReadingQuestion>(emptyQuestion(nextNum))

  // JSON mode state
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(emptyQuestion(nextNum), null, 2)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  function handleSimpleSubmit() {
    onAdd(partIdx, simple)
    onClose()
  }

  function handleJsonSubmit() {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed.type || typeof parsed.question_number !== 'number') {
        setJsonError('type va question_number majburiy maydonlar')
        return
      }
      onAdd(partIdx, { correct_answer: [], options: [], ...parsed })
      onClose()
    } catch (e) {
      setJsonError('JSON formatida xatolik: ' + (e as Error).message)
    }
  }

  function handleTemplateSelect(tq: Partial<ReadingQuestion>) {
    const q: ReadingQuestion = {
      question_number: nextNum,
      type: tq.type ?? 'GAP_FILL',
      text: tq.text ?? '',
      word_limit: tq.word_limit ?? null,
      correct_answer: tq.correct_answer ?? [],
      options: tq.options ?? [],
    }
    onAdd(partIdx, q)
    onClose()
  }

  const tabs: { id: AddMode; icon: React.ElementType; label: string }[] = [
    { id: 'simple', icon: FileText, label: 'Oddiy' },
    { id: 'json', icon: Braces, label: 'JSON' },
    { id: 'template', icon: Layout, label: 'Shablon' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-sm">Savol qo'shish — Part {partIdx + 1}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                mode === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">

          {/* ── ODDIY USUL ── */}
          {mode === 'simple' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label-xs">Savol raqami</span>
                  <input
                    type="number" min={1}
                    value={simple.question_number}
                    onChange={e => setSimple(s => ({ ...s, question_number: Number(e.target.value) }))}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label-xs">Turi</span>
                  <select
                    value={simple.type}
                    onChange={e => setSimple(s => ({ ...s, type: e.target.value }))}
                    className="field"
                  >
                    {READING_QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="label-xs">Savol matni</span>
                <textarea
                  rows={3}
                  value={simple.text}
                  onChange={e => setSimple(s => ({ ...s, text: e.target.value }))}
                  placeholder="Savol matnini kiriting..."
                  className="field resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label-xs">So'z limiti (ixtiyoriy)</span>
                  <input
                    type="number" min={0}
                    value={simple.word_limit ?? ''}
                    onChange={e => setSimple(s => ({ ...s, word_limit: e.target.value ? Number(e.target.value) : null }))}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label-xs">To'g'ri javob(lar)</span>
                  <input
                    value={(simple.correct_answer ?? []).join(', ')}
                    onChange={e => setSimple(s => ({
                      ...s,
                      correct_answer: e.target.value.split(',').map(x => x.trim()).filter(Boolean)
                    }))}
                    placeholder="A, yoki to'g'ri so'z"
                    className="field"
                  />
                </label>
              </div>

              {/* Variantlar */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-xs">Variantlar (ko'p tanlovli uchun)</span>
                  <button
                    type="button"
                    onClick={() => setSimple(s => ({ ...s, options: [...(s.options ?? []), { label: '', value: '' }] }))}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + variant
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {(simple.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={opt.label}
                        onChange={e => {
                          const opts = [...(simple.options ?? [])]
                          opts[i] = { ...opts[i], label: e.target.value }
                          setSimple(s => ({ ...s, options: opts }))
                        }}
                        placeholder="A"
                        className="w-14 rounded-lg border px-2 py-1.5 text-sm"
                      />
                      <input
                        value={opt.value}
                        onChange={e => {
                          const opts = [...(simple.options ?? [])]
                          opts[i] = { ...opts[i], value: e.target.value }
                          setSimple(s => ({ ...s, options: opts }))
                        }}
                        placeholder="Variant matni..."
                        className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setSimple(s => ({ ...s, options: (s.options ?? []).filter((_, j) => j !== i) }))}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── JSON USUL ── */}
          {mode === 'json' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Savolni JSON formatida kiriting. <code className="bg-muted rounded px-1">question_number</code> va{' '}
                <code className="bg-muted rounded px-1">type</code> majburiy.
              </p>
              <textarea
                rows={16}
                value={jsonText}
                onChange={e => { setJsonText(e.target.value); setJsonError(null) }}
                spellCheck={false}
                className="field font-mono text-xs resize-none"
              />
              {jsonError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {jsonError}
                </p>
              )}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium hover:text-foreground">JSON namuna ko'rish</summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-[11px]">{`{
  "question_number": ${nextNum},
  "type": "MULTIPLE_CHOICE",
  "text": "Which statement is correct?",
  "word_limit": null,
  "correct_answer": ["A"],
  "options": [
    { "label": "A", "value": "The river flows north." },
    { "label": "B", "value": "The river flows south." }
  ]
}`}</pre>
              </details>
            </div>
          )}

          {/* ── SHABLON USUL ── */}
          {mode === 'template' && (
            <div className="space-y-2">
              <p className="mb-3 text-xs text-muted-foreground">
                Shablon tanlang — savol raqami avtomatik qo'yiladi, maydonlarni keyinchalik to'ldirasiz.
              </p>
              {Q_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.q)}
                  className="w-full text-left rounded-xl border bg-background px-4 py-3.5 hover:border-primary/50 hover:bg-primary/4 transition-colors group"
                >
                  <p className="text-sm font-semibold group-hover:text-primary">{tpl.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tpl.desc}</p>
                  <p className="mt-1.5 text-[10px] font-mono text-muted-foreground/60">{tpl.q.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode !== 'template' && (
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={mode === 'json' ? handleJsonSubmit : handleSimpleSubmit}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Qo'shish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminReadingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = use(params)
  const { user, isLoading } = useAuth()
  const [test, setTest] = useState<ReadingTest | null>(null)
  const [versions, setVersions] = useState<ExamVersion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lockErrors, setLockErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  // Modal state
  const [addModal, setAddModal] = useState<{ partIdx: number } | null>(null)

  const isAdmin = user?.global_role === 'admin'
  const latestVersion = versions[0]
  const isLocked = !!latestVersion?.is_locked

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  async function load() {
    try {
      const [t, v] = await Promise.all([
        readingApi.get(testId),
        readingApi.versions(testId).catch(() => []),
      ])
      setTest({ ...t, parts: t.parts?.length ? t.parts : [] })
      setVersions(v)
    } catch {
      setError('Testni yuklab bo\'lmadi')
    }
  }

  function updateTest<K extends keyof ReadingTest>(key: K, value: ReadingTest[K]) {
    setTest(t => (t ? { ...t, [key]: value } : t))
  }
  function updatePart(idx: number, patch: Partial<ReadingPart>) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      parts[idx] = { ...parts[idx], ...patch }
      return { ...t, parts }
    })
  }
  function addPart() {
    setTest(t => (t ? { ...t, parts: [...t.parts, emptyPart()] } : t))
  }
  function removePart(idx: number) {
    if (!confirm("Bu qismni savollari bilan birga o'chirasizmi?")) return
    setTest(t => (t ? { ...t, parts: t.parts.filter((_, i) => i !== idx) } : t))
  }

  // Modal orqali savol qo'shish
  function handleAddQuestion(partIdx: number, q: ReadingQuestion) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      parts[partIdx] = { ...parts[partIdx], questions: [...parts[partIdx].questions, q] }
      return { ...t, parts }
    })
  }

  function updateQuestion(partIdx: number, qIdx: number, patch: Partial<ReadingQuestion>) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...questions[qIdx], ...patch }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }
  function removeQuestion(partIdx: number, qIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      parts[partIdx] = { ...parts[partIdx], questions: parts[partIdx].questions.filter((_, i) => i !== qIdx) }
      return { ...t, parts }
    })
  }
  function addOption(partIdx: number, qIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const q = parts[partIdx].questions[qIdx]
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...q, options: [...(q.options ?? []), { label: '', value: '' }] }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }
  function updateOption(partIdx: number, qIdx: number, optIdx: number, patch: { label?: string; value?: string }) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const q = parts[partIdx].questions[qIdx]
      const options = [...(q.options ?? [])]
      options[optIdx] = { ...options[optIdx], ...patch }
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...q, options }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }
  function removeOption(partIdx: number, qIdx: number, optIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const q = parts[partIdx].questions[qIdx]
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...q, options: (q.options ?? []).filter((_, i) => i !== optIdx) }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }

  async function handleSave() {
    if (!test) return
    setSaving(true); setError(null)
    try {
      const updated = await readingApi.update(testId, {
        title: test.title,
        cefr_level: test.cefr_level,
        duration_minutes: test.duration_minutes,
        total_questions: test.parts.reduce((n, p) => n + p.questions.length, 0),
        is_demo: test.is_demo,
        is_free: test.is_free,
        is_mock: test.is_mock,
        is_active: test.is_active,
        parts: test.parts,
      })
      setTest({ ...updated, parts: updated.parts?.length ? updated.parts : [] })
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Saqlashda xatolik')
    } finally { setSaving(false) }
  }

  async function handleLock() {
    if (!confirm("Testni lock qilishni tasdiqlaysizmi? Lock qilingandan so'ng tuzilma o'zgarmaydi.")) return
    setLocking(true); setError(null); setLockErrors([])
    try {
      const res = await readingApi.lock(testId)
      if (!res.success) {
        setLockErrors(res.errors ?? [])
      } else {
        await load()
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Lock qilishda xatolik')
    } finally { setLocking(false) }
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
  if (!test) return (
    <main className="container-shell py-10">
      {error
        ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        : <p className="text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>
      }
    </main>
  )

  return (
    <>
      {/* Add Question Modal */}
      {addModal && (
        <AddQuestionModal
          partIdx={addModal.partIdx}
          nextNum={(test.parts[addModal.partIdx]?.questions.at(-1)?.question_number ?? 0) + 1}
          onAdd={handleAddQuestion}
          onClose={() => setAddModal(null)}
        />
      )}

      <main className="container-shell py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/reading" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold leading-tight">{test.title || test.id}</h1>
              <p className="text-xs text-muted-foreground">{test.id}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isLocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isLocked
                ? <><Lock className="size-3" />LOCKED</>
                : <><Unlock className="size-3" />DRAFT</>
              }
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => dl(readingApi.paperPdfUrl(testId), `${testId}-paper.pdf`)}
              disabled={!isLocked || !!busy[`${testId}-paper.pdf`]}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <FileDown className="size-3.5" /> Paper PDF
            </button>
            <button
              onClick={() => dl(readingApi.answerSheetUrl(testId), `${testId}-answer-sheet.pdf`)}
              disabled={!isLocked || !!busy[`${testId}-answer-sheet.pdf`]}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <FileDown className="size-3.5" /> OMR varaq
            </button>
            {!isLocked && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-60"
              >
                <Save className="size-3.5" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            )}
            <button
              onClick={handleLock}
              disabled={locking || isLocked}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Lock className="size-3.5" />
              {isLocked ? 'Lock qilingan' : locking ? 'Tekshirilmoqda...' : 'Validate & Lock'}
            </button>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {lockErrors.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4" /> Lock qilib bo'lmadi:</p>
            <ul className="mt-1 list-disc pl-5">{lockErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}
        {isLocked && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Bu test lock qilingan (v{latestVersion.version_number}). Tuzilmani o'zgartirib bo'lmaydi.
          </p>
        )}

        {/* Umumiy ma'lumotlar */}
        <div className="surface p-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label-xs">Sarlavha</span>
            <input disabled={isLocked} value={test.title} onChange={e => updateTest('title', e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="label-xs">CEFR darajasi</span>
            <select disabled={isLocked} value={test.cefr_level} onChange={e => updateTest('cefr_level', e.target.value)} className="field">
              {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label-xs">Til</span>
            <select disabled={isLocked} value={test.language} onChange={e => updateTest('language', e.target.value)} className="field">
              {READING_LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label-xs">Davomiyligi (daqiqa)</span>
            <input disabled={isLocked} type="number" min={10} value={test.duration_minutes}
              onChange={e => updateTest('duration_minutes', Number(e.target.value))} className="field" />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {(['is_demo', 'is_free', 'is_mock', 'is_active'] as const).map(key => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input disabled={isLocked} type="checkbox" checked={!!test[key]}
                  onChange={e => updateTest(key, e.target.checked as any)} />
                {{ is_demo: 'Demo', is_free: 'Bepul', is_mock: 'Mock', is_active: 'Faol' }[key]}
              </label>
            ))}
          </div>
        </div>

        {/* Qismlar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Qismlar ({test.parts.length})</h2>
            {!isLocked && (
              <button onClick={addPart} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                <Plus className="size-3.5" /> Qism qo'shish
              </button>
            )}
          </div>

          {test.parts.map((part, pIdx) => (
            <div key={pIdx} className="surface p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <label className="block">
                    <span className="label-xs">Qism sarlavhasi</span>
                    <input disabled={isLocked} value={part.title}
                      onChange={e => updatePart(pIdx, { title: e.target.value })}
                      placeholder={`Part ${pIdx + 1}`} className="field" />
                  </label>
                  <label className="block">
                    <span className="label-xs">Tavsif (ixtiyoriy)</span>
                    <input disabled={isLocked} value={part.description ?? ''}
                      onChange={e => updatePart(pIdx, { description: e.target.value })} className="field" />
                  </label>
                  <label className="block">
                    <span className="label-xs">Matn (passage)</span>
                    <textarea disabled={isLocked} rows={7} value={part.passage}
                      onChange={e => updatePart(pIdx, { passage: e.target.value })}
                      className="field resize-y font-serif text-sm leading-relaxed" />
                  </label>
                </div>
                {!isLocked && (
                  <button onClick={() => removePart(pIdx)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 shrink-0 mt-1">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* Savollar */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Savollar
                    <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {part.questions.length}
                    </span>
                  </h3>
                  {!isLocked && (
                    <button
                      onClick={() => setAddModal({ partIdx: pIdx })}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
                    >
                      <Plus className="size-3.5" /> Savol qo'shish
                    </button>
                  )}
                </div>

                {part.questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        #
                        <input disabled={isLocked} type="number" value={q.question_number}
                          onChange={e => updateQuestion(pIdx, qIdx, { question_number: Number(e.target.value) })}
                          className="w-14 rounded border px-1.5 py-1 text-xs" />
                      </span>
                      <select disabled={isLocked} value={q.type}
                        onChange={e => updateQuestion(pIdx, qIdx, { type: e.target.value })}
                        className="field !mt-0 max-w-[200px] text-xs">
                        {READING_QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Limit:
                        <input disabled={isLocked} type="number" min={0} value={q.word_limit ?? ''}
                          onChange={e => updateQuestion(pIdx, qIdx, { word_limit: e.target.value ? Number(e.target.value) : null })}
                          className="w-14 rounded border px-1.5 py-1 text-xs" />
                      </span>
                      {!isLocked && (
                        <button onClick={() => removeQuestion(pIdx, qIdx)} className="ml-auto rounded p-1 text-red-500 hover:bg-red-50">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>

                    <input disabled={isLocked} value={q.text}
                      onChange={e => updateQuestion(pIdx, qIdx, { text: e.target.value })}
                      placeholder="Savol matni" className="field text-sm" />

                    <label className="block">
                      <span className="label-xs">To'g'ri javob(lar) — vergul bilan</span>
                      <input disabled={isLocked}
                        value={(q.correct_answer ?? []).join(', ')}
                        onChange={e => updateQuestion(pIdx, qIdx, {
                          correct_answer: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="field text-sm" />
                    </label>

                    {/* Options */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="label-xs">Variantlar</span>
                        {!isLocked && (
                          <button onClick={() => addOption(pIdx, qIdx)} className="text-xs font-semibold text-primary hover:underline">
                            + variant
                          </button>
                        )}
                      </div>
                      <div className="mt-1.5 space-y-1.5">
                        {(q.options ?? []).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input disabled={isLocked} value={opt.label} placeholder="A"
                              onChange={e => updateOption(pIdx, qIdx, oIdx, { label: e.target.value })}
                              className="w-14 rounded-lg border px-2 py-1 text-xs" />
                            <input disabled={isLocked} value={opt.value} placeholder="Variant matni"
                              onChange={e => updateOption(pIdx, qIdx, oIdx, { value: e.target.value })}
                              className="flex-1 rounded-lg border px-2 py-1 text-xs" />
                            {!isLocked && (
                              <button onClick={() => removeOption(pIdx, qIdx, oIdx)} className="rounded p-1 text-red-500 hover:bg-red-50">
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {part.questions.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed py-6 text-center">
                    <p className="text-xs text-muted-foreground">Hali savollar yo'q.</p>
                    {!isLocked && (
                      <button
                        onClick={() => setAddModal({ partIdx: pIdx })}
                        className="mt-2 text-xs font-semibold text-primary hover:underline"
                      >
                        Birinchi savol qo'shish →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {test.parts.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">Hali qismlar yo'q.</p>
              {!isLocked && (
                <button onClick={addPart} className="mt-3 text-sm font-semibold text-primary hover:underline">
                  Birinchi qismni qo'shish →
                </button>
              )}
            </div>
          )}
        </div>

        {!isLocked && (
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              <Save className="size-4" /> {saving ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
            </button>
          </div>
        )}
      </main>
    </>
  )
}