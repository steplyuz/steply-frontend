// 11/12 — BILLING: /billing/* (foydalanuvchi), /admin/billing/* (admin)

import { apiGet, apiPost, apiPut, apiUpload } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  BillingLimits, BillingOrder, BillingOrderCreateInput, BillingPlan, BillingProduct, BillingProductCreateInput,
  BillingSubscription, TierLimits, TierLimitsUpdateInput,
} from '../types'

const BASE = ROUTES.billing
const ADMIN = ROUTES.billingAdmin

export const billingApi = {
  // --- Foydalanuvchi ---
  plans: () => apiGet<BillingPlan[]>(`${BASE}/plans`),
  products: (productType?: string) => apiGet<BillingProduct[]>(`${BASE}/products`, { query: { product_type: productType } }),
  createOrder: (input: BillingOrderCreateInput) => apiPost<BillingOrder>(`${BASE}/orders`, input),
  uploadReceipt: (orderId: string, file: File) => apiUpload<BillingOrder>(`${BASE}/orders/${enc(orderId)}/receipt`, { file }),
  myOrders: (offset = 0, limit = 25) => apiGet<BillingOrder[]>(`${BASE}/orders`, { query: { offset, limit } }),
  orderDetail: (orderId: string) => apiGet<BillingOrder>(`${BASE}/orders/${enc(orderId)}`),
  mySubscription: () => apiGet<BillingSubscription>(`${BASE}/me/subscription`),
  myLimits: () => apiGet<BillingLimits>(`${BASE}/me/limits`),

  // --- Admin ---
  adminProducts: () => apiGet<BillingProduct[]>(`${ADMIN}/products`),
  createProduct: (input: BillingProductCreateInput) => apiPost<BillingProduct>(`${ADMIN}/products`, input),
  adminOrders: (status?: string, offset = 0, limit = 50) =>
    apiGet<BillingOrder[]>(`${ADMIN}/orders`, { query: { status, offset, limit } }),
  approveOrder: (orderId: string, comment?: string) => apiPost<BillingOrder>(`${ADMIN}/orders/${enc(orderId)}/approve`, { comment }),
  rejectOrder: (orderId: string, comment?: string) => apiPost<BillingOrder>(`${ADMIN}/orders/${enc(orderId)}/reject`, { comment }),
  tierLimits: () => apiGet<TierLimits>(`${ADMIN}/tier-limits`),
  updateTierLimits: (input: TierLimitsUpdateInput) => apiPut<TierLimits>(`${ADMIN}/tier-limits`, input),
}
