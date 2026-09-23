// lib/cefr-api/mock.ts

/**
 * Mock exam API response types.
 *
 * Backend endpointlari:
 * - mock-test/user_router.py
 * - mock_test/mvp_router.py
 */

export type MockSkill =
  | "READING"
  | "LISTENING"
  | "WRITING"
  | "SPEAKING"

export type MockStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | string

export interface UserMockExamResponse {
  id: string
  title?: string
  status?: MockStatus
  created_at?: string
  started_at?: string | null
  completed_at?: string | null
}

export interface MockExamStartResponse {
  attempt_id: number | string
  exam_id?: number | string
  status?: MockStatus
  started_at?: string
}

export interface MockSkillStatusResponse {
  skill: MockSkill
  status: MockStatus
  attempt_id?: number | string
  raw_score?: number | null
  max_score?: number | null
  percentage?: number | null
  started_at?: string | null
  submitted_at?: string | null
}

export interface MockSkillSubmit {
  raw_score: number
  user_answers: unknown
}

export interface MockSkillAttemptResponse {
  attempt_id: number | string
  skill?: MockSkill
  status?: MockStatus
  raw_score?: number | null
  max_score?: number | null
  percentage?: number | null
  submitted_at?: string | null
}

export interface MockExamResult {
  overall_score?: number | null
  cefr_level?: string | null

  listening_ball?: number | null
  reading_ball?: number | null
  writing_ball?: number | null
  speaking_ball?: number | null

  listening_score?: number | null
  reading_score?: number | null
  writing_score?: number | null
  speaking_score?: number | null

  total_score?: number | null
  max_score?: number | null
}
