// Analysis moduli turlari: /analysis/*, /admin/analysis/*
// Backend OpenAPI da javob sxemalari (null) aniqlanmagan — shakllar sahifalarda ishlatilishiga ko'ra.

import type { JsonObject } from './common'
import type { SubscriptionTier } from './billing'

export type AnalysisQuota = JsonObject
export type AnalysisVideo = JsonObject
export type AnalysisAdminStatistics = JsonObject

export interface AnalysisLimitInput {
  tier: SubscriptionTier
  weekly_limit?: number | null
  monthly_limit?: number | null
}
