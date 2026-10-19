'use client'

/**
 * exams_frontend — YAGONA exam qobig'i va yuqori panel.
 * spelpy/components/exam/exam-shell.tsx dan olingan brand tokenlar.
 *
 * Brand:
 *   INK     = '#0B0B0D'   — Steply asosiy matni
 *   PAPER   = '#FFFFFF'   — topbar foni
 *   CANVAS  = '#F7F7F5'   — sahifa foni
 *   LIME    = '#E4F70A'   — Steply aksenti
 *
 * Ko'nikma ranglari (TONES):
 *   blue   '#2563EB'  → Reading
 *   purple '#7C3AED'  → Listening
 *   orange '#EA580C'  → Writing
 *   red    '#DC2626'  → Speaking
 *
 * Foydalanish:
 *   <ExamShell>
 *     <ExamTopBar
 *       backHref="/dashboard/reading"
 *       title="O'qib tushunish"
 *       tone="blue"
 *       timer={<ExamTimerChip seconds={timeLeft} tone="blue" />}
 *       center={<PartTabs ... />}
 *       onSubmit={handleFinish}
 *       submitting={isSubmitting}
 *       progress={answeredCount / totalQuestions * 100}
 *     />
 *     ...sahifa kontenti...
 *   </ExamShell>
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpenText,
  Clock,
  Headphones,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  PenLine,
  Send,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

// ─── BRAND TOKENS ──────────────────────────────────────────────────────────
const INK    = '#0B0B0D'
const PRIMARY_EXAM = '#E4F70A'
const PAPER  = '#FFFFFF'
const CANVAS = '#F7F7F5'

type Tone = 'blue' | 'purple' | 'orange' | 'red'

const TONES: Record<Tone, string> = {
  blue:   '#2563EB',
  purple: '#7C3AED',
  orange: '#EA580C',
  red:    '#DC2626',
}

/** Ko'nikma ikonkasi */
const TONE_ICONS: Record<Tone, ReactNode> = {
  blue:   <BookOpenText size={16} />,
  purple: <Headphones  size={16} />,
  orange: <PenLine     size={16} />,
  red:    <Mic         size={16} />,
}

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4F70A] focus-visible:ring-offset-2'

// ─── FULLSCREEN ────────────────────────────────────────────────────────────
const HINT_KEY = 'steply:exam-fullscreen-hint-dismissed'

export function useFullscreen() {
  const [active, setActive]       = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(
      typeof document !== 'undefined' &&
      !!document.documentElement.requestFullscreen,
    )
    const sync = () => setActive(!!document.fullscreenElement)
    sync()
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const enter  = useCallback(async () => { try { await document.documentElement.requestFullscreen() } catch {} }, [])
  const exit   = useCallback(async () => { try { if (document.fullscreenElement) await document.exitFullscreen() } catch {} }, [])
  const toggle = useCallback(() => (document.fullscreenElement ? exit() : enter()), [enter, exit])

  return { active, supported, enter, exit, toggle }
}

export function ExamFullscreenButton() {
  const { active, supported, toggle } = useFullscreen()
  if (!supported) return null
  const Icon = active ? Minimize2 : Maximize2
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "To'liq ekrandan chiqish" : "To'liq ekran"}
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition hover:bg-[#E4F70A]/5 ${FOCUS}`}
      style={{ backgroundColor: PAPER, borderColor: 'rgba(11,11,13,.1)', color: 'rgba(11,11,13,.6)' }}
    >
      <Icon size={16} />
    </button>
  )
}

function FullscreenHint() {
  const { active, supported, enter } = useFullscreen()
  const [dismissed, setDismissed]    = useState(true)

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(HINT_KEY) === '1') } catch { setDismissed(false) }
  }, [])

  if (!supported || active || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem(HINT_KEY, '1') } catch {}
  }

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ backgroundColor: PAPER, borderColor: 'rgba(11,11,13,.1)' }}
    >
      <Maximize2 size={15} style={{ color: 'rgba(11,11,13,.5)', flexShrink: 0 }} />
      <p className="min-w-0 flex-1 text-sm" style={{ color: 'rgba(11,11,13,.7)' }}>
        Diqqatni jamlash uchun to&#39;liq ekranda ishlash tavsiya etiladi.
      </p>
      <button
        type="button"
        onClick={enter}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${FOCUS}`}
        style={{ backgroundColor: PRIMARY_EXAM, color: '#0B0B0D' }}
      >
        To&#39;liq ekran
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Yopish"
        className={`flex size-7 items-center justify-center rounded-lg transition hover:bg-[#E4F70A]/5 ${FOCUS}`}
        style={{ color: 'rgba(11,11,13,.4)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── EXAM SHELL ────────────────────────────────────────────────────────────
/**
 * Barcha exam sahifalari uchun tashqi qobiq.
 * CANVAS foni, to'liq ekrandan avtomatik chiqish.
 */
export function ExamShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-dvh" style={{ backgroundColor: CANVAS }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#E4F70A] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
      >
        Asosiy qismga o&#39;tish
      </a>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1800px] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] focus:outline-none sm:px-6 lg:px-8"
      >
        <FullscreenHint />
        {children}
      </main>
    </div>
  )
}

