// Referal tizimi va admin tarif sozlamalari API'si.
// Tarif limitlari (practice) uchun mavjud billingApi.tierLimits / setPracticeLimit ishlatiladi.
import { apiGet, apiPost, apiPut } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  AdminReferralList, AdminReferralRow, AdminReferralUserDetail, AdminSkillMatrix, AdminTestAccessRule, AdminTierKey, AdminSkillKey,
  ReferralCreditAdjustInput, ReferralCreditAdjustResult, ReferralMe, ReferralResetCodeResult, ReferralSettings, ReferralStats,
  ReferralStatus,
} from '../types'

export const referralApi = {
  me: () => apiGet<ReferralMe>(`${ROUTES.referral}/me`),
}

export const adminReferralApi = {
  settings: () => apiGet<ReferralSettings>(`${ROUTES.adminReferral}/settings`),
  updateSettings: (input: ReferralSettings) => apiPut<ReferralSettings>(`${ROUTES.adminReferral}/settings`, input),
  stats: () => apiGet<ReferralStats>(`${ROUTES.adminReferral}/stats`),
  referrals: (params?: { status?: ReferralStatus; offset?: number; limit?: number }) =>
    apiGet<AdminReferralList>(`${ROUTES.adminReferral}/referrals`, { query: params }),
  /** Bitta user bo'yicha: kod, taklif qilganlar, kreditlar. */
  userDetail: (userId: string) => apiGet<AdminReferralUserDetail>(`${ROUTES.adminReferral}/users/${enc(userId)}`),
  /** Bonus kredit qo'shadi (delta>0) yoki ayiradi (delta<0). */
  adjustCredits: (userId: string, input: ReferralCreditAdjustInput) =>
    apiPost<ReferralCreditAdjustResult>(`${ROUTES.adminReferral}/users/${enc(userId)}/credits`, input),
  /** Eski referal kodni bekor qilib yangisini beradi. */
  resetCode: (userId: string) => apiPost<ReferralResetCodeResult>(`${ROUTES.adminReferral}/users/${enc(userId)}/reset-code`),
  /** Referalni bekor qiladi; shu referaldan qolgan kreditlar nolga tushadi. */
  voidReferral: (referralId: number, reason: string) =>
    apiPost<AdminReferralRow>(`${ROUTES.adminReferral}/referrals/${enc(referralId)}/void`, { reason }),
}

export const adminTiersApi = {
  skills: () => apiGet<AdminSkillMatrix>(`${ROUTES.adminTiers}/skills`),
  saveSkills: (tier: AdminTierKey, skills: Record<AdminSkillKey, boolean>) =>
    apiPut<AdminSkillMatrix>(`${ROUTES.adminTiers}/skills/${enc(tier)}`, { skills }),
  testAccess: (params?: { skill?: AdminSkillKey; test_id?: string }) =>
    apiGet<AdminTestAccessRule[]>(`${ROUTES.adminTiers}/test-access`, { query: params }),
  saveTestAccess: (skill: AdminSkillKey, testId: string, tiers: AdminTierKey[]) =>
    apiPut<{ skill: string; test_id: string; tiers: string[] }>(
      `${ROUTES.adminTiers}/test-access/${enc(skill)}/${enc(testId)}`, { tiers },
    ),
}
