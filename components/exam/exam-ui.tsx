'use client'

/**
 * Imtihon sahifalari uchun qayta ishlatiladigan UI komponentlari.
 * PartTabs, ExamAudioPlayer, QuestionCard, TextQuestionCard, ExamTimer(Chip), QuestionNav,
 * FontSizeControl, ExamUtilityRail, ExamFab, PartNav.
 * Namuna: imthon_tizmi (Listening/Reading) — o'ng "utility rail": Time, Finish, Text Size, Volume, Questions.
 * Brand tokenlar: CANVAS, PAPER, INK, TONES (blue/purple/orange/red)
 */

import { useCallback, useRef, useState, type ReactNode } from 'react'
import {
  Check, ChevronLeft, ChevronRight, Clock, Flag, Folder, FolderOpen,
  ListOrdered, Minus, Plus, Type, Volume2, VolumeX,
} from 'lucide-react'
import { TONES, type Tone } from '@/lib/brand'
import { EXAM_FOCUS as FOCUS } from '@/lib/exam-theme'
import { formatClock } from '@/lib/use-countdown'

// ─── SKILL ACCENT ──────────────────────────────────────────────────────────
export const SKILL_META: Record<Tone, { tint: string; mid: string; label: string }> = {
  blue:   { tint: '#F7F9D8', mid: '#D2E600', label: 'Reading'   },
  purple: { tint: '#F7F9D8', mid: '#D2E600', label: 'Listening' },
  orange: { tint: '#F7F9D8', mid: '#D2E600', label: 'Writing'   },
  red:    { tint: '#F7F9D8', mid: '#D2E600', label: 'Speaking'  },
}

