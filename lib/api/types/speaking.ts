// Speaking moduli turlari: /speaking-tests/*, /admin/speaking-tests/*

import type { JsonObject } from './common'

export interface SpeakingPart11 { external_id?: string; question_1_id?: string; question_2_id?: string; question_3_id?: string; question_1: string; question_2: string; question_3: string; prep_seconds?: number; answer_seconds?: number }
export interface SpeakingPart12 { external_id?: string; question_describe_id?: string; question_2_id?: string; question_3_id?: string; image_1_url: string; image_2_url: string; question_describe: string; question_2: string; question_3: string; prep_seconds?: number; describe_answer_seconds?: number; answer_seconds?: number }
export interface SpeakingPart2 { external_id?: string; question_1_id?: string; question_2_id?: string; question_3_id?: string; image_url: string; question_1: string; question_2: string; question_3: string; prep_seconds?: number; answer_seconds?: number }
export interface SpeakingPart3 { external_id?: string; topic_id?: string; topic: string; for_points: string[]; against_points: string[]; prep_seconds?: number; answer_seconds?: number }

export interface SpeakingTestSummary {
  id: string
  title: string
  is_active: boolean
  is_free?: boolean
  is_practice?: boolean
  created_at: string
}

export interface SpeakingTest extends SpeakingTestSummary {
  description: string | null
  is_free?: boolean
  is_practice?: boolean
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export interface SpeakingTestCreateInput {
  // NOTE: id yuborilmaydi — backend SPEAK-{8 nanoid} ni o'zi yaratadi
  title: string
  description?: string | null
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export type SpeakingTestUpdateInput = Partial<SpeakingTestCreateInput>

/** `GET /speaking-tests/recording-draft` va chunk yuklashning javobi — hali finalize qilinmagan qoralama. */
export interface SpeakingRecordingDraft {
  id: number
  mock_skill_attempt_id: number
  speaking_test_id: string
  part_external_id: string
  question_external_id: string
  next_chunk_index: number
  total_bytes: number
  duration_seconds: number | null
  status: string
  created_at: string
  updated_at: string
}

/** `POST /speaking-tests/recording-draft/{id}/finalize` javobi — yakunlangan submission. */
export interface SpeakingRecordingSubmission {
  id: number
  user_id: string
  speaking_test_id: string
  question_external_id: string | null
  part_external_id: string | null
  mock_skill_attempt_id: number | null
  audio_url: string
  duration_seconds: number | null
  status: string
  created_at: string
}

export interface SpeakingSubmission {
  id: number
  user_id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  username?: string | null
  birth_date?: string | null
  gender?: string | null
  language?: string | null
  question_external_id?: string | null
  part_external_id?: string | null
  speaking_test_id: string
  mock_skill_attempt_id: number | null
  audio_url: string
  duration_seconds: number
  status: string
  created_at: string
  student_id?: string | null
}

/**
 * POST /admin/speaking-tests/submissions/{id}/result — backend `overall_raw` (0..36, majburiy) qabul qiladi.
 * Yakuniy band/ball (`overall_band`) serverda hisoblanadi va javobda qaytadi.
 */
export interface SpeakingResultInput {
  fluency_coherence?: number | null
  lexical_resource?: number | null
  grammar_accuracy?: number | null
  pronunciation?: number | null
  /** Xom ball, 0..36 */
  overall_raw: number
  cefr_level?: string | null
  comment?: string | null
}

export interface SpeakingResult {
  id: number
  submission_id: number
  evaluator_id: string
  fluency_coherence: number | null
  lexical_resource: number | null
  grammar_accuracy: number | null
  pronunciation: number | null
  overall_band: number
  cefr_level: string | null
  comment: string | null
  created_at: string
}

