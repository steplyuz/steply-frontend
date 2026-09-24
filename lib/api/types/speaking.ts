// Speaking moduli turlari: /speaking-tests/*, /admin/speaking-tests/*

import type { JsonObject } from './common'

export interface SpeakingPart11 { question_1: string; question_2: string; question_3: string; prep_seconds: number; answer_seconds: number }
export interface SpeakingPart12 { image_1_url: string; image_2_url: string; question_describe: string; question_2: string; question_3: string; prep_seconds: number; describe_answer_seconds: number; answer_seconds: number }
export interface SpeakingPart2 { image_url: string; question_1: string; question_2: string; question_3: string; prep_seconds: number; answer_seconds: number }
export interface SpeakingPart3 { topic: string; for_points: string[]; against_points: string[]; prep_seconds: number; answer_seconds: number }

export interface SpeakingTestSummary {
  id: string
  title: string
  is_active: boolean
  created_at: string
}

export interface SpeakingTest extends SpeakingTestSummary {
  description: string | null
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export interface SpeakingTestCreateInput {
  // NOTE: id yuborilmaydi — backend SPEAK-{8 nanoid} ni o'zi yaratadi
  title: string
  description?: string | null
  is_active?: boolean
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export type SpeakingTestUpdateInput = Partial<SpeakingTestCreateInput>

export interface AssignedSpeakingTest {
  skill_attempt_id: number
  speaking_test: SpeakingTest
}

export interface SpeakingSubmission {
  id: number
  user_id: number
  speaking_test_id: string
  mock_skill_attempt_id: number | null
  audio_url: string
  duration_seconds: number
  status: string
  created_at: string
  full_name?: string | null
  student_id?: string | null
}

export interface SpeakingResultInput {
  fluency_coherence?: number | null
  lexical_resource?: number | null
  grammar_accuracy?: number | null
  pronunciation?: number | null
  overall_band: number
  cefr_level?: string | null
  comment?: string | null
}

export interface SpeakingResult extends SpeakingResultInput {
  id: number
  submission_id: number
  evaluator_id: number
  created_at: string
}

export type SpeakingMockAccessInput = JsonObject
export type SpeakingMockAccessResult = JsonObject
