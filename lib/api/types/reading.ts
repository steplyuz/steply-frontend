// Reading moduli turlari: /reading-tests/*, /admin/reading-tests/*

import type { UpdateOf } from './common'
import type { ExamResultDetail, ExamResultSummary, ExamSubmitInput } from './exam-shared'

export interface ReadingQuestionOption {
  id?: number
  external_id?: string
  label: string
  value: string
}

export interface ReadingQuestion {
  id?: number
  external_id?: string
  question_number: number
  type: string
  text: string
  word_limit?: number | null
  correct_answer?: string[]
  options?: ReadingQuestionOption[]
}

export interface ReadingPart {
  id?: number
  external_id?: string
  title: string
  description?: string | null
  passage: string
  image_url?: string | null
  questions: ReadingQuestion[]
}

export interface ReadingTest {
  title: string
  cefr_level: string
  language: string
  duration_minutes: number
  total_questions: number | null
  is_demo: boolean
  is_free: boolean
  is_practice: boolean
  is_active: boolean
  parent_test_id?: string | null
  source_part_id?: number | null
  practice_part_number?: number | null
  id: string
  created_at: string
  parts: ReadingPart[]
}

export interface ReadingCreateInput {
  // NOTE: id yuborilmaydi — backend READ-{8 nanoid} ni o'zi yaratadi
  title: string
  cefr_level: string
  language?: 'en' | 'uz' | 'ru' | string
  duration_minutes: number
  total_questions?: number
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  parts: ReadingPart[]
}

export type ReadingUpdateInput = UpdateOf<ReadingCreateInput>

export type ReadingSubmitInput = ExamSubmitInput
export type ReadingResultSummary = ExamResultSummary
export type ReadingResultDetail = ExamResultDetail
