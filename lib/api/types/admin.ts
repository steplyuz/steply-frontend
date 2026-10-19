// Admin API turlari: foydalanuvchilar va practice boshqaruvi

import type { JsonObject } from './common'

export type AdminUsersQuery = {
  search?: string
  role?: string
  is_active?: boolean
  offset?: number
  limit?: number
}

export interface AdminDashboard {
  users: number
  active_users: number
  mock_exams?: number
  sessions?: number
  registrations?: number
  attempts?: number
  final_results?: number
  omr_pending?: number
  teachers?: number
  paid_orders?: number
  pending_orders?: number
  confirmed_revenue?: number
}

/** GET /admin/users va PATCH /admin/users/{id} javobining backenddagi aniq shakli. */
export interface AdminUser {
  id: string
  is_active: boolean
  global_role: 'student' | 'teacher' | 'admin' | 'super_admin' | (string & {})
  full_name: string | null
  username: string | null
  mk_id: string | null
  created_at: string
}

export interface AdminUserDetail {
  id: string
  is_active: boolean
  global_role: AdminUser['global_role']
  profile: JsonObject | null
  contacts: JsonObject[]
  sessions: Array<{ id: string; expires_at: string; is_revoked: boolean }>
}

export type AdminUserUpdateInput = Partial<Pick<AdminUser, 'is_active' | 'global_role'>>

// ---------- Qo'shimcha admin endpointlari (backend: Admin tegi) ----------

/** GET/PUT/PATCH /admin/settings/sms-registration */
export interface SmsRegistrationSetting {
  sms_registration_enabled: boolean
}

export type TrafficPeriod = 'week' | 'month' | 'last7' | 'last30'

export interface TrafficTotals {
  new_users: number
  practice_attempts: number
  mock_results: number
  ai_checks: number
}

/** GET /admin/statistics */
export interface AdminStatistics {
  total_users: number
  total_exams_taken: number
  users_today: number
  week: TrafficTotals
  month: TrafficTotals
}

/** GET /admin/statistics/traffic */
export interface AdminTraffic {
  period: string
  start: string
  end: string
  /** Kunlik nuqtalar: { date, new_users, practice_attempts, mock_results, ai_checks } */
  points: Array<{ date?: string } & Partial<TrafficTotals> & JsonObject>
  totals: TrafficTotals
}

export interface AdminPageQuery extends Record<string, string | number | boolean | undefined | null> {
  offset?: number
  limit?: number
}
