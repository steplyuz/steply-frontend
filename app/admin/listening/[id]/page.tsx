/**
 * app/admin/listening/[id]/page.tsx
 * ===================================
 * Tuzatishlar:
 * 1. Savollar nusxalanishi — key={pIdx} o'rniga key={part.id ?? part._key ?? pIdx}
 * 2. part.options UI qo'shildi (MATCHING / MAP_DIAGRAM uchun Part-level variantlar)
 * 3. addPart / addQuestion / addOption — barcha yangi elementlarga _key: crypto.randomUUID()
 * 4. updatePartOption / removePartOption — alohida helper funksiyalar
 */
'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, FileDown, Lock, Plus, Save, ShieldAlert, Trash2, Unlock,
} from 'lucide-react'
import { formatLockError, listeningApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { ListeningPart, ListeningQuestion, ListeningTest, ExamVersion, LockError } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'
import { LISTENING_QUESTION_TYPES } from '@/lib/cefr-question-types'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

// MATCHING / MAP_DIAGRAM bo'lganda part-level options kerak
const PART_LEVEL_OPTION_TYPES = new Set(['MATCHING', 'MAP_DIAGRAM'])

// ─── Yangi element yaratuvchilar ────────────────────────────────────────────
function emptyOption(idx: number) {
  return { _key: crypto.randomUUID(), label: String.fromCharCode(65 + idx), value: '' }
}

function emptyQuestion(num: number): ListeningQuestion & { _key: string } {
  return {
    _key: crypto.randomUUID(),
    question_number: num,
    type: 'MULTIPLE_CHOICE',
    question: '',
    correct_answer: '',
    options: [],
  }
}

function emptyPart(num: number): ListeningPart & { _key: string } {
  return {
    _key: crypto.randomUUID(),
    part_number: num,
    title: '',
    instruction: '',
    task_type: '',
    audio_label: '',
    audio_url: '',
    context: '',
    passage: '',
    map_image: '',
    questions: [],
    options: [],
  }
}

// ─── Tuzatilgan part uchun options kerakmi? ──────────────────────────────────
function partNeedsOptions(part: ListeningPart): boolean {
  if (PART_LEVEL_OPTION_TYPES.has(part.task_type?.toUpperCase() ?? '')) return true
  return part.questions.some(q => PART_LEVEL_OPTION_TYPES.has(q.type?.toUpperCase() ?? ''))
}

// ─── Asosiy komponent ────────────────────────────────────────────────────────
export default function AdminListeningEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params)
  const { user, isLoading } = useAuth()
  const [test, setTest] = useState<ListeningTest | null>(null)
  const [versions, setVersions] = useState<ExamVersion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lockErrors, setLockErrors] = useState<LockError[]>([])
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [audioUploading, setAudioUploading] = useState(false)

  const isAdmin = user?.global_role === 'admin'
  const latestVersion = versions[0]
  const isLocked = !!latestVersion?.is_locked

  useEffect(() => {
    if (!isAdmin) return
    void load(examId)
  }, [isAdmin, examId])

  // Server ma'lumotini React key uchun _key bilan boyitamiz.
  // _key = DB id (doim barqaror) → savollar hech qachon nusxalanmaydi.
  function normalizeParts(rawParts: any[]) {
    return rawParts.map((p: any) => ({
      ...p,
      _key: String(p.id),           // DB id — doim bor, doim barqaror
      options: (p.options ?? []).map((o: any, oi: number) => ({
        ...o,
        _key: o.id != null ? String(o.id) : `opt-p-${oi}`,
      })),
      questions: (p.questions ?? []).map((q: any) => ({
        ...q,
        _key: String(q.id),         // DB id
        options: (q.options ?? []).map((o: any, oi: number) => ({
          ...o,
          _key: o.id != null ? String(o.id) : `opt-q-${oi}`,
        })),
      })),
    }))
  }

  async function load(currentExamId: string) {
    try {
      const [t, v] = await Promise.all([
        listeningApi.adminGet(currentExamId),
        listeningApi.versions(currentExamId).catch(() => []),
      ])
      setTest({ ...t, parts: normalizeParts(t.parts ?? []) })
      setVersions(v)
    } catch {
      setError('Testni yuklab bo\'lmadi')
    }
  }

  // ─── Test darajasi yangilash ──────────────────────────────────────────────
  function updateTest<K extends keyof ListeningTest>(key: K, value: ListeningTest[K]) {
    setTest(t => (t ? { ...t, [key]: value } : t))
  }

  // ─── Part yangilash ───────────────────────────────────────────────────────
  function updatePart(idx: number, patch: Partial<ListeningPart>) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      parts[idx] = { ...parts[idx], ...patch }
      return { ...t, parts }
    })
  }

  function addPart() {
    setTest(t => (t ? { ...t, parts: [...t.parts, emptyPart(t.parts.length + 1)] } : t))
  }

  function removePart(idx: number) {
    if (!confirm("Bu qismni savollari bilan birga o'chirasizmi?")) return
    setTest(t => (t ? { ...t, parts: t.parts.filter((_, i) => i !== idx) } : t))
  }

  // ─── Part-level options (MATCHING / MAP_DIAGRAM) ──────────────────────────
  function addPartOption(pIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const part = parts[pIdx]
      const opts = part.options ?? []
      parts[pIdx] = { ...part, options: [...opts, emptyOption(opts.length)] }
      return { ...t, parts }
    })
  }

  function updatePartOption(pIdx: number, oIdx: number, value: string) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const opts = [...(parts[pIdx].options ?? [])]
      opts[oIdx] = { ...(opts[oIdx] as any), label: String.fromCharCode(65 + oIdx), value }
      parts[pIdx] = { ...parts[pIdx], options: opts }
      return { ...t, parts }
    })
  }

  function removePartOption(pIdx: number, oIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const opts = (parts[pIdx].options ?? []).filter((_, i) => i !== oIdx)
      // label larni qayta tartiblaymiz
      const relabeled = opts.map((o, i) => ({ ...(o as any), label: String.fromCharCode(65 + i) }))
      parts[pIdx] = { ...parts[pIdx], options: relabeled }
      return { ...t, parts }
    })
  }

  // ─── Savollar ─────────────────────────────────────────────────────────────
  function updateQuestion(partIdx: number, qIdx: number, patch: Partial<ListeningQuestion>) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...questions[qIdx], ...patch }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }

  function addQuestion(partIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const nextNum = (parts[partIdx].questions.at(-1)?.question_number ?? 0) + 1
      parts[partIdx] = {
        ...parts[partIdx],
        questions: [...parts[partIdx].questions, emptyQuestion(nextNum)],
      }
      return { ...t, parts }
    })
  }

  function removeQuestion(partIdx: number, qIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      parts[partIdx] = {
        ...parts[partIdx],
        questions: parts[partIdx].questions.filter((_, i) => i !== qIdx),
      }
      return { ...t, parts }
    })
  }

  // ─── Savol-darajasi options (MULTIPLE_CHOICE) ─────────────────────────────
  function addOption(partIdx: number, qIdx: number) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const q = parts[partIdx].questions[qIdx]
      const opts = q.options ?? []
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...q, options: [...opts, emptyOption(opts.length)] }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }

  function updateOption(partIdx: number, qIdx: number, optIdx: number, value: string) {
    setTest(t => {
      if (!t) return t
      const parts = [...t.parts]
      const q = parts[partIdx].questions[qIdx]
      const options = [...(q.options ?? [])]
      options[optIdx] = {
        ...(typeof options[optIdx] === 'string'
          ? { _key: crypto.randomUUID(), label: String.fromCharCode(65 + optIdx) }
          : (options[optIdx] as any)),
        value,
      }
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
      const opts = (q.options ?? []).filter((_, i) => i !== optIdx)
      const relabeled = opts.map((o, i) => ({ ...(o as any), label: String.fromCharCode(65 + i) }))
      const questions = [...parts[partIdx].questions]
      questions[qIdx] = { ...q, options: relabeled }
      parts[partIdx] = { ...parts[partIdx], questions }
      return { ...t, parts }
    })
  }

  // ─── Saqlash ──────────────────────────────────────────────────────────────
  // Backendga yuborishdan oldin:
  // 1. _key kabi vaqtinchalik maydonlarni olib tashlaymiz
  // 2. MATCHING / MAP_DIAGRAM savollar uchun question.options ga part.options ni
  //    avtomatik mirror qilamiz — backend lock validatsiyasi question.options ni
  //    tekshiradi, lekin part.options ni emas.
  function stripInternalKeys(parts: any[]) {
    return parts.map(({ _key, ...p }: any) => {
      const cleanPartOpts = (p.options ?? []).map(({ _key: _ok, ...o }: any) => o)
      const questions = (p.questions ?? []).map(({ _key: _qk, ...q }: any) => {
        const isPartLevel = PART_LEVEL_OPTION_TYPES.has((q.type ?? '').toUpperCase())
        return {
          ...q,
          options: isPartLevel
            ? cleanPartOpts
            : (q.options ?? []).map(({ _key: _opk, ...o }: any) => o),
        }
      })
      return { ...p, options: cleanPartOpts, questions }
    })
  }

  async function handleSave() {
    if (!test) return
    setSaving(true); setError(null)
    try {
      await listeningApi.update(examId, {
        title: test.title,
        level: test.level,
        duration: test.duration,
        total_questions: test.parts.reduce((n, p) => n + p.questions.length, 0),
        sections: test.sections,
        audio_mode: test.audio_mode,
        audio_url: test.audio_url ?? null,
        is_demo: test.is_demo,
        is_free: test.is_free,
        is_mock: test.is_mock,
        is_active: test.is_active,
        parts: stripInternalKeys(test.parts),
      })
      // Saqlashdan keyin serverdan toza ma'lumot olamiz —
      // bu parts ning yangi DB id lari bilan state ni to'g'ri yangilaydi
      // va savollar nusxalanishining oldini oladi.
      await load(examId)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Saqlashda xatolik')
    } finally { setSaving(false) }
  }

  // ─── Lock ─────────────────────────────────────────────────────────────────
  async function handleLock() {
    if (!confirm("Testni lock qilishni tasdiqlaysizmi? Lock qilingandan so'ng tuzilma o'zgarmaydi.")) return
    setLocking(true); setError(null); setLockErrors([])
    try {
      const res = await listeningApi.lock(examId)
      if (!res.success) {
        setLockErrors(res.errors ?? [])
      } else {
        await load(examId)
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Lock qilishda xatolik')
    } finally { setLocking(false) }
  }

  // ─── Audio upload ─────────────────────────────────────────────────────────
  async function uploadAudio(file: File, target: 'exam' | number) {
    setAudioUploading(true); setError(null)
    try {
      const result = await listeningApi.uploadAudio(file)
      if (target === 'exam') {
        updateTest('audio_url', result.url)
      } else {
        updatePart(target, { audio_label: result.url, audio_url: result.url })
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Audio yuklashda xatolik')
    } finally { setAudioUploading(false) }
  }

  // ─── Download ─────────────────────────────────────────────────────────────
  async function dl(url: string, filename: string) {
    setBusy(b => ({ ...b, [filename]: true }))
    await authenticatedDownload(url, { filename, onError: setError })
    setBusy(b => ({ ...b, [filename]: false }))
  }

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Yuklanmoqda...
    </div>
  )
  if (!isAdmin) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administratorlar kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
        Kabinetga qaytish
      </Link>
    </div>
  )
  if (!test) return (
    <main className="container-shell py-10">
      {error
        ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        : <p className="text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>}
    </main>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="container-shell py-10 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/listening" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">{test.title || test.id}</h1>
            <p className="text-xs text-muted-foreground">{test.id}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {isLocked
              ? <><Lock className="inline size-3 mr-1" />LOCKED</>
              : <><Unlock className="inline size-3 mr-1" />DRAFT</>}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => dl(listeningApi.paperPdfUrl(examId), `${examId}-paper.pdf`)}
            disabled={!isLocked || !!busy[`${examId}-paper.pdf`]}
            title={isLocked ? 'Savol qog\'ozi (PDF)' : 'Avval lock qiling'}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <FileDown className="size-3.5" /> Paper PDF
          </button>
          <button
            onClick={() => dl(listeningApi.answerSheetUrl(examId), `${examId}-answer-sheet.pdf`)}
            disabled={!isLocked || !!busy[`${examId}-answer-sheet.pdf`]}
            title={isLocked ? "OMR javob varag'i" : 'Avval lock qiling'}
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

      {/* Xatolar */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {lockErrors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4" /> Lock qilib bo'lmadi:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {lockErrors.map((e, i) => <li key={i}>{formatLockError(e)}</li>)}
          </ul>
        </div>
      )}
      {isLocked && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Bu test lock qilingan (v{latestVersion.version_number}). Tuzilmani o'zgartirib bo'lmaydi — faqat yangi versiya orqali.
        </p>
      )}

      {/* Umumiy ma'lumotlar */}
      <div className="surface p-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="label-xs">Sarlavha</span>
          <input
            disabled={isLocked}
            value={test.title}
            onChange={e => updateTest('title', e.target.value)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="label-xs">CEFR darajasi</span>
          <select
            disabled={isLocked}
            value={test.level}
            onChange={e => updateTest('level', e.target.value)}
            className="field"
          >
            {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label-xs">Davomiyligi (daqiqa)</span>
          <input
            disabled={isLocked}
            type="number"
            min={10}
            value={test.duration}
            onChange={e => updateTest('duration', Number(e.target.value))}
            className="field"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label-xs">Bo'limlar tavsifi (ixtiyoriy matn)</span>
          <input
            disabled={isLocked}
            value={test.sections ?? ''}
            onChange={e => updateTest('sections', e.target.value)}
            className="field"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          {([
            ['is_demo', 'Demo'],
            ['is_free', 'Bepul'],
            ['is_mock', 'Mock imtihon tarkibida'],
            ['is_active', 'Faol'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                disabled={isLocked}
                type="checkbox"
                checked={!!test[key]}
                onChange={e => updateTest(key, e.target.checked as any)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Audio manbasi */}
      <section className="surface p-5 space-y-4">
        <div>
          <h2 className="font-bold">Audio manbasi</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            2 xil rejim: butun Listening uchun bitta audio yoki har bir Part uchun alohida audio.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-xs">Audio rejimi</span>
            <select
              disabled={isLocked}
              value={test.audio_mode ?? 'PARTS'}
              onChange={e => updateTest('audio_mode', e.target.value as any)}
              className="field"
            >
              <option value="PARTS">Har bir Part uchun alohida audio</option>
              <option value="EXAM">Butun test uchun bitta audio</option>
            </select>
          </label>
          {test.audio_mode === 'EXAM' && (
            <label className="block">
              <span className="label-xs">Umumiy audio URL</span>
              <div className="flex gap-2">
                <input
                  disabled={isLocked}
                  value={test.audio_url ?? ''}
                  onChange={e => updateTest('audio_url', e.target.value)}
                  placeholder="https://.../listening.mp3 yoki /static/..."
                  className="field flex-1"
                />
                {!isLocked && (
                  <label className="shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
                    Upload
                    <input
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                      className="hidden"
                      disabled={audioUploading}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) uploadAudio(f, 'exam')
                        e.currentTarget.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </label>
          )}
        </div>
      </section>

      {/* Qismlar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Qismlar ({test.parts.length})</h2>
          {!isLocked && (
            <button
              onClick={addPart}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <Plus className="size-3.5" /> Qism qo'shish
            </button>
          )}
        </div>

        {test.parts.map((part, pIdx) => {
          // FIX: indeks o'rniga barqaror key ishlatiladi — nusxalanish oldini oladi
          const partKey = (part as any)._key ?? pIdx
          const showPartOptions = partNeedsOptions(part)

          return (
            <div key={partKey} className="surface p-5 space-y-4">

              {/* Part asosiy maydonlari */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-xs">Qism raqami</span>
                    <input
                      disabled={isLocked}
                      type="number"
                      min={1}
                      value={part.part_number}
                      onChange={e => updatePart(pIdx, { part_number: Number(e.target.value) })}
                      className="field"
                    />
                  </label>
                  <label className="block">
                    <span className="label-xs">Sarlavha</span>
                    <input
                      disabled={isLocked}
                      value={part.title}
                      onChange={e => updatePart(pIdx, { title: e.target.value })}
                      placeholder={`Part ${pIdx + 1}`}
                      className="field"
                    />
                  </label>
                  <label className="block">
                    <span className="label-xs">Part audio URL</span>
                    <div className="flex gap-2">
                      <input
                        disabled={isLocked || test.audio_mode === 'EXAM'}
                        value={part.audio_url ?? part.audio_label ?? ''}
                        onChange={e => updatePart(pIdx, { audio_url: e.target.value, audio_label: e.target.value })}
                        placeholder="https://.../part1.mp3 yoki /static/..."
                        className="field flex-1"
                      />
                      {!isLocked && test.audio_mode !== 'EXAM' && (
                        <label className="shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
                          Upload
                          <input
                            type="file"
                            accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                            className="hidden"
                            disabled={audioUploading}
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) uploadAudio(f, pIdx)
                              e.currentTarget.value = ''
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </label>
                  <label className="block">
                    <span className="label-xs">Topshiriq turi (task_type)</span>
                    <input
                      disabled={isLocked}
                      value={part.task_type ?? ''}
                      onChange={e => updatePart(pIdx, { task_type: e.target.value })}
                      placeholder="MULTIPLE_CHOICE / GAP_FILL / MATCHING / MAP_DIAGRAM"
                      className="field"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label-xs">Ko'rsatma (instruction)</span>
                    <input
                      disabled={isLocked}
                      value={part.instruction ?? ''}
                      onChange={e => updatePart(pIdx, { instruction: e.target.value })}
                      className="field"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label-xs">Kontekst / stenogramma tayanchi (ixtiyoriy)</span>
                    <textarea
                      disabled={isLocked}
                      rows={3}
                      value={part.context ?? ''}
                      onChange={e => updatePart(pIdx, { context: e.target.value })}
                      className="field resize-y"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label-xs">Xarita rasmi URL (map/plan savollari uchun, ixtiyoriy)</span>
                    <input
                      disabled={isLocked}
                      value={part.map_image ?? ''}
                      onChange={e => updatePart(pIdx, { map_image: e.target.value })}
                      className="field"
                    />
                  </label>
                </div>
                {!isLocked && (
                  <button
                    onClick={() => removePart(pIdx)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* ── Part-level umumiy variantlar (MATCHING / MAP_DIAGRAM) ── */}
              {showPartOptions && (
                <div className="rounded-lg border bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900">
                        Umumiy variantlar ({(part.options ?? []).length} ta)
                      </h3>
                      <p className="text-xs text-blue-700 mt-0.5">
                        MATCHING / MAP savollarda barcha savollar shu ro'yxatdan javob tanlaydi (A, B, C...).
                        Lock uchun kamida 2 ta variant kerak.
                      </p>
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => addPartOption(pIdx)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline shrink-0"
                      >
                        <Plus className="size-3" /> variant qo'shish
                      </button>
                    )}
                  </div>

                  {(part.options ?? []).length === 0 && !isLocked && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Hali variantlar yo'q — lock qilishdan oldin qo'shing (masalan: A–F yoki A–H)
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {(part.options ?? []).map((opt, oIdx) => {
                      const optKey = (opt as any)._key ?? (opt as any).id ?? oIdx
                      return (
                        <div key={optKey} className="flex items-center gap-2">
                          <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground rounded border bg-muted px-1 py-0.5">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            disabled={isLocked}
                            value={typeof opt === 'string' ? opt : (opt as any).value ?? ''}
                            placeholder={`Variant ${String.fromCharCode(65 + oIdx)}`}
                            onChange={e => updatePartOption(pIdx, oIdx, e.target.value)}
                            className="flex-1 rounded border px-2 py-1 text-sm"
                          />
                          {!isLocked && (
                            <button
                              onClick={() => removePartOption(pIdx, oIdx)}
                              className="rounded p-1 text-red-500 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Savollar ── */}
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Savollar ({part.questions.length})</h3>
                  {!isLocked && (
                    <button
                      onClick={() => addQuestion(pIdx)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Plus className="size-3" /> Savol qo'shish
                    </button>
                  )}
                </div>

                {part.questions.map((q, qIdx) => {
                  // FIX: barqaror key — nusxalanish oldini oladi
                  const qKey = (q as any)._key ?? `${pIdx}-${qIdx}`
                  const isPartLevelType = PART_LEVEL_OPTION_TYPES.has(q.type?.toUpperCase() ?? '')

                  return (
                    <div key={qKey} className="rounded-lg border bg-card p-3 space-y-2">
                      {/* Savol header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          #
                          <input
                            disabled={isLocked}
                            type="number"
                            value={q.question_number}
                            onChange={e => updateQuestion(pIdx, qIdx, { question_number: Number(e.target.value) })}
                            className="w-14 rounded border px-1.5 py-1"
                          />
                        </label>
                        <input
                          disabled={isLocked}
                          list="listening-question-types"
                          value={q.type}
                          onChange={e => updateQuestion(pIdx, qIdx, { type: e.target.value })}
                          placeholder="Turi (masalan MULTIPLE_CHOICE)"
                          className="field !mt-0 max-w-[220px]"
                        />
                        {!isLocked && (
                          <button
                            onClick={() => removeQuestion(pIdx, qIdx)}
                            className="ml-auto rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Savol matni */}
                      <input
                        disabled={isLocked}
                        value={(q as any).question ?? (q as any).text ?? ''}
                        onChange={e => updateQuestion(pIdx, qIdx, { question: e.target.value })}
                        placeholder="Savol matni"
                        className="field"
                      />

                      {/* To'g'ri javob */}
                      <label className="block">
                        <span className="label-xs">To'g'ri javob</span>
                        <input
                          disabled={isLocked}
                          value={q.correct_answer ?? ''}
                          onChange={e => updateQuestion(pIdx, qIdx, { correct_answer: e.target.value })}
                          placeholder={isPartLevelType ? 'Masalan: A yoki F' : 'Javob'}
                          className="field"
                        />
                      </label>

                      {/* Savol-darajasi variantlar — faqat MATCHING/MAP_DIAGRAM bo'lmagan turlar uchun */}
                      {!isPartLevelType && (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="label-xs !mt-0">
                              Variantlar (ko'p tanlovli savollar uchun)
                            </span>
                            {!isLocked && (
                              <button
                                onClick={() => addOption(pIdx, qIdx)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                + variant
                              </button>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {(q.options ?? []).map((opt, oIdx) => {
                              const opKey = (opt as any)._key ?? (opt as any).id ?? oIdx
                              return (
                                <div key={opKey} className="flex items-center gap-1.5">
                                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <input
                                    disabled={isLocked}
                                    value={typeof opt === 'string' ? opt : (opt as any).value ?? ''}
                                    placeholder={`Variant ${oIdx + 1}`}
                                    onChange={e => updateOption(pIdx, qIdx, oIdx, e.target.value)}
                                    className="flex-1 rounded border px-2 py-1 text-sm"
                                  />
                                  {!isLocked && (
                                    <button
                                      onClick={() => removeOption(pIdx, qIdx, oIdx)}
                                      className="rounded p-1 text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* MATCHING / MAP_DIAGRAM uchun izoh */}
                      {isPartLevelType && (part.options ?? []).length > 0 && (
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                          Variantlar yuqorida Part darajasida ({(part.options ?? []).length} ta) ko'rsatilgan
                        </p>
                      )}
                    </div>
                  )
                })}

                {part.questions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Hali savollar yo'q.</p>
                )}
              </div>
            </div>
          )
        })}

        {test.parts.length === 0 && (
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Hali qismlar yo'q. "Qism qo'shish" tugmasini bosing.
          </p>
        )}
      </div>

      <datalist id="listening-question-types">
        {LISTENING_QUESTION_TYPES.map(t => <option key={t} value={t} />)}
      </datalist>

      {!isLocked && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Save className="size-4" />
            {saving ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
          </button>
        </div>
      )}
    </main>
  )
}