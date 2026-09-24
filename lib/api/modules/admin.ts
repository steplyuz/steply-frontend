// 12/12 — ADMIN: /admin/* (mock-exams, testlar va billing'ga kirmaydigan umumiy admin funksiyalar)
//
// Check-in / ball qo'yish / finalize `mock-center.ts` (mockCenterApi) da — bu yerda takrorlanmaydi.

import { apiGet, apiPatch } from '../client'
import { apiUrl, enc } from '../config'
import { ROUTES } from '../routes'
import type {
  AdminAttempt, AdminDashboard, AdminOmrQuery, AdminRegistration, AdminRegistrationsQuery, AdminResult,
  AdminStatistics, AdminUser, AdminUserUpdateInput, AdminUsersQuery, OmrSubmission,
} from '../types'

const BASE = ROUTES.admin

export const adminApi = {
  statistics: () => apiGet<AdminStatistics>(`${BASE}/statistics`),
  dashboard: () => apiGet<AdminDashboard>(`${BASE}/dashboard`),
  exportUsersUrl: () => apiUrl(`${BASE}/export/users`),

  // --- Foydalanuvchilar ---
  users: (params?: AdminUsersQuery) => apiGet<AdminUser[]>(`${BASE}/users`, { query: params }),
  userDetail: (userId: string) => apiGet<AdminUser>(`${BASE}/users/${enc(userId)}`),
  updateUser: (userId: string, input: AdminUserUpdateInput) => apiPatch<AdminUser>(`${BASE}/users/${enc(userId)}`, input),

  // --- Ro'yxatdan o'tishlar, urinishlar, natijalar ---
  registrations: (params?: AdminRegistrationsQuery) => apiGet<AdminRegistration[]>(`${BASE}/registrations`, { query: params }),
  updateRegistrationStatus: (registrationId: number, status: string) =>
    apiPatch<AdminRegistration>(`${BASE}/registrations/${enc(registrationId)}/status`, { status }),
  attempts: (sessionId?: number, userId?: number) =>
    apiGet<AdminAttempt[]>(`${BASE}/attempts`, { query: { session_id: sessionId, user_id: userId } }),
  results: (status?: string) => apiGet<AdminResult[]>(`${BASE}/results`, { query: { status } }),

  // --- OMR ---
  omrSubmissions: (params?: AdminOmrQuery) => apiGet<OmrSubmission[]>(`${BASE}/omr/submissions`, { query: params }),
  omrSubmission: (submissionId: number) => apiGet<OmrSubmission>(`${BASE}/omr/submissions/${enc(submissionId)}`),
  updateOmrStatus: (submissionId: number, status: string) =>
    apiPatch<OmrSubmission>(`${BASE}/omr/submissions/${enc(submissionId)}/status`, undefined, { query: { status } }),
}
