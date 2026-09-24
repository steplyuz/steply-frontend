// Public moduli turlari: /public/* (token shart emas)

import type { MockExam } from './mock-exams'

export interface PublicExamSession {
  id: number
  mock_exam_id: string
  exam_date: string
  center_name: string | null
  room_name: string | null
  location_address: string
  region: string | null
  capacity: number | null
  registered_count: number
  available_seats: number | null
  is_full: boolean
  required_documents: string[]
  is_active: boolean
}

export interface PublicExamDetail extends MockExam {
  sessions: PublicExamSession[]
}

export interface PublicSessionDetail {
  exam: {
    id: string
    title: string
    description: string | null
    cefr_level: string
    duration_minutes: number
    price: number
    image_file: string | null
  }
  session: PublicExamSession
}

export interface PublicStats {
  active_mock_exams: number
  upcoming_sessions: number
  registrations: number
}

export interface VerifiedResultSkill {
  cefr_level: string
  scaled_score: number
}

export interface VerifiedResult {
  full_name?: string
  student_id?: string
  result_id?: string | number
  overall_score?: number
  overall?: number
  cefr_level?: string
  status?: string
  reading?: VerifiedResultSkill
  listening?: VerifiedResultSkill
  writing?: VerifiedResultSkill
  speaking?: VerifiedResultSkill
  [key: string]: unknown
}
