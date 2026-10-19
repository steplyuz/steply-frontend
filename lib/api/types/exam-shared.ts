// Reading va Listening uchun umumiy (qog'oz imtihon) turlar:
// lock / versions / answer-key / natijalar / submit.

// Testni PDF/OMR uchun tayyorlash (lock) natijasi
export interface ExamVersion {
  id: number
  version_number: number
  total_questions: number
  is_locked: boolean
  locked_at: string | null
  created_at: string
}

/** Backend lock xatosi: oddiy matn yoki `{ question_number, message }`. */
export type LockError = string | { question_number?: number; message: string }

export interface LockResult {
  success: boolean
  version: ExamVersion
  errors: LockError[]
}

export interface AnswerKeyResponse {
  exam_id: string
  version_number: number
  total_questions: number
  is_locked: boolean
  answer_key: Record<string, unknown>
}

/** Backendning `UserAnswer` sxemasiga mos — savolga 1 yoki bir nechta javob (masalan matching/multi-select). */
export interface ExamUserAnswer {
  question_id?: number | null
  question_number?: number | null
  answers: string[]
}

export interface ExamSubmitInput {
  answers: ExamUserAnswer[]
  /** Mock imtihon urinishiga ulash uchun (ixtiyoriy). */
  exam_attempt_id?: number | null
}

export interface ExamResultSummary {
  id: number
  exam_id: string
  /** Faqat Reading javobida bor; Listening summary da yo'q. */
  correct_answers?: number
  total_questions?: number
  raw_score: number
  standard_score: number
  cefr_level: string
  percentage: number
  created_at: string
}

export interface ExamResultDetail {
  summary: ExamResultSummary
  review: Record<string, unknown>[]
}
