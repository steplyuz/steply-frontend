// Mock center moduli turlari: /mock-exams/center/me/*, /admin/mock-exams/center/*

import type { JsonObject } from './common'

export interface MockFinalResult {
  id: number
  attempt_id: number
  user_id: string
  reading_ball: number
  listening_ball: number
  writing_ball: number
  speaking_ball: number
  overall_score: number
  cefr_level: string
  status?: string
  overall_status?: string | null
  skill_statuses?: Record<string, string> | null
  finalized_at?: string | null
  created_at: string
}

export interface WritingPendingItem {
  skill_attempt_id: number
  attempt_id: number
  user_id: string
  full_name: string
  student_id?: string | null
  mock_exam_title: string
  exam_date?: string | null
  is_checked: boolean
  scaled_score: number
  submitted_at?: string | null
}

export type WritingPendingStatus = 'pending' | 'graded' | 'all'

// Sxemasi hali aniqlanmagan javoblar (pages `data.found`, `data.registration` kabi maydonlarni o'qiydi).
export type MockCenterRegistrationDetail = JsonObject
export interface CheckInResult extends JsonObject {
  found?: boolean
  registration?: { full_name?: string | null; student_id?: string | null } & JsonObject
}
export type MockAttemptDetail = JsonObject
export type FinalizeResult = JsonObject
export type SkillScoreResult = JsonObject
