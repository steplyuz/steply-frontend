/**
 * app/admin/reading/[id]/page.tsx
 * ================================
 * Admin — Reading test tahrirlash.
 * Savollarni 3 xil usulda qo'shish: Oddiy (forma), JSON, Shablon.
 *
 * Yangiliklar:
 *  - lockErrors: string ham, { question_number, message } ham qo'llab-quvvatlanadi
 *  - Sticky panel: holat, saqlanmagan o'zgarishlar, Ctrl/Cmd+S
 *  - Variantlar orqali to'g'ri javobni belgilash (radio / checkbox)
 *  - Har bir savol uchun jonli tekshiruv (bo'sh matn, javob yo'q, takror raqam ...)
 *  - Qismlarni yig'ish, savolni nusxalash, avtomatik raqamlash
 *  - Lock qilishdan oldin saqlanmagan o'zgarishlarni avtomatik saqlash
 *  - Backend schemasiga moslik: word_limit har doim int (0), saqlagandan keyin serverdan qayta yuklash
 *  - Qism savol raqamlari backend shabloniga mosligini ko'rsatish (lock shuni tekshiradi)
 */
'use client'

import Link from 'next/link'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, Braces, Check, ChevronDown, CircleAlert, Copy,
  FileDown, FileText, Layout, ListOrdered, Lock, Plus, Save, ShieldAlert,
  Trash2, Unlock, X,
} from 'lucide-react'
import { formatLockError, readingApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { ReadingPart, ReadingQuestion, ReadingTest, ExamVersion, LockError } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'
import { READING_QUESTION_TYPES, READING_LANGUAGES } from '@/lib/cefr-question-types'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

// Backend TEMPLATE_PARTS bilan bir xil: har bir qism uchun savol raqamlari oralig'i
const TEMPLATE_RANGES: [number, number][] = [[1, 6], [7, 14], [15, 20], [21, 29], [30, 35]]

// ─── Tiplar va yordamchilar ────────────────────────────────────────────────
type Option = { label: string; value: string }
type AddMode = 'simple' | 'json' | 'template'

const CHOICE_TYPES = new Set(['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE_NOT_GIVEN', 'HEADINGS_MATCH', 'TEXT_MATCH'])
const isChoiceType = (t: string) => CHOICE_TYPES.has(t)
const isMultiAnswer = (t: string) => t === 'MULTIPLE_SELECT'

/** To'g'ri javob qaysi maydon bo'yicha saqlanadi: TFNG — value, qolganlari — label */
const optionKey = (type: string, o: Option) => (type === 'TRUE_FALSE_NOT_GIVEN' ? o.value : o.label)

function defaultOptionsFor(type: string): Option[] {
  const letters = (n: number) => 'ABCDEFGH'.slice(0, n).split('').map(l => ({ label: l, value: '' }))
  if (type === 'MULTIPLE_CHOICE') return letters(4)
  if (type === 'MULTIPLE_SELECT') return letters(5)
  if (type === 'TRUE_FALSE_NOT_GIVEN') {
    return [
      { label: 'TRUE', value: 'TRUE' },
      { label: 'FALSE', value: 'FALSE' },
      { label: 'NOT GIVEN', value: 'NOT_GIVEN' },
    ]
  }
  return []
}

function emptyQuestion(num: number): ReadingQuestion {
  return { question_number: num, type: 'GAP_FILL', text: '', word_limit: 0, correct_answer: [], options: [] }
}
function emptyPart(): ReadingPart {
  return { title: '', description: '', passage: '', questions: [] }
}
const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

function questionIssues(q: ReadingQuestion, dupNums: Set<number>): string[] {
  const issues: string[] = []
  const answers = q.correct_answer ?? []
  const options = q.options ?? []
  if (!q.text.trim()) issues.push("Savol matni bo'sh")
  if (dupNums.has(q.question_number)) issues.push('Savol raqami takrorlangan')
  if (answers.length === 0) issues.push("To'g'ri javob ko'rsatilmagan")
  if (isChoiceType(q.type)) {
    if (options.length < 2) issues.push('Kamida 2 ta variant kerak')
    if (q.type !== 'TRUE_FALSE_NOT_GIVEN' && options.some(o => !o.value.trim())) issues.push("Bo'sh variant bor")
    const keys = new Set(options.map(o => optionKey(q.type, o)))
    if (answers.length > 0 && answers.some(a => !keys.has(a))) issues.push("To'g'ri javob variantlar orasida yo'q")
  }
  return issues
}

// Savol shablonlari
const Q_TEMPLATES: { label: string; desc: string; q: Partial<ReadingQuestion> }[] = [
  {
    label: "Gap Fill (to'ldirish)",
    desc: "Matndan so'z topib bo'sh joyga yozish",
    q: { type: 'GAP_FILL', text: 'Complete the sentence using NO MORE THAN TWO WORDS from the passage.', word_limit: 2, correct_answer: [], options: [] },
  },
  {
    label: 'Multiple Choice (A-D)',
    desc: '4 variantdan birini tanlash',
    q: {
      type: 'MULTIPLE_CHOICE', text: 'According to the passage, which statement is correct?', word_limit: 0,
      correct_answer: ['A'], options: defaultOptionsFor('MULTIPLE_CHOICE'),
    },
  },
  {
    label: 'True / False / Not Given',
    desc: "Bayonot to'g'ri, noto'g'ri yoki matnda yo'qmi",
    q: { type: 'TRUE_FALSE_NOT_GIVEN', text: '', word_limit: 0, correct_answer: ['TRUE'], options: defaultOptionsFor('TRUE_FALSE_NOT_GIVEN') },
  },
  {
    label: 'Headings Match',
    desc: 'Qism sarlavhasini paragrafga moslashtirish',
    q: { type: 'HEADINGS_MATCH', text: 'Choose the correct heading for the paragraph from the list below.', word_limit: 0, correct_answer: [], options: [] },
  },
  {
    label: 'Multiple Select',
    desc: "Bir nechta to'g'ri javob tanlash",
    q: {
      type: 'MULTIPLE_SELECT', text: 'Choose TWO correct statements from the following.', word_limit: 0,
      correct_answer: [], options: defaultOptionsFor('MULTIPLE_SELECT'),
    },
  },
]

// ─── Savol tahrirlagichi (modal va sahifada umumiy) ────────────────────────
interface QuestionEditorProps {
  q: ReadingQuestion
  onChange: (patch: Partial<ReadingQuestion>) => void
  disabled?: boolean
  showNumber?: boolean
}

function QuestionEditor({ q, onChange, disabled, showNumber = true }: QuestionEditorProps) {
  const options = q.options ?? []
  const answers = q.correct_answer ?? []
  const choice = isChoiceType(q.type)
  const multi = isMultiAnswer(q.type)

  function changeType(next: string) {
    const patch: Partial<ReadingQuestion> = { type: next as ReadingQuestion['type'] }
    if (isChoiceType(next) !== isChoiceType(q.type)) patch.correct_answer = []
    if (isChoiceType(next) && options.length === 0) patch.options = defaultOptionsFor(next)
    onChange(patch)
  }

  function toggleAnswer(key: string) {
    if (!key) return
    if (!multi) return onChange({ correct_answer: [key] })
    onChange({ correct_answer: answers.includes(key) ? answers.filter(a => a !== key) : [...answers, key] })
  }

  function patchOption(i: number, patch: Partial<Option>) {
    const old = options[i]
    const next = { ...old, ...patch }
    const oldKey = optionKey(q.type, old)
    const newKey = optionKey(q.type, next)
    const nextOptions = options.map((o, j) => (j === i ? next : o))
    // Belgi o'zgarsa, to'g'ri javob ham unga ergashsin
    const nextAnswers = oldKey !== newKey && answers.includes(oldKey)
      ? answers.map(a => (a === oldKey ? newKey : a))
      : answers
    onChange({ options: nextOptions, correct_answer: nextAnswers })
  }

  function removeOption(i: number) {
    const key = optionKey(q.type, options[i])
    onChange({ options: options.filter((_, j) => j !== i), correct_answer: answers.filter(a => a !== key) })
  }

  function addOption() {
    const used = new Set(options.map(o => o.label))
    const label = 'ABCDEFGHIJ'.split('').find(l => !used.has(l)) ?? ''
    onChange({ options: [...options, { label, value: '' }] })
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${showNumber ? 'grid-cols-[6rem_1fr_6rem]' : 'grid-cols-[1fr_6rem]'}`}>
        {showNumber && (
          <label className="block">
            <span className="label-xs">Raqami</span>
            <input
              disabled={disabled} type="number" min={1} value={q.question_number}
              onChange={e => onChange({ question_number: Number(e.target.value) })}
              className="field"
            />
          </label>
        )}
        <label className="block">
          <span className="label-xs">Turi</span>
          <select disabled={disabled} value={q.type} onChange={e => changeType(e.target.value)} className="field">
            {READING_QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label-xs">So'z limiti</span>
          <input
            disabled={disabled} type="number" min={0} value={q.word_limit || ''}
            onChange={e => onChange({ word_limit: Number(e.target.value) || 0 })}
            className="field"
          />
        </label>
      </div>

      <label className="block">
        <span className="label-xs">Savol matni</span>
        <textarea
          disabled={disabled} rows={2} value={q.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Savol yoki bayonot matnini kiriting"
          className="field resize-y"
        />
      </label>

      {/* Variantlar — javobni shu yerning o'zida belgilanadi */}
      {choice ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="label-xs">
              Variantlar
              <span className="ml-1.5 font-normal text-muted-foreground">
                {multi ? "(to'g'ri javoblarni belgilang)" : "(to'g'ri javobni belgilang)"}
              </span>
            </span>
            {!disabled && q.type !== 'TRUE_FALSE_NOT_GIVEN' && (
              <button type="button" onClick={addOption} className="text-xs font-semibold text-primary hover:underline">
                + variant
              </button>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            {options.map((opt, i) => {
              const key = optionKey(q.type, opt)
              const checked = answers.includes(key)
              const fixed = q.type === 'TRUE_FALSE_NOT_GIVEN'
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${checked ? 'border-emerald-300 bg-emerald-50/60' : 'bg-background'
                    }`}
                >
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    disabled={disabled || !key}
                    checked={checked}
                    onChange={() => toggleAnswer(key)}
                    aria-label={`${opt.label || i + 1} — to'g'ri javob`}
                    className="size-4 shrink-0 accent-emerald-600"
                  />
                  <input
                    disabled={disabled || fixed} value={opt.label} placeholder="A"
                    onChange={e => patchOption(i, { label: e.target.value })}
                    className="w-20 shrink-0 rounded-md border bg-card px-2 py-1 text-xs font-semibold disabled:opacity-70"
                  />
                  {fixed ? (
                    <span className="flex-1 text-xs text-muted-foreground">{opt.value}</span>
                  ) : (
                    <input
                      disabled={disabled} value={opt.value} placeholder="Variant matni"
                      onChange={e => patchOption(i, { value: e.target.value })}
                      className="min-w-0 flex-1 rounded-md border bg-card px-2 py-1 text-xs"
                    />
                  )}
                  {!disabled && !fixed && (
                    <button
                      type="button" onClick={() => removeOption(i)}
                      className="rounded p-1 text-red-500 hover:bg-red-50" aria-label="Variantni o'chirish"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            {options.length === 0 && (
              <p className="rounded-lg border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                Variantlar yo'q.{' '}
                {!disabled && (
                  <button
                    type="button" className="font-semibold text-primary hover:underline"
                    onClick={() => onChange({ options: defaultOptionsFor(q.type).length ? defaultOptionsFor(q.type) : [{ label: 'A', value: '' }] })}
                  >
                    Variant qo'shish
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="label-xs">
            To'g'ri javob(lar)
            <span className="ml-1.5 font-normal text-muted-foreground">bir nechta bo'lsa, vergul bilan ajrating</span>
          </span>
          <input
            disabled={disabled}
            value={answers.join(', ')}
            onChange={e => onChange({ correct_answer: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })}
            placeholder="masalan: river, the river"
            className="field"
          />
        </label>
      )}
    </div>
  )
}

// ─── Savol qo'shish modali ─────────────────────────────────────────────────
interface AddModalProps {
  partIdx: number
  nextNum: number
  onAdd: (partIdx: number, q: ReadingQuestion) => void
  onClose: () => void
}

function AddQuestionModal({ partIdx, nextNum, onAdd, onClose }: AddModalProps) {
  const [mode, setMode] = useState<AddMode>('simple')
  const [simple, setSimple] = useState<ReadingQuestion>(emptyQuestion(nextNum))
  const [jsonText, setJsonText] = useState(() => JSON.stringify(emptyQuestion(nextNum), null, 2))
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function switchMode(next: AddMode) {
    if (next === 'json' && mode === 'simple') setJsonText(JSON.stringify(simple, null, 2))
    setJsonError(null)
    setMode(next)
  }

  function handleSimpleSubmit() {
    onAdd(partIdx, simple)
    onClose()
  }

  function handleJsonSubmit() {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setJsonError('JSON bitta savol obyekti bo\'lishi kerak')
        return
      }
      if (!parsed.type || typeof parsed.question_number !== 'number') {
        setJsonError('type va question_number majburiy maydonlar')
        return
      }
      onAdd(partIdx, { text: '', word_limit: 0, correct_answer: [], options: [], ...parsed })
      onClose()
    } catch (e) {
      setJsonError('JSON formatida xatolik: ' + (e as Error).message)
    }
  }

  function handleTemplateSelect(tq: Partial<ReadingQuestion>) {
    onAdd(partIdx, {
      question_number: nextNum,
      type: tq.type ?? 'GAP_FILL',
      text: tq.text ?? '',
      word_limit: tq.word_limit ?? 0,
      correct_answer: tq.correct_answer ?? [],
      options: (tq.options ?? []).map(o => ({ ...o })),
    })
    onClose()
  }

  const tabs: { id: AddMode; icon: React.ElementType; label: string }[] = [
    { id: 'simple', icon: FileText, label: 'Oddiy' },
    { id: 'json', icon: Braces, label: 'JSON' },
    { id: 'template', icon: Layout, label: 'Shablon' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-semibold">Savol qo'shish — Part {partIdx + 1}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Yopish">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex border-b px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchMode(tab.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${mode === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {mode === 'simple' && (
            <QuestionEditor q={simple} onChange={patch => setSimple(s => ({ ...s, ...patch }))} />
          )}

          {mode === 'json' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Savolni JSON formatida kiriting. <code className="rounded bg-muted px-1">question_number</code> va{' '}
                <code className="rounded bg-muted px-1">type</code> majburiy.
              </p>
              <textarea
                rows={16} value={jsonText} spellCheck={false}
                onChange={e => { setJsonText(e.target.value); setJsonError(null) }}
                className="field resize-none font-mono text-xs"
              />
              {jsonError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{jsonError}</p>
              )}
            </div>
          )}

          {mode === 'template' && (
            <div className="space-y-2">
              <p className="mb-3 text-xs text-muted-foreground">
                Shablonni tanlang. Savol raqami avtomatik qo'yiladi, qolgan maydonlarni keyin to'ldirasiz.
              </p>
              {Q_TEMPLATES.map((tpl, i) => (
                <button
                  key={i} type="button" onClick={() => handleTemplateSelect(tpl.q)}
                  className="group w-full rounded-xl border bg-background px-4 py-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold group-hover:text-primary">{tpl.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tpl.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {mode !== 'template' && (
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <button
              type="button" onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="button" onClick={mode === 'json' ? handleJsonSubmit : handleSimpleSubmit}
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

// ─── Qism kartasi ──────────────────────────────────────────────────────────
interface PartCardProps {
  part: ReadingPart
  pIdx: number
  locked: boolean
  dupNums: Set<number>
  expected?: [number, number]
  onPatch: (patch: Partial<ReadingPart>) => void
  onRemove: () => void
  onAddQuestion: () => void
  onUpdateQuestion: (qIdx: number, patch: Partial<ReadingQuestion>) => void
  onRemoveQuestion: (qIdx: number) => void
  onDuplicateQuestion: (qIdx: number) => void
}

function PartCard({
  part, pIdx, locked, dupNums, expected,
  onPatch, onRemove, onAddQuestion, onUpdateQuestion, onRemoveQuestion, onDuplicateQuestion,
}: PartCardProps) {
  const [open, setOpen] = useState(true)
  const nums = part.questions.map(q => q.question_number)
  const range = nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : null
  const issueTotal = part.questions.reduce((n, q) => n + questionIssues(q, dupNums).length, 0)
  const rangeMismatch = !!expected && part.questions.length > 0 && (
    nums.length !== expected[1] - expected[0] + 1 ||
    nums.some(n => n < expected[0] || n > expected[1])
  )

  return (
    <section className="surface overflow-hidden">
      <header className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3">
        <button
          type="button" onClick={() => setOpen(o => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}
        >
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="truncate text-sm font-bold">{part.title || `Part ${pIdx + 1}`}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {part.questions.length} savol{range ? ` (${range})` : ''} · {wordCount(part.passage)} so'z
          </span>
        </button>
        {rangeMismatch && expected && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Kutilgan: {expected[0]}–{expected[1]}
          </span>
        )}
        {issueTotal > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <CircleAlert className="size-3" /> {issueTotal}
          </span>
        )}
        {!locked && (
          <button onClick={onRemove} className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Qismni o'chirish">
            <Trash2 className="size-4" />
          </button>
        )}
      </header>

      {open && (
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label-xs">Qism sarlavhasi</span>
              <input
                disabled={locked} value={part.title} placeholder={`Part ${pIdx + 1}`}
                onChange={e => onPatch({ title: e.target.value })} className="field"
              />
            </label>
            <label className="block">
              <span className="label-xs">Tavsif (ixtiyoriy)</span>
              <input
                disabled={locked} value={part.description ?? ''}
                onChange={e => onPatch({ description: e.target.value })} className="field"
              />
            </label>
          </div>

          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="label-xs">Matn (passage)</span>
              <span className="text-xs text-muted-foreground">{wordCount(part.passage)} so'z</span>
            </span>
            <textarea
              disabled={locked} rows={9} value={part.passage}
              onChange={e => onPatch({ passage: e.target.value })}
              className="field resize-y font-serif text-[15px] leading-relaxed"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Savollar</h3>
              {!locked && (
                <button
                  onClick={onAddQuestion}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <Plus className="size-3.5" /> Savol qo'shish
                </button>
              )}
            </div>

            {part.questions.map((q, qIdx) => {
              const issues = questionIssues(q, dupNums)
              return (
                <article
                  key={qIdx}
                  className={`rounded-xl border bg-card ${issues.length ? 'border-amber-300/70' : ''}`}
                >
                  <div className="flex items-center gap-2 border-b px-4 py-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {q.question_number}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{q.type}</span>
                    {!locked && (
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          onClick={() => onDuplicateQuestion(qIdx)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted" aria-label="Nusxalash"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveQuestion(qIdx)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label="O'chirish"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <QuestionEditor q={q} disabled={locked} onChange={patch => onUpdateQuestion(qIdx, patch)} />
                    {issues.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {issues.map(msg => (
                          <li
                            key={msg}
                            className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                          >
                            <CircleAlert className="size-3" /> {msg}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              )
            })}

            {part.questions.length === 0 && (
              <div className="rounded-xl border-2 border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">Bu qismda hali savollar yo'q.</p>
                {!locked && (
                  <button onClick={onAddQuestion} className="mt-2 text-sm font-semibold text-primary hover:underline">
                    Birinchi savolni qo'shish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Asosiy sahifa ─────────────────────────────────────────────────────────
export default function AdminReadingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = use(params)
  const { user, isLoading } = useAuth()
  const [test, setTest] = useState<ReadingTest | null>(null)
  const [snapshot, setSnapshot] = useState('')
  const [versions, setVersions] = useState<ExamVersion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lockErrors, setLockErrors] = useState<LockError[]>([])
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [addModal, setAddModal] = useState<{ partIdx: number } | null>(null)
  const [flagBusy, setFlagBusy] = useState(false)
  const [answersMissing, setAnswersMissing] = useState(false)

  const isAdmin = user?.global_role === 'admin'
  const latestVersion = versions[0]
  const isLocked = !!latestVersion?.is_locked

  const dirty = useMemo(() => !!test && JSON.stringify(test) !== snapshot, [test, snapshot])

  // Takrorlangan savol raqamlari (barcha qismlar bo'yicha)
  const dupNums = useMemo(() => {
    const seen = new Set<number>()
    const dup = new Set<number>()
    test?.parts.forEach(p => p.questions.forEach(q => {
      if (seen.has(q.question_number)) dup.add(q.question_number)
      seen.add(q.question_number)
    }))
    return dup
  }, [test])

  const totalQuestions = useMemo(() => test?.parts.reduce((n, p) => n + p.questions.length, 0) ?? 0, [test])
  const totalIssues = useMemo(
    () => test?.parts.reduce((n, p) => n + p.questions.reduce((m, q) => m + questionIssues(q, dupNums).length, 0), 0) ?? 0,
    [test, dupNums],
  )
  const nextQuestionNumber = useMemo(
    () => Math.max(0, ...(test?.parts.flatMap(p => p.questions.map(q => q.question_number)) ?? [])) + 1,
    [test],
  )

  const applyLoaded = useCallback((t: ReadingTest) => {
    // Server correct_answer ni qaytarmasa, saqlash javoblarni o'chirib yuboradi — buni bloklaymiz
    setAnswersMissing((t.parts ?? []).some(p => (p.questions ?? []).some(q => q.correct_answer == null)))
    const normalized: ReadingTest = {
      ...t,
      parts: (t.parts ?? []).map(p => ({
        ...p,
        questions: (p.questions ?? []).map(q => ({
          ...q,
          word_limit: q.word_limit ?? 0,
          correct_answer: q.correct_answer ?? [],
          options: q.options ?? [],
        })),
      })),
    }
    setTest(normalized)
    setSnapshot(JSON.stringify(normalized))
  }, [])

  const load = useCallback(async () => {
    try {
      const [t, v] = await Promise.all([
        readingApi.adminGet(testId), // GET /admin/reading-tests/{id} — correct_answer bilan
        readingApi.versions(testId).catch(() => []),
      ])
      applyLoaded(t)
      setVersions(v)
    } catch (err) {
      console.error('Reading testni yuklashda xato:', err)
      setError(err instanceof ApiRequestError ? `Testni yuklab bo'lmadi: ${err.message}` : "Testni yuklab bo'lmadi")
    }
  }, [testId, applyLoaded])

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin, load])

  // Saqlanmagan o'zgarishlar bilan sahifadan chiqishni ogohlantirish
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ── Holatni o'zgartirish ──
  function updateTest<K extends keyof ReadingTest>(key: K, value: ReadingTest[K]) {
    setTest(t => (t ? { ...t, [key]: value } : t))
  }
  /** Demo / Bepul / Mock / Faol: draftda forma bilan saqlanadi, lock qilingan testda darhol serverga yuboriladi */
  async function toggleFlag(key: 'is_demo' | 'is_free' | 'is_mock' | 'is_active', value: boolean) {
    if (!test) return
    const prev = !!test[key]
    updateTest(key, value as any)
    if (!isLocked) return
    setFlagBusy(true); setError(null)
    try {
      await readingApi.update(testId, { [key]: value } as Parameters<typeof readingApi.update>[1])
      await load()
    } catch (err) {
      updateTest(key, prev as any)
      setError(err instanceof ApiRequestError ? err.message : "Belgini o'zgartirishda xatolik")
    } finally {
      setFlagBusy(false)
    }
  }
  function patchParts(fn: (parts: ReadingPart[]) => ReadingPart[]) {
    setTest(t => (t ? { ...t, parts: fn(t.parts) } : t))
  }
  function updatePart(idx: number, patch: Partial<ReadingPart>) {
    patchParts(ps => ps.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }
  function patchQuestions(pIdx: number, fn: (qs: ReadingQuestion[]) => ReadingQuestion[]) {
    patchParts(ps => ps.map((p, i) => (i === pIdx ? { ...p, questions: fn(p.questions) } : p)))
  }
  function addPart() {
    patchParts(ps => [...ps, emptyPart()])
  }
  function removePart(idx: number) {
    if (!confirm("Bu qismni savollari bilan birga o'chirasizmi?")) return
    patchParts(ps => ps.filter((_, i) => i !== idx))
  }
  function handleAddQuestion(pIdx: number, q: ReadingQuestion) {
    patchQuestions(pIdx, qs => [...qs, q])
  }
  function updateQuestion(pIdx: number, qIdx: number, patch: Partial<ReadingQuestion>) {
    patchQuestions(pIdx, qs => qs.map((q, i) => (i === qIdx ? { ...q, ...patch } : q)))
  }
  function removeQuestion(pIdx: number, qIdx: number) {
    patchQuestions(pIdx, qs => qs.filter((_, i) => i !== qIdx))
  }
  function duplicateQuestion(pIdx: number, qIdx: number) {
    const num = nextQuestionNumber
    patchQuestions(pIdx, qs => {
      const src = qs[qIdx]
      const copy: ReadingQuestion = {
        ...src,
        question_number: num,
        correct_answer: [...(src.correct_answer ?? [])],
        options: (src.options ?? []).map(o => ({ ...o })),
      }
      return [...qs.slice(0, qIdx + 1), copy, ...qs.slice(qIdx + 1)]
    })
  }
  /** Barcha savollarni 1 dan boshlab ketma-ket raqamlash */
  function renumberAll() {
    if (!confirm('Barcha savollar 1 dan boshlab ketma-ket qayta raqamlansinmi?')) return
    let n = 0
    patchParts(ps => ps.map(p => ({ ...p, questions: p.questions.map(q => ({ ...q, question_number: ++n })) })))
  }

  // ── Saqlash / Lock ──
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!test || saving) return false
    if (answersMissing) {
      setError("Server to'g'ri javoblarni qaytarmadi. Saqlash bloklandi, aks holda javoblar o'chib ketadi.")
      return false
    }
    setSaving(true); setError(null)
    try {
      // Backend: word_limit int (null emas), correct_answer va options doim ro'yxat
      const cleanParts = test.parts.map(part => ({
        ...part,
        questions: part.questions.map(q => ({
          ...q,
          word_limit: q.word_limit ?? 0,
          correct_answer: q.correct_answer ?? [],
          options: (q.options ?? []).map(o => ({ label: o.label, value: o.value })),
        })),
      }))
      await readingApi.update(testId, {
        title: test.title,
        cefr_level: test.cefr_level,
        duration_minutes: test.duration_minutes,
        total_questions: test.parts.reduce((n, p) => n + p.questions.length, 0),
        is_demo: test.is_demo,
        is_free: test.is_free,
        is_mock: test.is_mock,
        is_active: test.is_active,
        parts: cleanParts,
      })
      // Update javobida to'g'ri javoblar bo'lmasligi mumkin — holatni serverdan qayta olamiz
      await load()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
      return true
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Saqlashda xatolik')
      return false
    } finally {
      setSaving(false)
    }
  }, [test, testId, saving, load, answersMissing])

  // Ctrl/Cmd + S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!isLocked && dirty) handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLocked, dirty, handleSave])

  async function handleLock() {
    if (!confirm("Testni lock qilishni tasdiqlaysizmi? Lock qilingandan so'ng tuzilma o'zgarmaydi.")) return
    setError(null); setLockErrors([])
    // Server saqlangan holatni tekshiradi, shuning uchun avval saqlaymiz
    if (dirty && !(await handleSave())) return
    setLocking(true)
    try {
      const res = await readingApi.lock(testId)
      if (!res.success) {
        setLockErrors(res.errors ?? [])
      } else {
        await load()
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Lock qilishda xatolik')
    } finally {
      setLocking(false)
    }
  }

  async function dl(url: string, filename: string) {
    setBusy(b => ({ ...b, [filename]: true }))
    await authenticatedDownload(url, { filename, onError: setError })
    setBusy(b => ({ ...b, [filename]: false }))
  }

  // ── Kirish holatlari ──
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
        : <p className="animate-pulse text-sm text-muted-foreground">Yuklanmoqda...</p>}
    </main>
  )

  const paperKey = `${testId}-paper.pdf`
  const omrKey = `${testId}-answer-sheet.pdf`

  return (
    <>
      {addModal && (
        <AddQuestionModal
          partIdx={addModal.partIdx}
          nextNum={nextQuestionNumber}
          onAdd={handleAddQuestion}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* Sticky panel */}
      <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/reading"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Orqaga"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight">{test.title || test.id}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {test.id} · {totalQuestions} savol
                {totalIssues > 0 && <span className="text-amber-700"> · {totalIssues} ta ogohlantirish</span>}
              </p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isLocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
              {isLocked ? <><Lock className="size-3" />LOCKED</> : <><Unlock className="size-3" />DRAFT</>}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isLocked && (
              <span className="mr-1 text-xs text-muted-foreground" aria-live="polite">
                {saving ? 'Saqlanmoqda...'
                  : dirty ? <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber-500" />Saqlanmagan o'zgarishlar</span>
                    : justSaved ? <span className="flex items-center gap-1 text-emerald-700"><Check className="size-3.5" />Saqlandi</span>
                      : null}
              </span>
            )}
            <button
              onClick={() => dl(readingApi.paperPdfUrl(testId), paperKey)}
              disabled={!isLocked || !!busy[paperKey]}
              title={!isLocked ? 'Avval testni lock qiling' : undefined}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <FileDown className="size-3.5" /> Paper PDF
            </button>
            <button
              onClick={() => dl(readingApi.answerSheetUrl(testId), omrKey)}
              disabled={!isLocked || !!busy[omrKey]}
              title={!isLocked ? 'Avval testni lock qiling' : undefined}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <FileDown className="size-3.5" /> OMR varaq
            </button>
            {!isLocked && (
              <button
                onClick={() => handleSave()}
                disabled={saving || !dirty || answersMissing}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                <Save className="size-3.5" /> Saqlash
              </button>
            )}
            <button
              onClick={handleLock}
              disabled={locking || saving || isLocked || answersMissing}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Lock className="size-3.5" />
              {isLocked ? 'Lock qilingan' : locking ? 'Tekshirilmoqda...' : 'Validate & Lock'}
            </button>
          </div>
        </div>
      </div>

      <main className="container-shell space-y-6 py-8">
        {/* Xabarlar */}
        {answersMissing && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4" /> To'g'ri javoblar serverdan kelmadi</p>
            <p className="mt-1">Admin endpoint <code>correct_answer</code> qaytarishi kerak. Tuzatilmaguncha saqlash va lock o'chirilgan.</p>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {lockErrors.length > 0 && (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-4" /> Lock qilib bo'lmadi ({lockErrors.length}):
            </p>
            <ul className="mt-1 list-disc pl-5">
              {lockErrors.map((e, i) => <li key={i}>{formatLockError(e)}</li>)}
            </ul>
          </div>
        )}
        {isLocked && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Bu test lock qilingan (v{latestVersion.version_number}). Tuzilmani o'zgartirib bo'lmaydi, lekin Demo / Bepul / Mock / Faol belgilarini o'zgartirish mumkin.
          </p>
        )}

        {/* Umumiy ma'lumotlar */}
        <section className="surface grid gap-4 p-5 sm:grid-cols-2">
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
            <select disabled title="Til faqat test yaratishda belgilanadi" value={test.language} onChange={e => updateTest('language', e.target.value)} className="field">
              {READING_LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label-xs">Davomiyligi (daqiqa)</span>
            <input
              disabled={isLocked} type="number" min={10} value={test.duration_minutes}
              onChange={e => updateTest('duration_minutes', Number(e.target.value))} className="field"
            />
          </label>
          <fieldset className="flex flex-wrap items-end gap-2 pb-1">
            <legend className="sr-only">Test sozlamalari</legend>
            {(['is_demo', 'is_free', 'is_mock', 'is_active'] as const).map(key => {
              const labels = { is_demo: 'Demo', is_free: 'Bepul', is_mock: 'Mock', is_active: 'Faol' }
              const on = !!test[key]
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground'
                    } focus-within:ring-2 focus-within:ring-primary/40 ${flagBusy ? 'opacity-60' : ''}`}
                >
                  <input
                    disabled={flagBusy} type="checkbox" checked={on} className="sr-only"
                    onChange={e => toggleFlag(key, e.target.checked)}
                  />
                  {on && <Check className="size-3.5" />}
                  {labels[key]}
                </label>
              )
            })}
          </fieldset>
        </section>

        {/* Qismlar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Qismlar ({test.parts.length})</h2>
            {!isLocked && (
              <div className="flex items-center gap-2">
                {totalQuestions > 1 && (
                  <button
                    onClick={renumberAll}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <ListOrdered className="size-3.5" /> Qayta raqamlash
                  </button>
                )}
                <button
                  onClick={addPart}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <Plus className="size-3.5" /> Qism qo'shish
                </button>
              </div>
            )}
          </div>

          {test.parts.map((part, pIdx) => (
            <PartCard
              key={pIdx}
              part={part}
              pIdx={pIdx}
              locked={isLocked}
              dupNums={dupNums}
              expected={TEMPLATE_RANGES[pIdx]}
              onPatch={patch => updatePart(pIdx, patch)}
              onRemove={() => removePart(pIdx)}
              onAddQuestion={() => setAddModal({ partIdx: pIdx })}
              onUpdateQuestion={(qIdx, patch) => updateQuestion(pIdx, qIdx, patch)}
              onRemoveQuestion={qIdx => removeQuestion(pIdx, qIdx)}
              onDuplicateQuestion={qIdx => duplicateQuestion(pIdx, qIdx)}
            />
          ))}

          {test.parts.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">Hali qismlar yo'q.</p>
              {!isLocked && (
                <button onClick={addPart} className="mt-3 text-sm font-semibold text-primary hover:underline">
                  Birinchi qismni qo'shish
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}