// Writing moduli turlari: /writing-tests/*, /admin/writing-tests/*

import type { CEFRLevel, JsonObject, UpdateOf } from './common'

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
  /** Ushbu task qaysi baholash rubrikasi (Writing Format) bo'yicha baholanishini bildiradi. */
  format_id?: number | null
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
  is_practice: boolean
  is_active: boolean
  created_at: string
  tasks: WritingTask[]
}

export interface WritingCreateInput {
  // NOTE: id yuborilmaydi — backend avtomatik yaratadi
  title: string
  cefr_level: string
  duration_minutes: number
  is_demo?: boolean
  is_free?: boolean
  is_practice?: boolean
  is_active?: boolean
  tasks: WritingTask[]
}

export type WritingUpdateInput = UpdateOf<WritingCreateInput>

/** Backend `WritingAnswerSubmit` sxemasi: har bir topshiriq DB id'si (`task_id`) va matn (`content`). Bo'sh matn ruxsat etilgan (vaqt tugagan). */
export interface WritingAnswerInput {
  task_id: number
  content: string
}

export interface WritingSubmitInput {
  answers: WritingAnswerInput[]
  exam_attempt_id?: number | null
  part_number?: number | null
}

export interface WritingCriterionScore {
  id: number
  criterion: string
  score: number
  created_at: string
}

export interface WritingFeedback {
  id: number
  source: 'AI' | 'HUMAN'
  model_name?: string | null
  content: string
  created_at: string
}

export interface WritingAnswerResult {
  id: number
  task_id: number
  content: string
  word_count: number
  penalty: number
  raw_score?: number | null
  scaled_score?: number | null
  created_at: string
  scores: WritingCriterionScore[]
  feedbacks: WritingFeedback[]
}

export interface WritingResult {
  id: number
  user_id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  username?: string | null
  birth_date?: string | null
  gender?: string | null
  language?: string | null
  exam_id: string
  /** Xom ball (2025 multilevel format): 1.1 (0–5) + 1.2 (0–5) + 2 (0–6) = 0–16. Baholanmagan bo'lsa null. */
  raw_score: number | null
  /** Yakuniy ball (0–75). Faqat yakuniy baholangandan keyin to'ldiriladi. */
  scaled_score: number | null
  cefr_level: CEFRLevel | null
  is_finalized: boolean
  evaluation_status?: string | null
  human_evaluator_id?: string | null
  ai_evaluated_at?: string | null
  ai_model?: string | null
  /** Baho manbai: AI yoki o'qituvchi (backend: evaluation_source). */
  evaluation_source?: string | null
  created_at: string
  answers: WritingAnswerResult[]
}

/** POST /admin/writing-tests/results/{id}/grade — teacher/admin yakuniy qo'lda baholash. */
export interface WritingGradeInput {
  /** Qaysi javobga baho berilayotgani (kiritilmasa — birinchisiga). */
  answer_id?: number | null
  /** Xom ball, 0..16 (1.1: 0–5, 1.2: 0–5, 2: 0–6). 0–75 yakuniy ball serverda hisoblanadi. */
  raw_score: number
  cefr_level: 'B1' | 'B2' | 'C1'
  feedback?: string | null
  criterion_scores?: JsonObject[]
}

/** POST /admin/writing-tests/results/{id}/ai-evaluate — AI qoralama baho. */
export interface WritingAiEvaluateInput {
  answer_id?: number | null
}

// Baholash rubrikasi formatlari
export type WritingStyle = 'INFORMAL' | 'FORMAL' | 'POST'
export type WritingScoringMode = 'HOLISTIC' | 'ANALYTIC'

export interface WritingCriterionWeight {
  criterion: string
  weight: number
}

export interface WritingFormat {
  id: number
  name: string
  cefr_level: CEFRLevel
  min_words: number
  max_words: number
  style: WritingStyle
  scoring_mode: WritingScoringMode
  penalty_enabled: boolean
  created_at: string
  criterion_configs: WritingCriterionWeight[]
}

export interface WritingFormatCreateInput {
  name: string
  cefr_level: 'B1' | 'B2' | 'C1'
  min_words: number
  max_words: number
  style: WritingStyle
  scoring_mode: WritingScoringMode
  penalty_enabled?: boolean
  criterion_weights: WritingCriterionWeight[]
}