// ─── PART TABS ─────────────────────────────────────────────────────────────
/** Namuna: `md-card` ichidagi markazlashgan raqamli "pill" tablar (tugallangan qism yashil). */
export function PartTabs({
  parts, activeIdx, answeredByPart = {}, totalByPart = {}, badges, doneByPart, tone = 'purple', onChange, label = 'Part',
}: {
  parts: Array<{ id?: number | string; title?: string }>
  activeIdx: number
  answeredByPart?: Record<number, number>
  totalByPart?: Record<number, number>
  /** Har bir tab yonidagi matn (masalan so'zlar soni). Berilsa, `done/total` o'rniga ko'rsatiladi. */
  badges?: Record<number, string>
  /** Tab "tayyor" (yashil) holatini qo'lda belgilash. Berilmasa answered >= total bo'yicha. */
  doneByPart?: Record<number, boolean>
  tone?: Tone
  onChange: (idx: number) => void
  label?: string
}) {
  const accent = TONES[tone]

  return (
    <div
      className="rounded-2xl border px-3 py-3"
      style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)' }}
    >
      <div role="tablist" aria-label={`${label}lar`} className="flex flex-wrap justify-center gap-2">
        {parts.map((p, idx) => {
          const isActive = activeIdx === idx
          const total = totalByPart[idx] ?? 0
          const done = answeredByPart[idx] ?? 0
          const isDone = (doneByPart ? !!doneByPart[idx] : total > 0 && done >= total) && !isActive
          const Icon = isActive ? FolderOpen : Folder
          return (
            <button
              key={p.id ?? idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={p.title || `${label} ${idx + 1}`}
              title={p.title || `${label} ${idx + 1}`}
              onClick={() => onChange(idx)}
              className={`inline-flex min-w-12 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${FOCUS}`}
              style={
                isActive
                  ? { backgroundColor: '#E4F70A', color: '#0B0B0D', borderColor: 'transparent', boxShadow: '0 6px 16px rgba(11,11,13,.10)' }
                  : isDone
                  ? { backgroundColor: '#F0FDF4', color: '#16A34A', borderColor: '#86EFAC' }
                  : { backgroundColor: '#fff', color: 'rgba(11,11,13,.6)', borderColor: 'rgba(11,11,13,.14)' }
              }
            >
              {isDone ? <Check size={13} /> : <Icon size={13} />}
              {idx + 1}
              {badges?.[idx] !== undefined ? (
                <span className="text-[10px] font-semibold opacity-70">{badges[idx]}</span>
              ) : total > 0 ? (
                <span className="text-[10px] font-semibold opacity-70">{done}/{total}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── AUDIO PLAYER ──────────────────────────────────────────────────────────
export function ExamAudioPlayer({
  src, tone = 'purple', volume: volumeProp, muted: mutedProp, onVolumeChange, onProgress, onEnded,
}: {
  src: string
  tone?: Tone
  /** Berilsa, ovoz balandligi tashqaridan boshqariladi (rail'dagi Volume kartasi). 0..1 */
  volume?: number
  muted?: boolean
  onVolumeChange?: (v: number, muted: boolean) => void
  onProgress?: (currentTime: number, duration: number) => void
  /** Audio tugaganda caller testni yakunlashi mumkin. */
  onEnded?: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volumeLocal, setVolumeLocal] = useState(0.8)
  const [mutedLocal, setMutedLocal] = useState(false)
  const controlled = volumeProp !== undefined
  const volume = controlled ? volumeProp! : volumeLocal
  const muted = controlled ? !!mutedProp : mutedLocal
  const accent = TONES[tone]

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }, [])

  const seek = (value: number) => {
    const a = audioRef.current
    if (!a || !duration) return
    a.currentTime = value
    setCurrentTime(value)
  }

  const setVolume = (v: number) => {
    if (controlled) onVolumeChange?.(v, false)
    else { setVolumeLocal(v); setMutedLocal(false) }
  }
  const toggleMute = () => {
    if (controlled) onVolumeChange?.(volume, !muted)
    else setMutedLocal(m => !m)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border px-4 py-3" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)' }}>
      <audio
        ref={(el) => {
          audioRef.current = el
          if (el) { el.volume = volume; el.muted = muted }
        }}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          const total = audioRef.current?.duration ?? 0
          onProgress?.(total, total)
          onEnded?.()
        }}
        onTimeUpdate={() => {
          const current = audioRef.current?.currentTime ?? 0
          const total = audioRef.current?.duration ?? 0
          setCurrentTime(current)
          onProgress?.(current, Number.isFinite(total) ? total : 0)
        }}
        onLoadedMetadata={() => {
          const total = audioRef.current?.duration ?? 0
          setDuration(Number.isFinite(total) ? total : 0)
          onProgress?.(audioRef.current?.currentTime ?? 0, Number.isFinite(total) ? total : 0)
        }}
      />

      {/* Play/Pause */}
      <button
        type="button"
        onClick={toggle}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-95 ${FOCUS}`}
        style={{ backgroundColor: accent }}
        aria-label={playing ? 'Pauza' : 'Ijro etish'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </button>

      {/* Track */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-xs font-semibold" style={{ color: 'rgba(11,11,13,.55)' }}>Audio eshittirish</p>
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums" style={{ color: 'rgba(11,11,13,.45)' }}>
            {formatClock(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            disabled={!duration}
            onChange={e => seek(+e.target.value)}
            aria-label="Audio o'rni"
            className="h-1.5 flex-1 cursor-pointer disabled:cursor-not-allowed"
            style={{ accentColor: accent }}
          />
          <span className="w-10 shrink-0 text-[11px] tabular-nums" style={{ color: 'rgba(11,11,13,.45)' }}>
            {formatClock(duration)}
          </span>
        </div>
      </div>

      {/* Volume (rail yo'q kichik ekranlarda, yoki mustaqil rejimda) */}
      <div className={`items-center gap-2 ${controlled ? 'flex lg:hidden' : 'hidden sm:flex'}`}>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
          className={`flex size-8 items-center justify-center rounded-lg transition ${FOCUS}`}
          style={{ color: 'rgba(11,11,13,.45)' }}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <input
          type="range" min={0} max={1} step={0.05}
          value={muted ? 0 : volume}
          onChange={e => setVolume(+e.target.value)}
          aria-label="Ovoz balandligi"
          className="w-16 cursor-pointer"
          style={{ accentColor: accent }}
        />
      </div>
    </div>
  )
}

// ─── QUESTION CARD ─────────────────────────────────────────────────────────
export function QuestionHead({ number, question, answered, accent, fontSize }: {
  number: number; question: string; answered: boolean; accent: string; fontSize?: number
}) {
  return (
    <div
      className="flex items-start gap-3 border-b px-4 py-3"
      style={{ backgroundColor: '#F7F7F5', borderColor: 'rgba(11,11,13,.08)' }}
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white transition-colors"
        style={{ backgroundColor: answered ? '#16A34A' : accent }}
        aria-hidden
      >
        {answered ? <Check size={11} /> : number}
      </span>
      <p className="pt-px text-sm font-semibold leading-snug" style={{ color: '#0B0B0D', fontSize }}>
        <span className="sr-only">{number}-savol. </span>
        {question}
      </p>
    </div>
  )
}

/** Variantli savol. Namuna: `wrapper12` — raqamlangan sarlavha + radio "dot" variantlar. */
export function QuestionCard({
  number, question, options, value, onChange, tone = 'purple', fontSize,
}: {
  number: number
  question: string
  options: Array<{ label: string; value: string }>
  value?: string
  onChange: (v: string) => void
  tone?: Tone
  fontSize?: number
}) {
  const { tint, mid } = SKILL_META[tone]
  const accent = TONES[tone]
  const answered = !!value
  const name = `q-${tone}-${number}`

  return (
    <fieldset
      className="m-0 min-w-0 overflow-hidden rounded-xl border p-0 transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: answered ? mid : 'rgba(11,11,13,.1)',
        boxShadow: answered ? `0 0 0 3px ${tint}` : 'none',
      }}
    >
      <legend className="sr-only">{number}-savol</legend>
      <QuestionHead number={number} question={question} answered={answered} accent={accent} fontSize={fontSize} />

      <div className="flex flex-col gap-2 p-3">
        {options.map(opt => {
          const selected = value === opt.label
          const id = `${name}-${opt.label}`
          return (
            <div key={opt.label}>
              <input
                id={id}
                type="radio"
                name={name}
                value={opt.label}
                checked={selected}
                onChange={() => onChange(opt.label)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-foreground peer-focus-visible:ring-offset-2"
                style={
                  selected
                    ? { backgroundColor: tint, borderColor: accent }
                    : { backgroundColor: '#ffffff', borderColor: 'rgba(11,11,13,.1)' }
                }
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border transition-all"
                  style={selected ? { borderColor: accent, backgroundColor: '#fff' } : { borderColor: 'rgba(11,11,13,.25)', backgroundColor: '#E5E5E5' }}
                  aria-hidden
                >
                  <span
                    className="size-2.5 rounded-full transition-transform"
                    style={{ backgroundColor: accent, transform: selected ? 'scale(1)' : 'scale(0)' }}
                  />
                </span>
                <span className="text-xs font-bold" style={{ color: selected ? accent : 'rgba(11,11,13,.45)' }}>
                  {opt.label}
                </span>
                <span className="leading-snug" style={{ color: '#0B0B0D', fontWeight: selected ? 500 : 400, fontSize: fontSize ?? 14 }}>
                  {opt.value}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

// ─── TEXT ANSWER CARD ──────────────────────────────────────────────────────
export function TextQuestionCard({
  number, question, value, onChange, tone = 'purple', fontSize,
}: {
  number: number
  question: string
  value: string
  onChange: (v: string) => void
  tone?: Tone
  fontSize?: number
}) {
  const { tint, mid } = SKILL_META[tone]
  const accent = TONES[tone]
  const answered = value.trim().length > 0
  const inputId = `q-text-${tone}-${number}`

  return (
    <div
      className="overflow-hidden rounded-xl border transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: answered ? mid : 'rgba(11,11,13,.1)',
        boxShadow: answered ? `0 0 0 3px ${tint}` : 'none',
      }}
    >
      <QuestionHead number={number} question={question} answered={answered} accent={accent} fontSize={fontSize} />
      <div className="p-3">
        <label htmlFor={inputId} className="sr-only">{number}-savol javobi</label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Javobingizni yozing..."
          autoComplete="off"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all"
          style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.12)', color: '#0B0B0D' }}
          onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${tint}` }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(11,11,13,.12)'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>
    </div>
  )
}

// ─── TIMER ─────────────────────────────────────────────────────────────────
function timerColor(left: number | undefined) {
  if (left === undefined) return '#0B0B0D'
  return left < 60 ? '#DC2626' : left < 300 ? '#D97706' : '#0B0B0D'
}

/** Appbar markazidagi taymer chip'i (namuna: Writing `timer-display-header`). */
export function ExamTimerChip({ left }: { left: number | undefined }) {
  if (left === undefined) return null
  const color = timerColor(left)
  return (
    <span
      role="timer"
      aria-label={left <= 0 ? 'Vaqt tugadi' : `Qolgan vaqt ${formatClock(left)}`}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold tabular-nums transition-colors"
      style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.12)', color }}
    >
      <Clock size={14} aria-hidden />
      {formatClock(left)}
    </span>
  )
}

/** Rail kartasi ichidagi katta taymer. `left` — useCountdown'dan. */
export function ExamTimer({ left }: { left: number }) {
  const color = timerColor(left)
  return (
    <div role="timer">
      <p className="text-center text-3xl font-bold tabular-nums leading-none tracking-tight transition-colors" style={{ color }}>
        {formatClock(left)}
      </p>
      <p className="mt-1.5 text-center text-[11px] font-medium" style={{ color: 'rgba(11,11,13,.45)' }}>
        {left <= 0 ? 'Vaqt tugadi' : 'qolgan vaqt'}
      </p>
    </div>
  )
}

// ─── QUESTION NAVIGATOR ─────────────────────────────────────────────────────
/** Savol raqamlari paneli (namuna: "Questions" number pad). `numbers` — haqiqiy savol raqamlari. */
export function QuestionNav({
  numbers, answered, current, onSelect, tone = 'purple',
}: {
  numbers: number[]
  answered: Set<number>
  current?: number
  onSelect?: (n: number) => void
  tone?: Tone
}) {
  const { tint } = SKILL_META[tone]
  const accent = TONES[tone]

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {numbers.map(n => {
          const isCurrent = current === n
          const isDone = answered.has(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect?.(n)}
              aria-label={`${n}-savol${isDone ? ', javob berilgan' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={`aspect-square rounded-lg text-xs font-bold transition-all ${FOCUS}`}
              style={
                isCurrent
                  ? { backgroundColor: tint, color: accent, border: `1.5px solid ${accent}` }
                  : isDone
                  ? { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1.5px solid #86EFAC' }
                  : { backgroundColor: '#fff', color: 'rgba(11,11,13,.55)', border: '1.5px solid rgba(11,11,13,.14)' }
              }
            >
              {n}
            </button>
          )
        })}
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { color: '#F0FDF4', border: '#86EFAC', text: 'Javob berilgan' },
          { color: tint, border: accent, text: 'Joriy' },
          { color: '#fff', border: 'rgba(11,11,13,.14)', text: 'Javob berilmagan' },
        ].map(l => (
          <div key={l.text} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border" style={{ backgroundColor: l.color, borderColor: l.border }} />
            <span className="text-[10px] font-medium" style={{ color: 'rgba(11,11,13,.5)' }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FONT SIZE CONTROL ─────────────────────────────────────────────────────
export function FontSizeControl({
  value, onChange, min = 12, max = 20,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Matnni kichraytirish"
        className={`flex size-8 items-center justify-center rounded-lg border text-sm font-bold transition disabled:opacity-40 ${FOCUS}`}
        style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.14)', color: '#0B0B0D' }}
      >
        <Minus size={13} />
      </button>
      <span className="min-w-[36px] text-center text-xs font-bold" style={{ color: '#0B0B0D' }} aria-live="polite">
        {value}px
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Matnni kattalashtirish"
        className={`flex size-8 items-center justify-center rounded-lg border text-sm font-bold transition disabled:opacity-40 ${FOCUS}`}
        style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.14)', color: '#0B0B0D' }}
      >
        <Plus size={13} />
      </button>
    </div>
  )
}

// ─── UTILITY RAIL ──────────────────────────────────────────────────────────
export function RailCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)' }}>
      <h3
        className="flex items-center gap-2 border-b px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ borderColor: 'rgba(11,11,13,.08)', color: 'rgba(11,11,13,.5)' }}
      >
        {icon}
        {title}
      </h3>
      <div className="p-3.5">{children}</div>
    </section>
  )
}

/**
 * O'ng "utility rail" — tartib namunadagidek: Time, Finish, Text Size, Volume, Questions.
 * Faqat berilgan bo'limlar chiziladi (decorativ/ishlamaydigan kartalar yo'q).
 */
export function ExamUtilityRail({
  secondsLeft,
  questionNumbers,
  answeredSet,
  currentQuestion,
  fontSize,
  onFontChange,
  fontRange,
  volume,
  onFinish,
  onSelectQuestion,
  submitting,
  tone = 'purple',
}: {
  secondsLeft?: number
  questionNumbers: number[]
  answeredSet: Set<number>
  currentQuestion?: number
  fontSize?: number
  onFontChange?: (v: number) => void
  fontRange?: { min: number; max: number }
  volume?: { value: number; muted: boolean; onChange: (v: number, muted: boolean) => void }
  onFinish: () => void
  onSelectQuestion?: (n: number) => void
  submitting?: boolean
  tone?: Tone
}) {
  return (
    <aside aria-label="Imtihon paneli" className="flex flex-col gap-3 lg:sticky lg:top-[calc(4.5rem+16px)]">

      {secondsLeft !== undefined && (
        <RailCard title="Vaqt" icon={<Clock size={13} />}>
          <ExamTimer left={secondsLeft} />
        </RailCard>
      )}

      <button
        type="button"
        onClick={onFinish}
        disabled={submitting}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-foreground transition-all active:scale-[.98] disabled:opacity-60 ${FOCUS}`}
        style={{ backgroundColor: '#E4F70A', color: '#0B0B0D' }}
      >
        <Flag size={15} />
        Tugatish
      </button>

      {fontSize !== undefined && onFontChange && (
        <RailCard title="Matn o'lchami" icon={<Type size={13} />}>
          <FontSizeControl value={fontSize} onChange={onFontChange} min={fontRange?.min} max={fontRange?.max} />
        </RailCard>
      )}

      {volume && (
        <RailCard title="Ovoz" icon={volume.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => volume.onChange(volume.value, !volume.muted)}
              aria-label={volume.muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-foreground/5 ${FOCUS}`}
              style={{ color: 'rgba(11,11,13,.55)' }}
            >
              {volume.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.05}
              value={volume.muted ? 0 : volume.value}
              onChange={e => volume.onChange(+e.target.value, false)}
              aria-label="Ovoz balandligi"
              className="w-full cursor-pointer"
              style={{ accentColor: TONES[tone] }}
            />
          </div>
        </RailCard>
      )}

      <RailCard title="Savollar" icon={<ListOrdered size={13} />}>
        <QuestionNav
          numbers={questionNumbers}
          answered={answeredSet}
          current={currentQuestion}
          onSelect={onSelectQuestion}
          tone={tone}
        />
      </RailCard>

    </aside>
  )
}

// ─── MOBILE FAB ────────────────────────────────────────────────────────────
export function ExamFab({ onClick, submitting }: { onClick: () => void; submitting?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className={`fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-foreground shadow-xl transition active:scale-95 disabled:opacity-60 lg:hidden ${FOCUS}`}
      style={{ backgroundColor: '#E4F70A', color: '#0B0B0D' }}
    >
      <Flag size={15} />
      Tugatish
    </button>
  )
}

// ─── PART NAV (prev/next) ──────────────────────────────────────────────────
export function PartNav({
  activeIdx, total, onChange, label = 'qism',
}: { activeIdx: number; total: number; onChange: (idx: number) => void; label?: string }) {
  return (
    <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(11,11,13,.08)' }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, activeIdx - 1))}
        disabled={activeIdx === 0}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${FOCUS}`}
        style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)', color: '#0B0B0D' }}
      >
        <ChevronLeft size={15} /> Oldingi {label}
      </button>
      <span className="text-xs font-medium" style={{ color: 'rgba(11,11,13,.45)' }}>
        {activeIdx + 1} / {total}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(total - 1, activeIdx + 1))}
        disabled={activeIdx === total - 1}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${FOCUS}`}
        style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)', color: '#0B0B0D' }}
      >
        Keyingi {label} <ChevronRight size={15} />
      </button>
    </div>
  )
}
