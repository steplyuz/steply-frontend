// Listening turlari — backend `app/modules/tests/listening/schemas.py` bilan bir xil (snake_case).
// Talaba javoblarida `correct_answer` Yo'Q; admin javoblarida bor.
//
// UI view-model (Listening imtihon komponentlari uchun, camelCase) alohida: `@/lib/exam/types/listening`.

export type ListeningQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'GAP_FILL'
  | 'MATCHING'
  | 'MAP_DIAGRAM'
  | 'SENTENCE_COMPLETION'
  | 'SHORT_ANSWER'

export type ListeningAudioMode = 'EXAM' | 'PARTS'

export interface ListeningOption {
  id?: number
  external_id?: string | null
  label: string
  value: string
}

export interface ListeningQuestion {
  id?: number
  external_id?: string | null
  question_number: number
  type: ListeningQuestionType | (string & {})
  text?: string | null
  /** `text` ning eski nomi — backend ikkalasini qabul qiladi. */
  question?: string | null
  group_title?: string | null
  options?: ListeningOption[]
  /** Faqat admin javobida / create-update body'da. */
  correct_answer?: string | string[]
}

export interface ListeningPart {
  id?: number
  external_id?: string | null
  part_number: number
  title: string
  instruction?: string | null
  task_type?: string | null
  audio_url?: string | null
  /** Eski maydon nomi (audio yorlig'i) — admin editor ishlatadi. */
  audio_label?: string | null
  audio_start_seconds?: number | null
  audio_end_seconds?: number | null
  context?: string | null
  passage?: string | null
  map_image?: string | null
  image_url?: string | null
  example_json?: string | null
  options?: ListeningOption[]
  questions: ListeningQuestion[]
}

export interface ListeningTest {
  id: string
  title: string
  cefr_level?: string | null
  duration_minutes?: number | null
  /** `cefr_level` / `duration_minutes` ning eski nomlari — backend kirishda ikkalasini qabul qiladi. */
  level?: string
  duration?: number
  total_questions?: number | null
  sections?: string | null
  audio_mode?: ListeningAudioMode | string | null
  audio_url?: string | null
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  created_at?: string | null
  parent_test_id?: string | null
  practice_part_number?: number | null
  parts: ListeningPart[]
}

/** POST /admin/listening-tests (`id` ixtiyoriy). */
export interface ListeningCreateInput {
  id?: string
  title: string
  cefr_level?: string
  duration_minutes?: number
  level?: string
  duration?: number
  total_questions?: number | null
  sections?: string | null
  audio_mode?: ListeningAudioMode | string | null
  audio_url?: string | null
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  parts?: ListeningPart[]
}

/** PUT /admin/listening-tests/{id}: barcha maydonlar ixtiyoriy. */
export type ListeningUpdateInput = Partial<Omit<ListeningCreateInput, 'id'>>

/** Admin audio yuklash javobi. */
export interface UploadedAudio {
  url: string
  filename: string
  size: number
  duration_seconds?: number | null
}

// --- Topshirish va natijalar ---

export interface ListeningSubmitInput {
  exam_id?: string | null
  /** { "<question_number>": "javob" } */
  user_answers: Record<string, unknown>
  /** Mock imtihon urinishiga ulash uchun (ixtiyoriy). */
  exam_attempt_id?: number | null
}

export interface ListeningResultSummary {
  id: number
  exam_id: string
  exam_attempt_id?: number | null
  raw_score: number
  standard_score?: number | null
  cefr_level?: string | null
  total_questions: number
  correct_answers: number
  percentage: number
  user_answers?: Record<string, unknown> | null
  created_at: string
}

export interface ListeningQuestionReview {
  question_id?: number | null
  question_number: number
  user_answer: string
  correct_answer: string
  is_correct: boolean
  type: string
}

export interface ListeningResultDetail {
  summary: ListeningResultSummary
  review: ListeningQuestionReview[]
}
