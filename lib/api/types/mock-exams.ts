// Mock exams moduli turlari: /mock-exams/*, /admin/mock-exams/*

import type { Gender, Region, UpdateOf } from './common'
import type { PublicExamSession } from './public'

export interface MockExam {
  id: string
  title: string
  description?: string | null
  image_file?: string | null
  cefr_level: string
  duration_minutes?: number
  price: number
  is_active: boolean
  is_purchased?: boolean
  reading_id?: string | null
  listening_id?: string | null
  writing_id?: string | null
  speaking_id?: string | null
  created_at?: string
  upcoming_sessions_count?: number
  sessions?: PublicExamSession[]
}

export interface MockExamCreateInput {
  title: string
  description?: string | null
  image_file?: string | null
  cefr_level?: string
  duration_minutes?: number
  price?: number
  is_active?: boolean
  reading_id?: string | null
  listening_id?: string | null
  writing_id?: string | null
  speaking_id?: string | null
}

export type MockExamUpdateInput = UpdateOf<MockExamCreateInput>

export interface MockExamPurchase {
  id: number
  user_id: number
  mock_exam_id: string
  is_active: boolean
  comment: string
  created_at: string
}

// ---------- Sessiyalar (qog'oz imtihon, offline) ----------

export interface ExamSession {
  id: number
  mock_exam_id: string
  exam_date: string
  center_name?: string | null
  room_name?: string | null
  location_address: string
  region: Region | string | null
  capacity: number | null
  required_documents: string | string[] | null
  registered_count?: number
  available_seats?: number | null
  is_full?: boolean
  is_active: boolean
}

export interface ExamSessionCreateInput {
  mock_exam_id: string
  exam_date: string
  center_name?: string | null
  room_name?: string | null
  location_address: string
  region?: Region | null
  capacity?: number | null
  required_documents?: string | null
  is_active?: boolean
}

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' | string

export interface SessionRegistration {
  id: number
  user_id: number
  session_id: number
  mock_exam_id: string
  full_name: string
  student_id: string
  age: number
  date_of_birth: string | null
  gender: Gender
  region: Region | string
  photo_url: string | null
  status: RegistrationStatus
  attended_confirmed_at: string | null
  created_at: string
  exam_date?: string | null
  center_name?: string | null
  room_name?: string | null
  location_address?: string | null
}

export interface RegisterForSessionInput {
  session_id: number
  full_name: string
  age: number
  date_of_birth?: string | null
  gender: Gender
  region: Region
  photo_url?: string | null
}

// ---------- AI javob varaqlarini tekshirish (admin) ----------

export interface GradeWithKeysInput {
  listening_answer_key?: string
  reading_answer_key?: string
  exam_id?: string
}
