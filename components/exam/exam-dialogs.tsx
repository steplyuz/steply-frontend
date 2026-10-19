'use client'

/**
 * Imtihon uchun yagona tasdiqlash oynasi (Finish / Topshirish).
 * Namuna: imthon_tizmi → "Finish Section" modali (javoblar jadvali + tasdiqlash).
 * Native <dialog> ishlatiladi: fokus tuzog'i, Esc bilan yopish va ekran o'quvchilar qo'llab-quvvatlanadi.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import { TONES, type Tone } from '@/lib/brand'
import { EXAM_FOCUS as FOCUS } from '@/lib/exam-theme'

export type FinishRow = { label: string; value: ReactNode; done: boolean }

export function FinishDialog({
  open, onClose, onConfirm, submitting = false,
  title = 'Imtihonni yakunlash',
  summary, rows = [], warning, error,
  confirmLabel = 'Tasdiqlayman', cancelLabel = 'Davom etish',
  confirmDisabled = false, tone = 'blue',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  submitting?: boolean
  title?: string
  summary?: ReactNode
  rows?: FinishRow[]
  warning?: ReactNode
  error?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmDisabled?: boolean
  tone?: Tone
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const accent = TONES[tone]

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const requestClose = () => { if (!submitting) onClose() }

  return (
    <dialog
      ref={ref}
      aria-labelledby="exam-finish-title"
      onCancel={e => { e.preventDefault(); requestClose() }}
      onClick={e => { if (e.target === ref.current) requestClose() }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(11,11,13,.1)', color: '#0B0B0D' }}
    >
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'rgba(11,11,13,.08)' }}>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          <CheckCircle2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="exam-finish-title" className="text-base font-bold leading-tight tracking-tight">{title}</h2>
          {summary && <p className="mt-1 text-sm" style={{ color: 'rgba(11,11,13,.6)' }}>{summary}</p>}
        </div>
        <button
          type="button"
          onClick={requestClose}
          disabled={submitting}
          aria-label="Yopish"
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-foreground/5 disabled:opacity-40 ${FOCUS}`}
          style={{ color: 'rgba(11,11,13,.5)' }}
        >
          <X size={16} />
        </button>
      </div>

      {rows.length > 0 && (
        <ul className="max-h-[40vh] divide-y overflow-y-auto px-5" style={{ borderColor: 'rgba(11,11,13,.06)' }}>
          {rows.map(r => (
            <li key={r.label} className="flex items-center justify-between gap-3 py-2.5 text-sm" style={{ borderColor: 'rgba(11,11,13,.06)' }}>
              <span className="font-medium">{r.label}</span>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-semibold"
                style={r.done
                  ? { backgroundColor: '#F0FDF4', color: '#16A34A' }
                  : { backgroundColor: '#FFF7ED', color: '#C2410C' }}
              >
                {r.value}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(warning || error) && (
        <div className="space-y-2 px-5 pt-3">
          {warning && (
            <p className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
              <AlertTriangle size={14} className="mt-px shrink-0" /> <span>{warning}</span>
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={requestClose}
          disabled={submitting}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-foreground/5 disabled:opacity-50 ${FOCUS}`}
          style={{ backgroundColor: '#fff', borderColor: 'rgba(11,11,13,.14)' }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting || confirmDisabled}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground transition disabled:opacity-60 ${FOCUS}`}
          style={{ backgroundColor: '#E4F70A', color: '#0B0B0D' }}
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

/** Rasmni kattalashtirib ko'rsatish (namuna: imgZoomOverlay). Native <dialog>, Esc va fon bosilganda yopiladi. */
export function ExamImageZoom({ src, alt, onClose }: { src: string | null; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (src && !d.open) d.showModal()
    if (!src && d.open) d.close()
  }, [src])

  return (
    <dialog
      ref={ref}
      aria-label={alt}
      onCancel={e => { e.preventDefault(); onClose() }}
      onClick={e => { if (e.target === ref.current) onClose() }}
      className="m-auto max-h-[92vh] max-w-[min(96vw,64rem)] rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/70"
    >
      {src && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[88vh] w-auto max-w-full rounded-xl bg-white object-contain" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className={`absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 ${FOCUS}`}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </dialog>
  )
}
