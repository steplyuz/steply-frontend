'use client'

import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Clock3, Flag } from 'lucide-react'

interface WritingHeaderProps {
  initialSeconds: number
  timeKey?: string | null
  onFinish: () => void
  isSubmitting: boolean
}

/**
 * Orange theme + stable timer (no interval re-create each second)
 * - interval starts once (when not submitting)
 * - localStorage write throttled (every 5s + final seconds)
 * - onFinish fires ONCE when reaches 0
 */
const WritingHeader = memo(function WritingHeader({
  initialSeconds,
  timeKey,
  onFinish,
  isSubmitting,
}: WritingHeaderProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialSeconds)

  const finishedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  // init timer from localStorage (if exists)
  useEffect(() => {
    finishedRef.current = false

    if (!timeKey) {
      setTimeRemaining(initialSeconds)
      return
    }

    try {
      const saved = localStorage.getItem(timeKey)
      if (saved != null) {
        const v = Number(saved)
        if (Number.isFinite(v) && v >= 0) {
          setTimeRemaining(v)
          return
        }
      }
      localStorage.setItem(timeKey, String(initialSeconds))
    } catch {}
    setTimeRemaining(initialSeconds)
  }, [timeKey, initialSeconds])

  // throttled storage write (avoid write every second)
  const lastSavedAtRef = useRef<number>(0)
  const saveTime = useCallback(
    (sec: number) => {
      if (!timeKey) return
      const now = Date.now()
      // save every 5 seconds or when very close to finish
      const should = now - lastSavedAtRef.current > 5000 || sec <= 5
      if (!should) return
      lastSavedAtRef.current = now
      try {
        localStorage.setItem(timeKey, String(sec))
      } catch {}
    },
    [timeKey]
  )

  // ticking (single interval)
  useEffect(() => {
    if (isSubmitting) return

    const t = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) return 0
        const next = prev - 1
        saveTime(next)

        if (next <= 0 && !finishedRef.current) {
          finishedRef.current = true
          // call finish outside state update micro-jank
          queueMicrotask(() => onFinishRef.current())
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(t)
  }, [isSubmitting, saveTime])

  const formatted = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60)
    const secs = timeRemaining % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [timeRemaining])

  const isDanger = timeRemaining <= 60

  return (
    <header className="w-full bg-[#FDFCFB] border-b border-border">
      <div className="px-4 md:px-10 py-3 flex items-center gap-3">
        {/* Left: vazifa yo'riqnomasi (nomzod ismi/surati va skill nomi — umumiy header'da) */}
        <p className="hidden text-[10px] font-black uppercase tracking-widest text-foreground/60 sm:block">
          Yozish vaqti
        </p>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          {/* Timer pill */}
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 md:px-6 py-2 border shadow-sm ${
              isDanger
                ? 'bg-red-50 border-red-200'
                : 'bg-secondary border-border'
            }`}
            aria-label="Timer"
          >
            <Clock3
              size={16}
              className={isDanger ? 'text-red-600' : 'text-foreground'}
            />
            <span
              className={`text-lg md:text-2xl font-black tabular-nums ${
                isDanger ? 'text-red-700' : 'text-foreground'
              }`}
            >
              {formatted}
            </span>
          </div>

          {/* Finish */}
          <button
            type="button"
            onClick={onFinish}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl px-4 md:px-6 py-2.5 font-black uppercase tracking-widest text-[11px] md:text-xs shadow-md transition active:scale-95 disabled:opacity-60
                       bg-foreground hover:bg-foreground text-white"
          >
            <Flag size={16} />
            {isSubmitting ? '...' : 'Yakunlash'}
          </button>
        </div>
      </div>

      {/* subtle progress bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-1 bg-foreground transition-[width] duration-300"
          style={{
            width:
              initialSeconds > 0
                ? `${Math.max(
                    0,
                    Math.min(100, (timeRemaining / initialSeconds) * 100)
                  )}%`
                : '0%',
          }}
        />
      </div>
    </header>
  )
})

export default WritingHeader