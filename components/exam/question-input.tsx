'use client'

/**
 * Practice (Reading / Listening) uchun bitta savol turini chizadigan umumiy komponent.
 *
 * Javob formati: har doim `string[]` (backend `answers: string[]` kutadi).
 * Variantli savollarda yuboriladigan qiymat — variantning `label`i (harf: "A", "B", ...),
 * chunki admin JSON shabloni `{"label":"A","value":"matn"}` va `correct_answer: "A"` shaklida.
 */

import { Check } from 'lucide-react'
import { TONES, type Tone } from '@/lib/brand'
import { EXAM_FOCUS as FOCUS } from '@/lib/exam-theme'
import { QuestionCard, QuestionHead, SKILL_META, TextQuestionCard } from './exam-ui'

export interface ExamOption { label: string; value: string }

export interface ExamQuestion {
  id?: number | null
  number: number
  type: string
  text: string
  options?: ExamOption[]
}

const TFNG: ExamOption[] = [
  { label: 'A', value: 'TRUE' },
  { label: 'B', value: 'FALSE' },
  { label: 'C', value: 'NOT GIVEN' },
]
const YNNG: ExamOption[] = [
  { label: 'A', value: 'YES' },
  { label: 'B', value: 'NO' },
  { label: 'C', value: 'NOT GIVEN' },
]

const MATCH_TYPES = new Set(['MATCHING', 'TEXT_MATCH', 'HEADINGS_MATCH', 'MATCHING_HEADINGS', 'MAP_LABELING', 'MAP_DIAGRAM'])

export function QuestionInput({
  q, value, onChange, tone, fontSize, disabled,
}: {
  q: ExamQuestion
  value: string[]
  onChange: (v: string[]) => void
  tone: Tone
  fontSize?: number
  disabled?: boolean
}) {
  const type = q.type.toUpperCase()
  const options = q.options ?? []
  const single = value[0] ?? ''
  const set = (v: string) => { if (!disabled) onChange(v ? [v] : []) }

  if (type === 'TRUE_FALSE_NOT_GIVEN') {
    return <QuestionCard number={q.number} question={q.text} options={TFNG} value={single} onChange={set} tone={tone} fontSize={fontSize} />
  }
  if (type === 'YES_NO_NOT_GIVEN') {
    return <QuestionCard number={q.number} question={q.text} options={YNNG} value={single} onChange={set} tone={tone} fontSize={fontSize} />
  }

  if (type === 'MULTIPLE_SELECT' && options.length) {
    const { tint, mid } = SKILL_META[tone]
    const accent = TONES[tone]
    const toggle = (label: string) => {
      if (disabled) return
      onChange(value.includes(label) ? value.filter(v => v !== label) : [...value, label].sort())
    }
    return (
      <div
        className="overflow-hidden rounded-xl border transition-all"
        style={{ backgroundColor: '#FFFFFF', borderColor: value.length ? mid : 'rgba(11,11,13,.1)', boxShadow: value.length ? `0 0 0 3px ${tint}` : 'none' }}
      >
        <QuestionHead number={q.number} question={q.text} answered={value.length > 0} accent={accent} fontSize={fontSize} />
        <div className="flex flex-col gap-2 p-3">
          {options.map(o => {
            const on = value.includes(o.label)
            return (
              <button
                key={o.label}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(o.label)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${FOCUS}`}
                style={on ? { backgroundColor: tint, borderColor: accent } : { backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.1)' }}
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded border"
                  style={on ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { borderColor: 'rgba(11,11,13,.25)', backgroundColor: '#E5E5E5' }}
                  aria-hidden
                >
                  {on && <Check size={13} />}
                </span>
                <span className="text-xs font-bold" style={{ color: on ? accent : 'rgba(11,11,13,.45)' }}>{o.label}</span>
                <span className="leading-snug" style={{ fontSize: fontSize ?? 14 }}>{o.value}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (MATCH_TYPES.has(type) && options.length) {
    const { tint, mid } = SKILL_META[tone]
    const accent = TONES[tone]
    const id = `q-match-${tone}-${q.number}`
    return (
      <div
        className="overflow-hidden rounded-xl border transition-all"
        style={{ backgroundColor: '#FFFFFF', borderColor: single ? mid : 'rgba(11,11,13,.1)', boxShadow: single ? `0 0 0 3px ${tint}` : 'none' }}
      >
        <QuestionHead number={q.number} question={q.text} answered={!!single} accent={accent} fontSize={fontSize} />
        <div className="p-3">
          <label htmlFor={id} className="sr-only">{q.number}-savol javobi</label>
          <select
            id={id}
            value={single}
            disabled={disabled}
            onChange={e => set(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm ${FOCUS}`}
            style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.12)', color: '#0B0B0D' }}
          >
            <option value="">Javobni tanlang...</option>
            {options.map(o => <option key={o.label} value={o.label}>{o.label}. {o.value}</option>)}
          </select>
        </div>
      </div>
    )
  }

  if (options.length) {
    // MULTIPLE_CHOICE va variantlari bor boshqa turlar
    return <QuestionCard number={q.number} question={q.text} options={options} value={single} onChange={set} tone={tone} fontSize={fontSize} />
  }

  // GAP_FILL, GAP_FILL_FILL, SHORT_ANSWER, SENTENCE_COMPLETION va h.k. — matn javobi
  return <TextQuestionCard number={q.number} question={q.text} value={single} onChange={v => set(v)} tone={tone} fontSize={fontSize} />
}
