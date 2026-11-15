'use client'
import { useEffect } from 'react'
import { activityApi } from '@/shared/api'

const PING_MS = 60_000
const IDLE_MS = 2 * 60_000

/**
 * Foydalanuvchi faol bo'lganda har 60 soniyada backendga heartbeat yuboradi.
 * Tab yashirin bo'lsa yoki 2 daqiqa harakat bo'lmasa hisoblanmaydi (audio ijro etilayotgan bo'lsa bundan mustasno).
 */
export function useActivityHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    let lastInput = Date.now()
    const markInput = () => { lastInput = Date.now() }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, markInput, { passive: true }))

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const audioPlaying = !!document.querySelector('audio:not([paused])')
      if (!audioPlaying && Date.now() - lastInput > IDLE_MS) return
      activityApi.heartbeat().catch(() => {})
    }, PING_MS)

    return () => {
      window.clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, markInput))
    }
  }, [enabled])
}
