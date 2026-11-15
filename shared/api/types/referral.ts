// Referal tizimi va admin tarif sozlamalari (backend: /referral/*, /admin/referral/*, /admin/tiers/*)

/** GET /referral/me */
export interface ReferralMe {
  code: string
  enabled: boolean
  invited: number
  pending: number
  qualified: number
  capped: number
  credits_available: number
  reward: { credits: number; tier_days: number }
}

/** GET/PUT /admin/referral/settings */
export interface ReferralSettings {
  enabled: boolean
  reward_credits: number
  credit_expiry_days: number | null
  reward_plan_id: number | null
  reward_tier_days: number
  max_rewards_per_user: number | null
}

export type ReferralStatus = 'pending' | 'qualified' | 'capped'

/** GET /admin/referral/stats */
export interface ReferralStats {
  by_status: Partial<Record<ReferralStatus, number>>
  credits_granted: number
  credits_remaining: number
  top_referrers: Array<{ user_id: string; qualified: number }>
}

export interface AdminReferralItem {
  id: number
  referrer: { id: string; name: string | null }
  referred: { id: string; name: string | null }
  status: ReferralStatus
  created_at: string
  qualified_at: string | null
}

/** GET /admin/referral/referrals */
export interface AdminReferralList {
  total: number
  items: AdminReferralItem[]
}

export type AdminTierKey = 'free' | 'plus' | 'pro'
export type AdminSkillKey = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'

/** GET /admin/tiers/skills: { free: { READING: true, ... }, plus: {...}, pro: {...} } */
export type AdminSkillMatrix = Record<AdminTierKey, Record<AdminSkillKey, boolean>>

/** GET /admin/tiers/test-access: har bir (skill, test, tarif) juftligi uchun bitta qator */
export interface AdminTestAccessRule {
  skill: AdminSkillKey
  test_id: string
  tier: AdminTierKey
}
