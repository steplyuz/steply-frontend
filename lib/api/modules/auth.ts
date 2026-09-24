// 1/12 — AUTH: /auth/*
// Ro'yxatdan o'tmagan (anonymous) va o'tgan foydalanuvchi aralash.

import { apiGet, apiPost, notifyAuthChanged } from '../client'
import { ROUTES } from '../routes'
import type {
  LoginResponse, Me, RegisterInput, RegisterResponse, RegisterVerifyInput, RegisterVerifyResponse,
  ResetPasswordInput, SendOtpInput, StatusMessage,
} from '../types'

const BASE = ROUTES.auth

export const authApi = {
  me: () => apiGet<Me>(`${BASE}/me`),

  sendOtp: (input: SendOtpInput) => apiPost<StatusMessage>(`${BASE}/otp/send`, input, { anonymous: true }),

  phoneLogin: async (phone: string, password: string) => {
    const res = await apiPost<LoginResponse>(`${BASE}/phone/login`, { phone, password }, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  register: (input: RegisterInput) => apiPost<RegisterResponse>(`${BASE}/register`, input, { anonymous: true }),

  registerVerify: async (input: RegisterVerifyInput) => {
    const res = await apiPost<RegisterVerifyResponse>(`${BASE}/register/verify`, input, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  forgotPassword: (phone: string) => apiPost<StatusMessage>(`${BASE}/password/forgot`, { phone }, { anonymous: true }),

  resetPassword: (input: ResetPasswordInput) => apiPost<StatusMessage>(`${BASE}/password/reset`, input, { anonymous: true }),

  logout: async () => {
    try { await apiPost<StatusMessage>(`${BASE}/logout`) } finally { notifyAuthChanged() }
  },

}
