// 11/12 — BILLING: /billing/* (foydalanuvchi), /admin/billing/* (admin). Spetsifikatsiya bo'yicha.

import { apiGet, apiPatch, apiPost, apiPut, apiUpload } from '../client'
import { apiUrl, enc } from '../config'
import { ROUTES } from '../routes'
import type {
  BillingLimits, BillingOrder, BillingOrderCreateInput, BillingPlan, BillingPlanInput, BillingPlanUpdateInput, BillingProduct, BillingProductInput,
  BillingSubscription, PaymentDetails, PromoCode, PromoCodeInput, PromoValidateInput,
  PromoValidateResult, TierLimitUpsertInput, BillingReportSummary,
} from '../types'

const BASE = ROUTES.billing
const ADMIN = ROUTES.billingAdmin

export const billingApi = {
  // --- Foydalanuvchi ---
  plans: () => apiGet<BillingPlan[]>(`${BASE}/plans`),
  products: (productType?: string) => apiGet<BillingProduct[]>(`${BASE}/products`, { query: { product_type: productType } }),
  validatePromo: (input: PromoValidateInput) => apiPost<PromoValidateResult>(`${BASE}/promo/validate`, input),
  createOrder: (input: BillingOrderCreateInput) => apiPost<BillingOrder>(`${BASE}/orders`, input),
  myOrders: (offset = 0, limit = 25) => apiGet<BillingOrder[]>(`${BASE}/orders`, { query: { offset, limit } }),
  orderDetail: (orderId: string) => apiGet<BillingOrder>(`${BASE}/orders/${enc(orderId)}`),
  cancelOrder: (orderId: string) => apiPost<BillingOrder>(`${BASE}/orders/${enc(orderId)}/cancel`),
  uploadReceipt: (orderId: string, file: File) => apiUpload<unknown>(`${BASE}/orders/${enc(orderId)}/receipt`, { file }),
  /** Shaxsiy chek fayli (autentifikatsiya kerak): authenticatedDownload bilan oching. */
  receiptFileUrl: (orderId: string) => apiUrl(`${BASE}/orders/${enc(orderId)}/receipt/file`),
  mySubscription: () => apiGet<BillingSubscription>(`${BASE}/me/subscription`),
  cancelMySubscription: () => apiPost<{ message: string; is_active: boolean }>(`${BASE}/me/subscription/cancel`),
  myLimits: () => apiGet<BillingLimits>(`${BASE}/me/limits`),
  /** Sotib olingan va hali sarflanmagan teacher tekshiruvlari: GET /billing/me/teacher-review-credits */
  myTeacherReviewCredits: () => apiGet<unknown>(`${BASE}/me/teacher-review-credits`),

  // --- Admin ---
  adminPlans: () => apiGet<BillingPlan[]>(`${ADMIN}/plans`),
  adminProducts: () => apiGet<BillingProduct[]>(`${ADMIN}/products`),
  createProduct: (input: BillingProductInput) => apiPost<BillingProduct>(`${ADMIN}/products`, input),
  updateProduct: (productId: number, input: Partial<Omit<BillingProductInput, 'product_type'>>) => apiPatch<BillingProduct>(`${ADMIN}/products/${enc(productId)}`, input),
  createPlan: (input: BillingPlanInput) => apiPost<BillingPlan>(`${ADMIN}/plans`, input),
  updatePlan: (planId: number, input: BillingPlanUpdateInput) => apiPatch<BillingPlan>(`${ADMIN}/plans/${enc(planId)}`, input),
  adminPromoCodes: () => apiGet<PromoCode[]>(`${ADMIN}/promo-codes`),
  createPromoCode: (input: PromoCodeInput) => apiPost<PromoCode>(`${ADMIN}/promo-codes`, input),
  updatePromoCode: (promoId: number, input: Partial<PromoCodeInput>) =>
    apiPatch<PromoCode>(`${ADMIN}/promo-codes/${enc(promoId)}`, input),
  reportSummary: (startDate?: string, endDate?: string) => apiGet<BillingReportSummary>(`${ADMIN}/reports/summary`, { query: { start_date: startDate, end_date: endDate } }),
  adminOrders: (status?: string, offset = 0, limit = 50) =>
    apiGet<BillingOrder[]>(`${ADMIN}/orders`, { query: { status, offset, limit } }),
  adminOrderReceiptUrl: (orderId: string) => apiUrl(`${ADMIN}/orders/${enc(orderId)}/receipt/file`),
  approveOrder: (orderId: string, note?: string) => apiPost<BillingOrder>(`${ADMIN}/orders/${enc(orderId)}/approve`, { note }),
  rejectOrder: (orderId: string, note?: string) => apiPost<BillingOrder>(`${ADMIN}/orders/${enc(orderId)}/reject`, { note }),
  tierLimits: () => apiGet<Record<string, { practice: { weekly_limit: number | null; monthly_limit: number | null }; analysis: { weekly_limit: number | null; monthly_limit: number | null } }>>('/admin/analysis/limits'),
  setPracticeLimit: (input: TierLimitUpsertInput) => apiPut<{ tier: string; weekly_limit: number | null; monthly_limit: number | null }>('/admin/analysis/limits/practice', input),
  setAnalysisLimit: (input: TierLimitUpsertInput) => apiPut<{ tier: string; weekly_limit: number | null; monthly_limit: number | null }>('/admin/analysis/limits/analysis', input),
  paymentDetails: () => apiGet<PaymentDetails>(`${BASE}/payment-details`),
  updatePaymentDetails: (input: PaymentDetails) => apiPut<PaymentDetails>(`${ADMIN}/payment-details`, input),
  adminCancelUserSubscription: (userId: string) =>
    apiPost<{ message: string; is_active: boolean }>(`${ADMIN}/users/${enc(userId)}/subscription/cancel`),
}
