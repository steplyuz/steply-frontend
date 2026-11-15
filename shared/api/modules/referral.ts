// Referal tizimi va admin tarif sozlamalari API'si.
// Tarif limitlari (practice) uchun mavjud billingApi.tierLimits / setPracticeLimit ishlatiladi.
import { apiGet, apiPut } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  AdminReferralList, AdminSkillMatrix, AdminTestAccessRule, AdminTierKey, AdminSkillKey,
  ReferralMe, ReferralSettings, ReferralStats, ReferralStatus,
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
