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

/**
 * POST /apply/{registration_slug}.
 * Diqqat: backend jinsni `M` / `F` ko'rinishida kutadi (male/female emas) va
 * `address` maydonidan viloyatni aniqlaydi — qiymat sifatida Region kodi (masalan `samarkand`) yuboriladi.
 */
export interface ApplyInput {
  first_name: string
  last_name: string
  patronymic?: string | null
  address: string
  gender: 'M' | 'F'
  birth_date: string
  passport_series?: string | null
  phone: string
  photo_url: string
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
