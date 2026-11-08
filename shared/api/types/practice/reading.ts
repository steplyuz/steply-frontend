// Reading turlari — backend `app/modules/tests/reading/schemas.py` bilan bir xil (snake_case).
// Talaba javoblarida `correct_answer` Yo'Q; admin javoblarida bor (`Admin*` / ixtiyoriy maydon).
//
// UI view-model (Reading imtihon komponentlari uchun) alohida: `@/lib/exam/types/reading`.

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE_NOT_GIVEN = 'TRUE_FALSE_NOT_GIVEN',
  GAP_FILL = 'GAP_FILL',
  GAP_FILL_FILL = 'GAP_FILL_FILL',
  HEADINGS_MATCH = 'HEADINGS_MATCH',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  TEXT_MATCH = 'TEXT_MATCH',
}

export interface ReadingOption {
  id?: number
  external_id?: string | null
  label: string
  value: string
}

export interface ReadingQuestion {
  id?: number
  external_id?: string | null
  question_number: number
  type: QuestionType | `${QuestionType}`
  text: string
  word_limit?: number
  options?: ReadingOption[]
  /** Faqat admin javobida / create-update body'da. */
  correct_answer?: string[]
}

export interface ReadingPart {
  id?: number
  external_id?: string | null
  title: string
  description?: string | null
  passage: string
  image_url?: string | null
  questions: ReadingQuestion[]
}

export interface ReadingTest {
  id: string
  title: string
  cefr_level: string
  language?: string
  duration_minutes: number
  total_questions?: number | null
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  created_at?: string
  /** Part mini-test bo'lsa: asl test va part raqami. */
  parent_test_id?: string | null
  practice_part_number?: number | null
  parts: ReadingPart[]
}

/** POST /admin/reading-tests (id server tomonida yaratiladi). */
export interface ReadingCreateInput {
  title: string
  cefr_level: string
  language?: string
  duration_minutes?: number
  total_questions?: number | null
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  parts: ReadingPart[]
}

/** PUT /admin/reading-tests/{id}: barcha maydonlar ixtiyoriy. */
export type ReadingUpdateInput = Partial<ReadingCreateInput>

// --- Topshirish va natijalar ---

export interface ReadingAnswerInput {
  question_id?: number | null
  question_number?: number | null
  answers: string[]
}

export interface ReadingSubmitInput {
  answers: ReadingAnswerInput[]
  /** Mock imtihon urinishiga ulash uchun (ixtiyoriy). */
  exam_attempt_id?: number | null
}

export interface ReadingResultSummary {
  id: number
  exam_id?: string
  raw_score: number
  correct_answers?: number
  total_questions?: number
  standard_score?: number | null
  cefr_level: string | null
  percentage: number
  created_at: string
}

export interface ReadingQuestionReview {
  question_number: number
  user_answer: string
  correct_answer: string
  is_correct: boolean
  type: QuestionType | `${QuestionType}`
}

export interface ReadingResultDetail {
  summary: ReadingResultSummary
  review: ReadingQuestionReview[]
}
