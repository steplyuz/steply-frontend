// Listening moduli turlari: /listening-tests/*, /admin/listening-tests/*

import type { UpdateOf } from './common'
import type { ExamResultDetail, ExamResultSummary, ExamSubmitInput } from './exam-shared'

export interface ListeningOption {
  id?: number
  value: string
  label: string
}

export interface ListeningQuestion {
  id?: number
  question_number: number
  type: string
  question: string
  correct_answer?: string
  options?: ListeningOption[]
}

export interface ListeningPart {
  id?: number
  part_number: number
  title: string
  instruction?: string | null
  task_type?: string | null
  audio_label?: string | null
  audio_url?: string | null
  context?: string | null
  passage?: string | null
  map_image?: string | null
  questions: ListeningQuestion[]
  options?: ListeningOption[]
}

export type ListeningAudioMode = 'EXAM' | 'PARTS'

export interface ListeningTest {
  title: string
  is_demo: boolean
  is_free: boolean
  is_mock: boolean
  is_active: boolean
  level: string
  duration: number
  total_questions: number
  sections: string
  audio_mode: ListeningAudioMode
  audio_url?: string | null
  id: string
  parts: ListeningPart[]
  created_at: string
}

export interface ListeningCreateInput {
  title: string
  is_demo?: boolean
  is_free?: boolean
  is_mock?: boolean
  is_active?: boolean
  level: string
  duration: number
  total_questions?: number
  sections?: string
  audio_mode?: ListeningAudioMode
  audio_url?: string | null
  parts: ListeningPart[]
}

export type ListeningUpdateInput = UpdateOf<ListeningCreateInput>

export type ListeningSubmitInput = ExamSubmitInput
export type ListeningResultSummary = ExamResultSummary
export type ListeningResultDetail = ExamResultDetail

export interface UploadedAudio {
  url: string
  filename: string
  size: number
}
