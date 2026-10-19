// Public ro'yxatdan o'tish (login talab qilinmaydi): /apply/{registration_slug}

export interface ApplySession {
  id: number
  name: string
  exam_type: string
  delivery_mode: string
  scheduled_at: string
  location: string
  duration_minutes: number
  payment_details?: string | null
}

/** POST /apply/{registration_slug} */
export interface ApplyInput {
  first_name: string
  last_name: string
  patronymic?: string | null
  address?: string | null
  gender: 'male' | 'female'
  birth_date?: string | null
  passport_series?: string | null
  phone?: string | null
  photo_url?: string | null
  captcha_token?: string | null
}

export interface ApplyResult {
  id: string
  session_id: number
  exam_id: string
  first_name: string
  last_name: string
  patronymic?: string | null
  address?: string | null
  gender: string
  birth_date?: string | null
  passport_series?: string | null
  phone?: string | null
  photo_url?: string | null
  status: string
  checked_in_at?: string | null
  created_at: string
}
