// Billing moduli turlari: /billing/*, /admin/billing/*

import type { JsonObject } from './common'

// Sxemalar hali aniqlanmagan — aniqlangach har birini alohida interfeysga aylantiring.
export type BillingPlan = JsonObject
export type BillingProduct = JsonObject
export type BillingProductCreateInput = JsonObject
export type BillingOrder = JsonObject
export type BillingOrderCreateInput = JsonObject
export type BillingSubscription = JsonObject
export type BillingLimits = JsonObject
export type TierLimits = JsonObject
export type TierLimitsUpdateInput = JsonObject
