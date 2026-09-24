// Admin moduli turlari: /admin/* (mock-exams, tests va billing'dan tashqari umumiy funksiyalar)

import type { JsonObject } from './common'

export interface AdminStatistics {
  total_users: number
  total_exams_taken: number
  users_today: number
}

export type AdminUsersQuery = {
  search?: string
  role?: string
  is_active?: boolean
  offset?: number
  limit?: number
}

export type AdminRegistrationsQuery = {
  session_id?: number
  status?: string
  offset?: number
  limit?: number
}

export type AdminOmrQuery = {
  module?: string
  status?: string
  candidate_id?: string
  limit?: number
}

export type AdminDashboard = JsonObject
export type AdminUser = JsonObject
export type AdminUserUpdateInput = JsonObject
export type AdminRegistration = JsonObject
export type AdminAttempt = JsonObject
export type AdminResult = JsonObject
export type OmrSubmission = JsonObject
