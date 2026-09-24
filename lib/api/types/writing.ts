// Writing moduli turlari: /writing-tests/*, /admin/writing-tests/*

import type { CEFRLevel, JsonObject } from './common'

export interface WritingTask {
  id?: number
  exam_id?: string
  part_number: number
  sub_part?: number | null
  cefr_level?: CEFRLevel | null
  topic: string
  instruction: string
  context_text?: string | null
  question?: string | null
  word_limit?: number | { min: number; max: number } | null
  format?: JsonObject
}

export interface WritingExam {
  id: string
  year: number
  sequence_number: number
  title: string
  cefr_level: CEFRLevel
  duration_minutes: number
  is_demo: boolean
  is_free: boolean
  is_mock: boolean
  is_active: boolean
  created_at: string
  tasks: WritingTask[]
}

// Create/update body sxemasi hali aniqlanmagan — sahifalar erkin obyekt yuboradi.
export type WritingCreateInput = JsonObject
export type WritingUpdateInput = JsonObject

export interface WritingSubmitInput {
  answers: Record<string, unknown>[]
}

export interface WritingResult {
  id: number
  user_id: number
  exam_id: string
  raw_score: number
  scaled_score: number
  cefr_level: CEFRLevel
  is_finalized: boolean
  created_at: string
  answers: Record<string, unknown>[]
}

// Baholash rubrikasi formatlari
export type WritingFormat = JsonObject
export type WritingFormatCreateInput = JsonObject
