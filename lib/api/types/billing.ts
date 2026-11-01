// Billing moduli turlari: /billing/* (foydalanuvchi), /admin/billing/* (admin).
// Shakllar Billing API spetsifikatsiyasi bo'yicha.

import type { JsonObject } from './common'

export type BillingProductType =
  | 'subscription' | 'mock_exam' | 'speaking_practice' | 'full_skills' | 'full_exam'
  | 'ai_credits' | 'teacher_review_credits'
export type SubscriptionTier = 'free' | 'plus' | 'pro'
/** Spetsifikatsiyada: pending_payment, under_review (chek yuborilgan), paid, rejected, cancelled. */
export type BillingOrderStatus = 'pending_payment' | 'under_review' | 'paid' | 'rejected' | 'cancelled' | (string & {})
export type BillingSkill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'

export interface PaymentDetails {
  card_number: string
  card_holder: string
  bank_name: string
  account_number?: string | null
  phone_number?: string | null
  instructions?: string | null
}

export interface BillingPlan {
  id: number
  name: string
  description?: string | null
  price: number
  duration_days: number
  tier: SubscriptionTier
  ai_limit: number
  exam_limit?: number
  included_skills: BillingSkill[]
  ai_enabled: boolean
  discount_percent: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface BillingPlanInput {
  name: string
  description?: string | null
  price: number
  duration_days: number
  tier: SubscriptionTier
  ai_limit?: number
  exam_limit?: number
  included_skills?: BillingSkill[]
  ai_enabled?: boolean
  discount_percent?: number
  is_active?: boolean
}

export type BillingPlanUpdateInput = Partial<BillingPlanInput>

export interface BillingOrder {
  id: string
  user_id: string
  product_type: BillingProductType | string
  product_id?: string | null
  product_title: string
  amount: number
  original_amount: number
  discount_amount: number
  promo_code_id?: number | null
  organization_id?: string | null
  status: BillingOrderStatus
  user_note?: string | null
  admin_note?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  /** Spetsifikatsiyada yo'q; eski admin sahifa uchun saqlangan. Chekni /receipt/file orqali oling. */
  receipt_file_path?: string | null
  /** inPAY to'lov sahifasi: onlayn to'lov buyurtmalari uchun. Xaridorni shu manzilga yo'naltiring. */
  checkout_url?: string | null
  /** To'lov provayderi: 'inpay' yoki null (manual chek orqali to'lov). */
  payment_provider?: string | null
}

export interface BillingOrderCreateInput {
  product_type: BillingProductType
  product_id?: string | null
  user_note?: string | null
  promo_code?: string | null
}

export interface BillingSubscription {
  id: number
  user_id: string
  plan_id: number
  start_date: string
  end_date: string
  is_active: boolean
}

/** GET /billing/me/limits javobidagi AI oylik limiti. */
export interface BillingAiLimitUsage {
  enabled: boolean
  monthly_limit: number | null
  used_this_month: number
  subscription_remaining?: number
  purchased_remaining?: number
  remaining: number | null
}

/** GET /billing/me/limits: tarif, umumiy practice kvotasi va AI kvotasi. */
export interface BillingPracticeQuota {
  weekly_limit: number | null
  used_this_week: number
  remaining: number | null
  monthly_limit: number | null
  used_this_month: number
  remaining_this_month: number | null
}

export interface BillingLimits {
  tier: string
  week_start: string
  month_start?: string
  ai?: BillingAiLimitUsage
  /** Backend tomonidan to'rtta skill uchun umumiy hisoblanadigan practice kvotasi. */
  practice: BillingPracticeQuota
}

export interface TierLimitRule {
  tier: SubscriptionTier
  /** Practice kvotasi barcha skilllar uchun umumiy; analysis alohida kvota. */
  practice: { weekly_limit: number | null; monthly_limit: number | null }
  analysis: { weekly_limit: number | null; monthly_limit: number | null }
}

export interface TierLimitUpsertInput {
  tier: SubscriptionTier
  weekly_limit?: number | null
  monthly_limit?: number | null
}

export interface BillingProduct {
  id: number
  product_type: BillingProductType
  code?: string | null
  title: string
  description?: string | null
  price: number
  external_ref?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
}

export interface BillingProductInput {
  product_type: BillingProductType
  code: string
  title: string
  description?: string | null
  price: number
  external_ref?: string | null
  is_active?: boolean
}

export interface PromoCode {
  id: number
  code: string
  discount_percent?: number | null
  discount_amount?: number | null
  max_usage?: number | null
  used_count: number
  valid_from?: string | null
  valid_until?: string | null
  is_active: boolean
  /** Promo bog'langan tarif (null = istalgan tarif/mahsulot). */
  activates_plan_id?: number | null
}

export interface PromoCodeInput {
  code: string
  discount_percent?: number | null
  discount_amount?: number | null
  max_usage?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
  activates_plan_id?: number | null
}

export interface PromoValidateInput {
  code: string
  amount: number
}

/** POST /billing/promo/validate javobi. */
export interface PromoValidateResult {
  code: string
  discount_amount: number
  final_amount: number
  discount_percent: number | null
  fixed_discount_amount: number | null
  /** Promo bog'langan tarif ID (null = bog'lanmagan). */
  activates_plan_id: number | null
  /** 100% promo bog'langan tarif uchun: to'lovsiz darhol faollashtiriladi (POST /billing/promo/activate). */
  is_free_activation: boolean
}

/** POST /admin/billing/users/{user_id}/grant-subscription kirishi. */
export interface AdminGrantSubscriptionInput {
  plan_id: number
  note?: string | null
}

/** POST /billing/promo/activate javobi: 0 so'mlik PAID buyurtma (sotib olingan yozuv). */
export type PromoActivateInput = { code: string }

/** GET /billing/me/ai-quota: umumiy AI kreditlar (Writing + Speaking). */
export type AiQuota = BillingAiLimitUsage

export interface BillingReportSummary {
  total_orders: number
  paid_orders: number
  confirmed_revenue: number
  paid_original_amount: number
  paid_discount_amount: number
  by_status: Record<string, { count: number; amount: number }>
  currency: string
  start_date?: string | null
  end_date?: string | null
}