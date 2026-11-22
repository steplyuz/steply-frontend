// AI kreditlar (admin): userga yoki tarif obunachilariga qo'shish/ayirish. Backend: /admin/credits/*

export interface AiCreditGrant {
  id: number
  credits_total: number
  credits_remaining: number
  created_at: string
}

/** GET /admin/credits/users/{user_id} */
export interface AiCreditUserDetail {
  user_id: string
  balance: number
  grants: AiCreditGrant[]
}

/** delta: musbat — qo'shish, manfiy — ayirish */
export interface AiCreditAdjustInput {
  delta: number
  note: string
}

/** POST /admin/credits/users/{user_id}/adjust */
export interface AiCreditUserAdjustResult {
  user_id: string
  delta: number
  balance: number
}

/** POST /admin/credits/plans/{plan_id}/adjust */
export interface AiCreditPlanAdjustResult {
  plan_id: number
  plan_name: string
  subscribers: number
  affected_users: number
  skipped_users: number
  credits_changed_total: number
}
