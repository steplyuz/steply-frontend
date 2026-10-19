'use client'

/**
 * lib/exam-skill.ts
 * =================
 * Exam portali skill sahifalari (Reading / Listening / Writing / Speaking) uchun umumiy yordamchilar.
 *
 * - `useSkillAutosave`  — har 30 soniyada (debounce EMAS, davriy) draftni backendga yuboradi.
 *   Eski kod timerni har javobda qayta ishga tushirardi, shuning uchun tez yozayotgan talabada
 *   autosave hech qachon ishlamas edi.
 * - `loadSkillDraft`    — sahifa qayta ochilganda (crash/reconnect) oxirgi draftni tiklaydi.
 * - `finishSkill`       — javoblar yuborilgach skillni "topshirildi" deb belgilaydi
 *   (docs: POST /exams/attempts/{id}/submit/{SKILL}). Skill nomi KATTA HARFDA.
 */

import { useEffect, useRef } from 'react'
import { examsApi } from './api/modules/exams'
import type { SkillType } from './api/types/common'

const AUTOSAVE_MS = 30_000

export function useSkillAutosave(opts: {
  attemptId: number | null | undefined
  skill: SkillType
  enabled: boolean
  getPayload: () => { current_part?: string | null; draft?: Record<string, unknown> | null }
}) {
  const { attemptId, skill, enabled, getPayload } = opts
  const payloadRef = useRef(getPayload)
  payloadRef.current = getPayload

  useEffect(() => {
    if (!attemptId || !enabled) return
    const save = () => { examsApi.autosaveSkill(attemptId, skill, payloadRef.current()).catch(() => {}) }
    const id = setInterval(save, AUTOSAVE_MS)
    const onHide = () => { if (document.visibilityState === 'hidden') save() }
    document.addEventListener('visibilitychange', onHide)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onHide) }
  }, [attemptId, skill, enabled])
}

export interface SkillDraft {
  current_part?: string | null
  draft?: Record<string, unknown> | null
}

export async function loadSkillDraft(attemptId: number, skill: SkillType): Promise<SkillDraft | null> {
  try {
    const list = await examsApi.attemptStatus(attemptId)
    const item = list.find(s => String(s.skill).toUpperCase() === skill)
    if (!item || item.is_submitted) return null
    return { current_part: item.current_part ?? null, draft: item.draft ?? null }
  } catch {
    return null
  }
}

/** Javoblar yuborilgach skillni yakunlaydi. Allaqachon belgilangan bo'lsa (409 va h.k.) xatoni e'tiborsiz qoldiradi. */
export async function finishSkill(attemptId: number, skill: SkillType): Promise<void> {
  try { await examsApi.submitSkill(attemptId, skill) } catch { /* submit endpoint o'zi belgilagan bo'lishi mumkin */ }
}
