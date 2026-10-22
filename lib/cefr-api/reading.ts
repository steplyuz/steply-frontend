// PRACTICE — Reading. Talaba o'z Steply login sessiyasi bilan ishlaydi.
// Endpointlar:
//   GET  /reading-tests, GET /reading-tests/{id}
//   POST /reading-tests/{id}/attempts            (practice urinishni boshlash / davom ettirish)
//   GET  /reading-tests/attempts/{attempt_id}    (holat + saqlangan javoblar)
//   PUT  /reading-tests/attempts/{attempt_id}/answers
//   POST /reading-tests/attempts/{attempt_id}/finish
//   POST /reading-tests/{id}/submit              (faqat mock rejimi: exam_attempt_id bilan)
// (exams-auth / /exams/* ishlatilmaydi — u faqat mock imtihon portali uchun).
//
// TUZATISH: avval `call()` body'ni ob'ekt holida fetch'ga berardi (JSON.stringify yo'q),
// natijada server "[object Object]" olardi -> har javob saqlash 422 bo'lardi va
// urinishni yakunlash "javoblar saqlanmadi" xatosi bilan to'xtardi.
// Endi umumiy apiGet/apiPost/apiPut ishlatiladi (ular body'ni JSON qiladi).
// Javob maydoni `answers` (ro'yxat) yuboriladi — `answer` (string) maydoniga massiv yuborish 422 beradi.
import { readingApi } from '@/lib/api'
import { apiGet, apiPost, apiPut } from '@/lib/api/client'
import { enc } from '@/lib/api/config'
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

export const startReadingAttemptAPI = (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return apiPost<ReadingAttemptState>(`/reading-tests/${enc(testId)}/attempts`)
}

export const getReadingAttemptAPI = (attemptId: number) =>
  apiGet<ReadingAttemptState>(`/reading-tests/attempts/${enc(attemptId)}`)

/** Bitta javobni saqlaydi (idempotent). Bo'sh qiymat — javob tozalanadi. */
export const saveReadingAnswerAPI = (attemptId: number, questionId: number, value: string) =>
  apiPut<unknown>(`/reading-tests/attempts/${enc(attemptId)}/answers`, {
    question_id: questionId,
    answers: value.trim() ? [value] : [],
  })

export const finishReadingAttemptAPI = (attemptId: number) =>
  apiPost<ReadingResultDetail>(`/reading-tests/attempts/${enc(attemptId)}/finish`)

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
