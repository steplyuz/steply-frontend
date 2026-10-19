import { apiGet, apiPost, notifyAuthChanged } from '../client'
import { apiUrl } from '../config'
import { ROUTES } from '../routes'
import type {
  LoginResponse, Me, SmsRegistrationStatus, RegisterInitResponse, RegisterInput, RegisterResponse, RegisterVerifyInput, RegisterVerifyResponse,
  ResetPasswordInput, StatusMessage
} from '../types'

const BASE = ROUTES.auth

export const authApi = {
  me: () => apiGet<Me>(`${BASE}/me`),

  phoneLogin: async (phone: string, password: string) => {
    const res = await apiPost<LoginResponse>(`${BASE}/phone/login`, { phone, password }, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  /** Telegram popup login, 1-qadam: bir martalik nonce + public client_id. */
  telegramNonce: () =>
    apiPost<{ nonce: string; client_id: string }>(`${BASE}/telegram/nonce`, undefined, { anonymous: true }),

  /** Telegram popup login, 2-qadam: id_token ni backend tekshiradi va cookie sessiya ochadi. */
  telegramVerify: async (idToken: string) => {
    const res = await apiPost<StatusMessage>(`${BASE}/telegram/verify`, { id_token: idToken }, { anonymous: true })
    notifyAuthChanged()
    return res
  },

  /** Google GIS login, 1-qadam: bir martalik nonce + public client_id. */
  googleNonce: () =>
    apiPost<{ nonce: string; client_id: string }>(`${BASE}/google/nonce`, undefined, { anonymous: true }),

  /** Google GIS login, 2-qadam: id_token ni backend tekshiradi va cookie sessiya ochadi. */
  googleVerify: async (idToken: string) => {
    const res = await apiPost<StatusMessage>(`${BASE}/google/verify`, { id_token: idToken }, { anonymous: true })
    notifyAuthChanged()
    return res
  },

  register: (input: RegisterInput) => apiPost<RegisterInitResponse>(`${BASE}/register`, input, { anonymous: true }),

  registerVerify: async (input: RegisterVerifyInput) => {
    const res = await apiPost<RegisterVerifyResponse>(`${BASE}/register/verify`, input, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<StatusMessage>(`${BASE}/password/change`, { current_password: currentPassword, new_password: newPassword }),

  forgotPassword: (phone: string) => apiPost<StatusMessage>(`${BASE}/password/forgot`, { phone }, { anonymous: true }),

  resetPassword: (input: ResetPasswordInput) => apiPost<StatusMessage>(`${BASE}/password/reset`, input, { anonymous: true }),

  /** SMS orqali ro'yxatdan o'tish yoqilganmi (public): GET /auth/sms-registration/status */
  smsRegistrationStatus: () => apiGet<SmsRegistrationStatus>(`${BASE}/sms-registration/status`, { anonymous: true }),

  /** Telegram OIDC (redirect) login uchun to'liq manzil: GET /auth/telegram */
  telegramRedirectUrl: () => apiUrl(`${BASE}/telegram`),

  logout: async () => {
    try { await apiPost<StatusMessage>(`${BASE}/logout`) } finally { notifyAuthChanged() }
  },
}
