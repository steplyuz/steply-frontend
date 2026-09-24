// Auth moduli turlari: /auth/*

import type { Gender, StatusMessage } from './common'

export type { StatusMessage }

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export type OtpChannel = 'sms' | 'telegram'
export type OtpPurpose = 'register' | 'reset_password'

export interface SendOtpInput {
  phone: string
  channel?: OtpChannel
  purpose?: OtpPurpose
}

export interface RegisterInput {
  phone: string
  password: string
  full_name: string
  birth_date: string
  gender: Gender
  channel?: OtpChannel
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
  // Backend "need_registration" holatida token yubormaydi — shu uchun ixtiyoriy.
  token?: AuthToken
  message?: string
}

export interface RegisterResponse {
  status: string
  message?: string
  expires_in_seconds?: number
  bot_link?: string
}

export interface RegisterVerifyResponse {
  status: string
  token?: AuthToken
  cefr_code?: string
}
