'use client'

/**
 * lib/use-countdown.ts
 * ====================
 * Imtihon taymeri uchun umumiy hook (Listening / Reading / Writing / Speaking).
 *
 * - Tugash vaqti (deadline) asosida hisoblanadi, shuning uchun fon tabda yoki
 *   setInterval sekinlashganda ham soat "siljib" ketmaydi.
 * - `running` true bo'lganda boshlanadi; `totalSeconds` berilmasa taymer yo'q (undefined qaytadi).
 * - `onExpire` vaqt tugaganda aynan BIR marta chaqiriladi.
 */

import { useEffect, useRef, useState } from 'react'

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function useCountdown(
  totalSeconds: number | undefined,
  opts: { running: boolean; onExpire?: () => void; resetKey?: string | number },
): { left: number | undefined; expired: boolean } {
  const { running, onExpire, resetKey } = opts
  const [left, setLeft] = useState<number | undefined>(totalSeconds)
  const deadlineRef = useRef<number | null>(null)
  const firedRef = useRef(false)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  // Yangi davomiylik yoki resetKey o'zgarsa taymer boshidan boshlanadi
  useEffect(() => {
    deadlineRef.current = null
    firedRef.current = false
    setLeft(totalSeconds)
  }, [totalSeconds, resetKey])

  useEffect(() => {
    if (!running) {
      // To'xtatilgan taymer pauza emas, qayta boshlanadi (masalan "Qayta ishlash" bosilganda)
      deadlineRef.current = null
      firedRef.current = false
      if (totalSeconds !== undefined) setLeft(totalSeconds)
      return
    }
    if (totalSeconds === undefined || totalSeconds <= 0) return
    if (deadlineRef.current === null) deadlineRef.current = Date.now() + totalSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.ceil(((deadlineRef.current ?? 0) - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true
        expireRef.current?.()
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [running, totalSeconds, resetKey])

  return { left, expired: left !== undefined && left <= 0 && totalSeconds !== undefined && totalSeconds > 0 }
}
