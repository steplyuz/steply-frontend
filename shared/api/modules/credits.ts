// Admin AI kreditlar: /admin/credits/* (backend: app/modules/billing/credit_admin.py)
import { apiGet, apiPost } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type { AiCreditAdjustInput, AiCreditPlanAdjustResult, AiCreditUserAdjustResult, AiCreditUserDetail } from '../types'

export const adminCreditsApi = {
  userDetail: (userId: string) => apiGet<AiCreditUserDetail>(`${ROUTES.adminCredits}/users/${enc(userId)}`),
  adjustUser: (userId: string, input: AiCreditAdjustInput) =>
    apiPost<AiCreditUserAdjustResult>(`${ROUTES.adminCredits}/users/${enc(userId)}/adjust`, input),
  /** Tarifdagi faol obunachilarga kredit qo'shadi yoki ayiradi. */
  adjustPlan: (planId: number, input: AiCreditAdjustInput) =>
    apiPost<AiCreditPlanAdjustResult>(`${ROUTES.adminCredits}/plans/${enc(planId)}/adjust`, input),
}
