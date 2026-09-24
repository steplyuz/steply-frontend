// Mock center moduli turlari: /mock-exams/center/me/*, /admin/mock-exams/center/*

import type { JsonObject } from './common'

export interface MockFinalResult {
  id: number
  attempt_id: number
  user_id: number
  reading_ball: number
  listening_ball: number
  writing_ball: number
  speaking_ball: number
  overall_score: number
  cefr_level: string
  created_at: string
}

export interface WritingPendingItem {
  skill_attempt_id: number
  attempt_id: number
  user_id: number
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
export type CheckInResult = JsonObject
export type MockAttemptDetail = JsonObject
export type FinalizeResult = JsonObject
export type SkillScoreResult = JsonObject
