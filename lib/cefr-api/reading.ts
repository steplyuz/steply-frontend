// PRACTICE — Reading. Talaba o'z Steply login sessiyasi bilan ishlaydi.
// Endpointlar:
//   GET  /reading-tests, GET /reading-tests/{id}
//   POST /reading-tests/{id}/attempts            (practice urinishni boshlash / davom ettirish)
//   GET  /reading-tests/attempts/{attempt_id}    (holat + saqlangan javoblar)
//   PUT  /reading-tests/attempts/{attempt_id}/answers
//   POST /reading-tests/attempts/{attempt_id}/finish
//   POST /reading-tests/{id}/submit              (faqat mock rejimi: exam_attempt_id bilan)
// (exams-auth / /exams/* ishlatilmaydi — u faqat mock imtihon portali uchun).
import { readingApi } from '@/lib/api'
import { apiRequest } from '@/lib/api/client'
import type { ReadingResultDetail } from '@/lib/api/types'
import type { ReadingExam } from '@/lib/cefr-types/reading'

export interface AnswerItem {
  question_id: number
  answers: string[]
}

export interface ReadingSubmission {
  answers: AnswerItem[]
  exam_attempt_id?: number | null
}

export const getAllReadingExamsAPI = async () => {
  return { data: (await readingApi.getAll()) as unknown as ReadingExam[] }
}

export const getReadingExamByIdAPI = async (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return { data: (await readingApi.get(testId)) as unknown as ReadingExam }
}

/** Mock rejimi uchun (exam_attempt_id bilan). Practice uchun `finishReadingAttemptAPI` ishlatiladi. */
export const submitReadingExamAPI = async (testId: string, data: ReadingSubmission) => {
  if (!testId) throw new Error('testId is required')
  return { data: (await readingApi.submit(testId, data)) as ReadingResultDetail }
}

// ---------------------------------------------------------------------------
// PRACTICE ATTEMPT API
// ---------------------------------------------------------------------------

type SavedRow = { question_id?: number | null; question_number?: number | null; answer?: string[] | string | null }

export interface ReadingAttemptState {
  attempt_id: number
  test_id: string
  status: string // IN_PROGRESS | SUBMITTED | EXPIRED
  expires_at?: string | null
  duration_seconds?: number | null
  result_id?: number | null
  answers?: SavedRow[]
  rows?: SavedRow[]
}

/**
 * MOSLASHTIRISH NUQTASI: `apiRequest` ning aniq imzosi (path, { method, body }) deb faraz qilingan.
 * Agar `lib/api/client.ts` dagi imzo boshqacha bo'lsa, FAQAT shu bitta funksiyani to'g'rilang.
 */
const call = <T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (apiRequest as any)(path, init) as Promise<T>

export const startReadingAttemptAPI = (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return call<ReadingAttemptState>(`/reading-tests/${testId}/attempts`, { method: 'POST' })
}

export const getReadingAttemptAPI = (attemptId: number) =>
  call<ReadingAttemptState>(`/reading-tests/attempts/${attemptId}`, { method: 'GET' })

/** Bitta javobni saqlaydi (idempotent). Bo'sh qiymat — javob tozalanadi. */
export const saveReadingAnswerAPI = (attemptId: number, questionId: number, value: string) =>
  call<unknown>(`/reading-tests/attempts/${attemptId}/answers`, {
    method: 'PUT',
    body: { question_id: questionId, answer: value.trim() ? [value] : [] },
  })

export const finishReadingAttemptAPI = (attemptId: number) =>
  call<ReadingResultDetail>(`/reading-tests/attempts/${attemptId}/finish`, { method: 'POST' })

/** Serverdagi saqlangan javoblarni { savol_db_id: javob_matni } ko'rinishiga keltiradi. */
export function attemptAnswersToMap(state: ReadingAttemptState | null | undefined): Record<number, string> {
  const out: Record<number, string> = {}
  const rows = state?.answers ?? state?.rows ?? []
  for (const r of rows) {
    const id = Number(r?.question_id)
    if (!id) continue
    const v = Array.isArray(r.answer) ? r.answer.join(', ') : String(r.answer ?? '')
    if (v.trim()) out[id] = v
  }
  return out
}