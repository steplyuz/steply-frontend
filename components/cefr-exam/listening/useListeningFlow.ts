"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ListeningExam } from "@/lib/cefr-types/listening"

export type ListeningStatus = "reading" | "playing" | "ending" | "finished"

/** Shu part uchun audio bormi? (full-audio yoki part audiosi) */
function hasAudio(exam: ListeningExam, partIdx: number): boolean {
  const full = exam.audioMode === "EXAM" && !!exam.audioUrl
  return full || !!exam.parts?.[partIdx]?.audioLabel
}

/**
 * Listening imtihon oqimi.
 *
 * Audio bor bo'lsa "reading" fazasi YO'Q (o'qish vaqti audio ichida bor):
 *   playing -> (part tugadi) -> ending (end-of-part klipi) -> keyingi part: to'g'ridan-to'g'ri playing
 * Oxirgi partdan keyin status "finished" bo'ladi va onFinish chaqiriladi.
 * Audio yo'q partlar "reading"da qoladi va tablar orqali qo'lda almashtiriladi.
 */
export function useListeningFlow(exam: ListeningExam | null, onFinish?: () => void) {
  const [activePartIndex, setActivePartIndex] = useState(0)
  const [status, setStatus] = useState<ListeningStatus>("reading")
  const initializedFor = useRef<string | number | null>(null)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  // Imtihon yuklanganda bir marta: saqlangan partdan davom (refresh) yoki 1-partdan boshlash
  useEffect(() => {
    if (!exam || initializedFor.current === exam.id) return
    initializedFor.current = exam.id

    const total = exam.parts?.length ?? 0
    let idx = 0
    try {
      const raw = localStorage.getItem(`listening-audio:${exam.id}`)
      const saved = raw ? JSON.parse(raw) : null
      const fresh = !(typeof saved?.ts === "number" && Date.now() - saved.ts > 3 * 60 * 60 * 1000)
      if (fresh && Number.isFinite(saved?.part)) idx = Math.min(Math.max(0, saved.part), Math.max(0, total - 1))
    } catch {
      /* ignore */
    }
    setActivePartIndex(idx)
    setStatus(hasAudio(exam, idx) ? "playing" : "reading")
  }, [exam])

  const total = exam?.parts?.length ?? 0

  // Audio tugadi (yoki full rejimida segment oxiriga yetildi): "end of part" klipini chalish
  const onTransitionToEnding = useCallback(() => setStatus("ending"), [])

  // Imtihonni yakunlash (oxirgi part yoki "Yakunlash" tugmasi): saqlangan audio joyini ham tozalaydi
  const finish = useCallback(() => {
    if (exam) {
      try { localStorage.removeItem(`listening-audio:${exam.id}`) } catch { /* ignore */ }
    }
    setStatus("finished")
    onFinishRef.current?.()
  }, [exam])

  // Klip tugadi: keyingi part YOKI imtihon yakuni. "reading" fazasi yo'q.
  const onNextPart = useCallback(() => {
    if (!exam) return
    if (activePartIndex >= total - 1) {
      finish()
      return
    }
    const next = activePartIndex + 1
    setActivePartIndex(next)
    setStatus(hasAudio(exam, next) ? "playing" : "reading")
  }, [exam, activePartIndex, total, finish])

  // Tab bosildi (komponent full-audio'da playing paytida buni bloklaydi)
  const selectPart = useCallback(
    (i: number) => {
      if (!exam || i < 0 || i >= total) return
      setActivePartIndex(i)
      setStatus(hasAudio(exam, i) ? "playing" : "reading")
    },
    [exam, total]
  )

  // Faqat refreshdan keyin partni audio vaqtiga moslash uchun
  const onAudioPartChange = useCallback((i: number) => setActivePartIndex(i), [])

  return {
    status,
    activePartIndex,
    onTransitionToEnding,
    onNextPart,
    finish,
    selectPart,
    onAudioPartChange,
  }
}