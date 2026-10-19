// Auth moduli turlari: /auth/*

import type { Gender, StatusMessage } from './common'

export type { StatusMessage }

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type?: 'bearer'
}

export interface RegisterInput {
  phone: string
  password: string
  full_name: string
  birth_date: string
  gender: Gender
}

export interface RegisterVerifyInput {
  phone: string
  code: string
}

export interface ResetPasswordInput {
  phone: string
  code: string
  new_password: string
}

export interface LoginResponse {
  status: string
  token?: AuthToken
  message?: string
  force_password_change?: boolean
}

export interface RegisterResponse {
  status: string
  message?: string
  expires_in_seconds?: number
  bot_link?: string
}

/** POST /auth/register javobi (backend: RegisterInitResponse) — RegisterResponse bilan bir xil shakl. */
export type RegisterInitResponse = RegisterResponse

export interface RegisterVerifyResponse {
  status: string
  token?: AuthToken
}

export interface UserProfile {
  full_name: string
  username: string
  avatar_url: string | null
  bio: string | null
  birth_date: string | null
  gender: Gender | null
  /** Backend /auth/me da qaytarilmaydi (ixtiyoriy, kelajak uchun). */
  cefr_code?: string | null
  language: string
  timezone: string
}

export interface UserContact {
  id: number
  contact_type: 'email' | 'phone'
  value: string
  is_verified: boolean
  is_primary: boolean
  created_at: string
}

export interface Me {
  id: string | number
  is_active: boolean
  force_password_change: boolean
  /** Backend rollari: student | teacher | organization | admin. Eski nomlar (super_admin, expert, ...) faqat moslik uchun. */
  global_role: 'student' | 'teacher' | 'organization' | 'admin' | (string & {})
  created_at: string
  updated_at: string
  profile: UserProfile
  contacts: UserContact[]
}


/** GET /auth/sms-registration/status (public) */
export interface SmsRegistrationStatus {
  sms_registration_enabled: boolean
}