// ─── EXAM TOP BAR ──────────────────────────────────────────────────────────
/**
 * Barcha exam sahifalari uchun YAGONA yuqori panel.
 *
 * Chap:   ← orqaga + ko'nikma ikonkasi + sarlavha + badge
 * Markaz: taymer chip va/yoki qism tablari (center prop)
 * O'ng:   foydalanuvchi chip + fullscreen + "Tugatish" tugmasi
 *
 * Pastki qism: progress line (tone rangi bilan)
 */
export function ExamTopBar(props: {
  /** Orqaga qaytish havolasi */
  backHref: string
  /** Bo'lim nomi: "O'qib tushunish", "Tinglab tushunish", ... */
  title: string
  subtitle?: ReactNode
  /** Topbar yonida ko'rinadigan kichik badge (masalan "PRACTICE") */
  badge?: string | null
  /** Markazdagi taymer chip va/yoki qism tablari */
  center?: ReactNode
  /** Qo'shimcha o'ng tomon holati (javoblar soni, so'zlar soni...) */
  status?: ReactNode
  /** Bo'lim (tone) rangi — ikonka, progress line va faol holatlarda ishlatiladi */
  tone?: Tone
  /** Tugatish callback */
  onSubmit?: () => void
  submitting?: boolean
  submitLabel?: string
  /** 0..100 — pastki progress chizig'i */
  progress?: number
}) {
  const {
    backHref, title, subtitle, badge,
    center, status,
    onSubmit, submitting, submitLabel = 'Tugatish',
    progress, tone,
  } = props

  const { user } = useAuth()
  const userName =
    (user as any)?.profile?.full_name ||
    (user as any)?.profile?.username  ||
    (user as any)?.full_name          ||
    null

  const accent     = tone ? TONES[tone] : INK
  const skillIcon  = tone ? TONE_ICONS[tone] : null

  return (
    <div
      className="sticky top-0 z-30 -mx-4 mb-4 rounded-none border-x-0 border-t-0 bg-white shadow-sm sm:-mx-6 lg:-mx-8"
      style={{ borderColor: 'rgba(11,11,13,.08)' }}
    >
      <div className="flex min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">

        {/* Orqaga */}
        <Link
          href={backHref}
          aria-label="Orqaga"
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition hover:bg-[#E4F70A]/5 ${FOCUS}`}
          style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.12)', color: 'rgba(11,11,13,.65)' }}
        >
          <ArrowLeft size={16} />
        </Link>

        {/* Ko'nikma ikonkasi */}
        {skillIcon && (
          <span
            className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-white sm:flex"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            {skillIcon}
          </span>
        )}

        {/* Sarlavha + badge */}
        <div className="min-w-0 flex-1 basis-40">
          <div className="flex items-center gap-2">
            <h1
              className="truncate text-sm font-bold leading-tight tracking-tight"
              style={{ color: INK }}
            >
              {title}
            </h1>
            {badge && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                style={{ backgroundColor: PRIMARY_EXAM, color: '#0B0B0D' }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px]" style={{ color: 'rgba(11,11,13,.5)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Markaz (taymer chip, part tablar ...) */}
        {center && (
          <div className="order-last flex w-full min-w-0 items-center justify-center gap-3 overflow-x-auto lg:order-none lg:w-auto lg:max-w-[45%]">
            {center}
          </div>
        )}

        {/* Holat (javoblar soni, so'zlar soni ...) */}
        {status && (
          <div
            className="hidden items-center gap-2 text-xs font-medium md:flex"
            style={{ color: 'rgba(11,11,13,.55)' }}
          >
            {status}
          </div>
        )}

        {/* Foydalanuvchi chip */}
        {userName && (
          <span
            className="hidden max-w-[11rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium xl:inline-flex"
            style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.1)', color: 'rgba(11,11,13,.6)' }}
            title={userName}
          >
            <User size={13} className="shrink-0" />
            <span className="truncate">{userName}</span>
          </span>
        )}

        <ExamFullscreenButton />

        {/* Tugatish */}
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition disabled:opacity-60 ${FOCUS}`}
            style={{ backgroundColor: PRIMARY_EXAM, color: '#0B0B0D' }}
          >
            {submitting
              ? <Loader2 size={15} className="animate-spin" />
              : <Send size={15} />}
            {submitLabel}
          </button>
        )}
      </div>

      {/* Progress line */}
      {progress !== undefined && (
        <div className="h-0.5 overflow-hidden" style={{ backgroundColor: 'rgba(11,11,13,.06)' }}>
          <div
            className="h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: '#E4F70A',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── TAYMER CHIP ───────────────────────────────────────────────────────────
/** Markazga joylashtirilgan taymer chip — topbar `center` prop'iga uzatiladi. */
export function ExamTimerChip({
  seconds,
  tone = 'blue',
  warning = 300,
}: {
  seconds: number | null
  tone?: Tone
  /** Bu soniyadan kam qolganda qizil rangga o'tadi (standart: 5 daqiqa) */
  warning?: number
}) {
  if (seconds === null) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isWarning = seconds <= warning
  const accent = isWarning ? '#DC2626' : TONES[tone]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums"
      style={{
        backgroundColor: isWarning ? '#FEF2F2' : '#fff',
        borderColor:     isWarning ? '#FECACA' : 'rgba(11,11,13,.12)',
        color:           accent,
      }}
      aria-live="polite"
      aria-label={`Qolgan vaqt: ${label}`}
    >
      <Clock size={12} />
      {label}
    </span>
  )
}

// ─── EXPORT ────────────────────────────────────────────────────────────────
export type { Tone }
export { TONES, INK, PAPER, CANVAS, FOCUS }