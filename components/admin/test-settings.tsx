/**
 * components/admin/test-settings.tsx
 * =====================================
 * 4 ta skill (Reading, Listening, Writing, Speaking) uchun
 * umumiy "Test Sozlamalari" bo'limi komponenti.
 *
 * Har bir skillda umumiy maydonlar:
 *   - Sarlavha (title)       — barchada
 *   - CEFR darajasi          — reading, listening, writing
 *   - Til (language)         — faqat reading
 *   - Davomiyligi (daqiqa)   — reading, listening, writing
 *   - Tavsif (description)   — speaking (writing ham qo'llab-quvvatlaydi)
 *   - Bo'limlar tavsifi      — faqat listening
 *   - Bayroqlar (checkboxes) — barchada: Demo, Bepul, Mashq, Faol
 */

import { adminInput, adminCard } from '@/components/admin/ui/styles'
import type { ReactNode } from 'react'

// ─── Tip ta'riflari ──────────────────────────────────────────────────────────

export type SkillType = 'reading' | 'listening' | 'writing' | 'speaking'

/** Umumiy bayroq maydonlari — barcha 4 skill uchun bir xil */
export interface TestFlags {
  is_demo: boolean
  is_free: boolean
  is_practice: boolean
  is_active: boolean
}

/** TestSettings komponentiga uzatiladigan props */
export interface TestSettingsProps<T extends TestFlags> {
  skill: SkillType

  /** Joriy test ob'ekti (barcha maydonlar shu yerdan o'qiladi) */
  value: T

  /** Maydon o'zgarishi — bitta kalit va yangi qiymat */
  onChange: <K extends keyof T>(key: K, val: T[K]) => void

  /** Bloklash holati: true bo'lsa barcha inputlar disabled */
  disabled?: boolean

  /** CEFR darajasi ro'yxati (default: A1–C2 + Multilevel) */
  cefrLevels?: string[]

  /** Til ro'yxati — faqat reading uchun (default: en, uz, ru) */
  languages?: string[]

  /** Sarlavha so'ngiga qo'shimcha element (o'ng tomonga) */
  headerExtra?: ReactNode
}

// ─── Default qiymatlar ───────────────────────────────────────────────────────

const DEFAULT_CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']
const DEFAULT_LANGS = ['en', 'uz', 'ru']

const FLAG_LABELS: [keyof TestFlags, string][] = [
  ['is_demo',     'Demo'],
  ['is_free',     'Bepul'],
  ['is_practice', 'Mashq (practice) testi'],
  ['is_active',   'Faol'],
]

// ─── Label uchun yordamchi ───────────────────────────────────────────────────
function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  )
}

// ─── Asosiy komponent ────────────────────────────────────────────────────────
export function TestSettings<T extends TestFlags & Record<string, unknown>>({
  skill,
  value,
  onChange,
  disabled = false,
  cefrLevels = DEFAULT_CEFR,
  languages = DEFAULT_LANGS,
  headerExtra,
}: TestSettingsProps<T>) {

  const isReading   = skill === 'reading'
  const isListening = skill === 'listening'
  const isWriting   = skill === 'writing'
  const isSpeaking  = skill === 'speaking'

  /** Sarlavha fieldname — listening "title", boshqalar ham "title" */
  const titleKey   = 'title' as keyof T
  /** CEFR fieldname — listening "level", boshqalar "cefr_level" */
  const cefrKey    = isListening ? 'level' : 'cefr_level'
  /** Davomiylik fieldname — listening "duration", boshqalar "duration_minutes" */
  const durKey     = isListening ? 'duration' : 'duration_minutes'

  // speaking: description; listening: sections
  const hasDescription = isSpeaking || isWriting
  const hasSections    = isListening
  const hasCefr        = !isSpeaking
  const hasLanguage    = isReading
  const hasDuration    = !isSpeaking

  return (
    <section className={`space-y-4 ${adminCard}`}>
      {/* Sarlavha + ixtiyoriy o'ng element */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Test Sozlamalari
        </h2>
        {headerExtra}
      </div>

      {/* Asosiy maydonlar grid */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* ── Sarlavha (har doim 2 ustun kengligida) ── */}
        <label className="block sm:col-span-2">
          <FieldLabel>Sarlavha</FieldLabel>
          <input
            type="text"
            disabled={disabled}
            value={String(value[titleKey] ?? '')}
            onChange={e => onChange(titleKey, e.target.value as T[keyof T])}
            className={adminInput}
          />
        </label>

        {/* ── CEFR darajasi ── */}
        {hasCefr && (
          <label className="block">
            <FieldLabel>CEFR darajasi</FieldLabel>
            <select
              disabled={disabled}
              value={String(value[cefrKey as keyof T] ?? '')}
              onChange={e => onChange(cefrKey as keyof T, e.target.value as T[keyof T])}
              className={adminInput}
            >
              {cefrLevels.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
        )}

        {/* ── Til (faqat reading) ── */}
        {hasLanguage && (
          <label className="block">
            <FieldLabel>Til</FieldLabel>
            <select
              disabled
              title="Til faqat test yaratishda belgilanadi"
              value={String(value['language' as keyof T] ?? '')}
              onChange={e => onChange('language' as keyof T, e.target.value as T[keyof T])}
              className={adminInput}
            >
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </label>
        )}

        {/* ── Davomiyligi ── */}
        {hasDuration && (
          <label className="block">
            <FieldLabel>Davomiyligi (daqiqa)</FieldLabel>
            <input
              type="number"
              min={10}
              disabled={disabled}
              value={Number(value[durKey as keyof T] ?? 0)}
              onChange={e => onChange(durKey as keyof T, Number(e.target.value) as T[keyof T])}
              className={adminInput}
            />
          </label>
        )}

        {/* ── Tavsif (speaking + writing) ── */}
        {hasDescription && (
          <label className="block">
            <FieldLabel>Tavsif (Description)</FieldLabel>
            <input
              type="text"
              disabled={disabled}
              value={String(value['description' as keyof T] ?? '')}
              onChange={e => onChange('description' as keyof T, e.target.value as T[keyof T])}
              className={adminInput}
            />
          </label>
        )}

        {/* ── Bo'limlar tavsifi (faqat listening) ── */}
        {hasSections && (
          <label className="block sm:col-span-2">
            <FieldLabel>Bo'limlar tavsifi (ixtiyoriy matn)</FieldLabel>
            <input
              type="text"
              disabled={disabled}
              value={String(value['sections' as keyof T] ?? '')}
              onChange={e => onChange('sections' as keyof T, e.target.value as T[keyof T])}
              className={adminInput}
            />
          </label>
        )}

        {/* ── Bayroqlar (checkboxes) ── */}
        <div className="flex flex-wrap items-center gap-4 pt-1 sm:col-span-2">
          {FLAG_LABELS.map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!value[key]}
                onChange={e => onChange(key as keyof T, e.target.checked as T[keyof T])}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {label}
            </label>
          ))}
        </div>

      </div>
    </section>
  )
}
