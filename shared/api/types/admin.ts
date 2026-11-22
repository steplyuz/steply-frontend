// Admin API turlari: foydalanuvchilar va practice boshqaruvi

import type { JsonObject } from './common'

export type AdminUsersQuery = {
  search?: string
  role?: string
  registration_method?: string
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
  /** Qanday ro'yxatdan o'tgan: phone_sms | phone_telegram | google | telegram_login | unknown */
  registration_method: string | null
  created_at: string
}

export interface AdminUserDetail {
  id: string
  is_active: boolean
  global_role: AdminUser['global_role']
  registration_method?: string | null
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

// ---------- Statistika: faol vaqt va yechilgan testlar (backend: /admin/statistics/*) ----------

export interface SkillTestCounts {
  reading: number
  listening: number
  writing: number
  speaking: number
  total: number
}

/** GET /admin/statistics/overview */
export interface AdminStatsOverview {
  total_users: number
  active_today: number
  active_7d: number
  active_30d: number
  time_30d_seconds: number
  avg_time_per_active_user_30d_seconds: number
  test_takers_all_time: number
  test_takers_30d: number
  tests_all_time: SkillTestCounts
  tests_30d: SkillTestCounts
}

export interface AdminActivityPoint {
  date: string
  active_users: number
  active_seconds: number
}

/** GET /admin/statistics/activity */
export interface AdminActivitySeries {
  days: number
  points: AdminActivityPoint[]
}

export type AdminStatsSort =
  | 'total_tests' | 'reading' | 'listening' | 'writing' | 'speaking'
  | 'active_seconds' | 'last_seen_at' | 'last_login_at' | 'created_at'

export type AdminStatsUsersQuery = {
  sort?: AdminStatsSort
  desc?: boolean
  search?: string
  offset?: number
  limit?: number
}

export interface AdminStatsUserRow {
  id: string
  full_name: string | null
  username: string | null
  role: string
  created_at: string
  last_login_at: string | null
  last_seen_at: string | null
  active_seconds: number
  reading: number
  listening: number
  writing: number
  speaking: number
  total_tests: number
}

/** GET /admin/statistics/users */
export interface AdminStatsUsersPage {
  total: number
  offset: number
  limit: number
  items: AdminStatsUserRow[]
}

/** GET /admin/statistics/users/{id} */
export interface AdminStatsUserDetail {
  id: string
  full_name: string | null
  username: string | null
  role: string
  last_login_at: string | null
  last_seen_at: string | null
  active_seconds_all_time: number
  tests: SkillTestCounts
  daily: Array<{ date: string; active_seconds: number; heartbeats: number }>
}
