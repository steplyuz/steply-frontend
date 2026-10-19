import type { SpeakingTest } from './speaking'
// Exams platformasi turlari: /exams-auth/*, /exams/*

import type { SkillType } from './common'

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Spetsifikatsiya: student_id (MK ID) yoki exam_id; phone_last4 ixtiyoriy tekshiruv. */
export interface ExamIdLoginRequest {
  exam_id?: string | null
  student_id?: string | null
  phone_last4?: string | null
}

export interface ExamsTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface ExamsStudentResponse {
  id: string
  full_name?: string | null
  mk_id?: string | null
  exam_id?: string | null
  registration_id?: number | null
  phone_last4?: string | null
  photo_url?: string | null
  age?: number | null
  date_of_birth?: string | null
  gender?: string | null
  region?: string | null
}

export interface ExamIdLoginResponse {
  status: string
  token?: ExamsTokenResponse | null
  student?: ExamsStudentResponse | null
}

export interface ExamsStatusResponse {
  status: string
  message?: string | null
}

// ── Enrolled exam ─────────────────────────────────────────────────────────────

export interface EnrolledSessionInfo {
  id: number
  exam_date: string
  center_name?: string | null
  room_name?: string | null
  location_address?: string | null
}

export interface EnrolledExamResponse {
  id: string
  title: string
  cefr_level: string
  duration_minutes: number
  enrollment_source: string
  mk_id?: string | null
  session?: EnrolledSessionInfo | null
  attempt_id?: number | null
  attempt_status?: string | null
  is_finished?: boolean | null
  reading_id?: string | null
  listening_id?: string | null
  writing_id?: string | null
  speaking_id?: string | null
}

// ── My skills ─────────────────────────────────────────────────────────────────

export interface SkillInfo {
  test_id: string | null
  is_submitted: boolean
  is_checked: boolean
  submitted_at?: string | null
}

export interface MyExamSkillsResponse {
  exam_id: string
  exam_title: string
  registration_status: string
  attempt_id: number | null
  skills: {
    reading: SkillInfo
    listening: SkillInfo
    writing: SkillInfo
    speaking: SkillInfo
  }
}

// ── Attempt ───────────────────────────────────────────────────────────────────

/** POST /exams/{exam_id}/start — backend javobi (server vaqti bilan: taymer uchun `remaining_seconds`). */
export interface MockExamStartResponse {
  attempt_id: number
  mock_exam_id: string
  started_at: string
  expires_at: string
  server_time: string
  remaining_seconds: number
}

export interface MockSkillStatusResponse {
  skill: SkillType
  is_checked: boolean
  is_submitted: boolean
  submitted_at?: string | null
  current_part?: string | null
  current_question?: string | null
  draft?: Record<string, unknown> | null
  last_saved_at?: string | null
}

export interface MockSkillAutosaveRequest {
  current_part?: string | null
  current_question?: string | null
  draft?: Record<string, unknown> | null
  user_answers?: Record<string, unknown> | null
}

export interface MockExamResultResponse {
  id: number
  user_id: string
  attempt_id: number
  reading_ball: number
  listening_ball: number
  writing_ball: number
  speaking_ball: number
  overall_score: number
  cefr_level: string
  status: string
  overall_status?: string | null
  /** Har bir skill uchun holat: { READING: 'FINALIZED', ... } */
  skill_statuses?: Record<string, string> | null
  finalized_at?: string | null
  created_at: string
}

// ── Speaking ──────────────────────────────────────────────────────────────────

export interface SpeakingAssignedTestResponse {
  skill_attempt_id: number
  speaking_test: SpeakingTest
}

export interface SpeakingSubmissionResponse {
  id: number
  user_id?: string
  speaking_test_id?: string
  question_external_id?: string | null
  part_external_id?: string | null
  mock_skill_attempt_id?: number | null
  status: string
  audio_url?: string | null
  duration_seconds?: number | null
  created_at?: string
}

// ── Qulay aliaslar (sahifalar shu nomlar bilan import qiladi) ─────────────────
export type EnrolledExam = EnrolledExamResponse
export type MockAttemptStart = MockExamStartResponse
export type MockSkillStatus = MockSkillStatusResponse
/** Speaking: talabaga biriktirilgan test (speaking_test.id ishlatiladi) */
export type AssignedSpeakingTest = SpeakingAssignedTestResponse
