// Admin API: dashboard, statistika, foydalanuvchilar, sessiyalar, ro'yxatlar, OMR, SMS sozlamasi.
// Barcha yo'llar backend OpenAPI (Mock Center API 3.0.0-mvp) dagi "Admin" tegiga mos.

import { apiGet, apiPatch, apiPost, apiPut } from '../client'
import { apiUrl, enc } from '../config'
import { ROUTES } from '../routes'
import type {
  AdminDashboard, AdminPageQuery, AdminStatistics, AdminTraffic, AdminUser, AdminUserDetail,
  AdminUserUpdateInput, AdminUsersQuery, JsonObject, SmsRegistrationSetting, StatusMessage, TrafficPeriod,
} from '../types'

const BASE = ROUTES.admin

export const adminApi = {
  dashboard: () => apiGet<AdminDashboard>(`${BASE}/dashboard`),
  statistics: () => apiGet<AdminStatistics>(`${BASE}/statistics`),
  traffic: (period: TrafficPeriod = 'week') => apiGet<AdminTraffic>(`${BASE}/statistics/traffic`, { query: { period } }),
  exportUsersUrl: () => apiUrl(`${BASE}/export/users`),

  // --- Foydalanuvchilar ---
  users: (params?: AdminUsersQuery) => apiGet<AdminUser[]>(`${BASE}/users`, { query: params }),
  userDetail: (userId: string) => apiGet<AdminUserDetail>(`${BASE}/users/${enc(userId)}`),
  updateUser: (userId: string, input: AdminUserUpdateInput) => apiPatch<AdminUser>(`${BASE}/users/${enc(userId)}`, input),
  revokeAllSessions: (userId: string) => apiPost<StatusMessage>(`${BASE}/users/${enc(userId)}/sessions/revoke-all`),
  sessions: (params?: AdminPageQuery & { user_id?: string; is_revoked?: boolean }) =>
    apiGet<JsonObject[]>(`${BASE}/sessions`, { query: params }),

  // --- Mock: ro'yxatlar, urinishlar, natijalar ---
  registrations: (params?: AdminPageQuery & { session_id?: number; status?: string }) =>
    apiGet<JsonObject[]>(`${BASE}/registrations`, { query: params }),
  setRegistrationStatus: (registrationId: number, status: string) =>
    apiPatch<JsonObject>(`${BASE}/registrations/${enc(registrationId)}/status`, { status }),
  attempts: (params?: AdminPageQuery & { session_id?: number; user_id?: string }) =>
    apiGet<JsonObject[]>(`${BASE}/attempts`, { query: params }),
  results: (params?: AdminPageQuery & { status?: string }) => apiGet<JsonObject[]>(`${BASE}/results`, { query: params }),

  // --- OMR ---
  omrSubmissions: (params?: { module?: string; status?: string; candidate_id?: string; limit?: number }) =>
    apiGet<JsonObject[]>(`${BASE}/omr/submissions`, { query: params }),
  omrSubmission: (submissionId: number) => apiGet<JsonObject>(`${BASE}/omr/submissions/${enc(submissionId)}`),
  setOmrStatus: (submissionId: number, status: string) =>
    apiPatch<JsonObject>(`${BASE}/omr/submissions/${enc(submissionId)}/status`, undefined, { query: { status } }),

  // --- SMS orqali ro'yxatdan o'tishni yoqish/o'chirish (DB'da saqlanadi) ---
  smsRegistration: () => apiGet<SmsRegistrationSetting>(`${BASE}/settings/sms-registration`),
  setSmsRegistration: (enabled: boolean) =>
    apiPut<SmsRegistrationSetting>(`${BASE}/settings/sms-registration`, { sms_registration_enabled: enabled }),
}
