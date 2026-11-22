// Admin obuna boshqaruvi: /admin/subscriptions

export type AdminSubscriptionStatus = 'active' | 'expired' | 'all'

export interface AdminSubscriptionItem {
  id: number
  user_id: string
  full_name: string | null
  plan_id: number
  plan_name: string
  start_date: string
  end_date: string
  is_active: boolean
  days_left: number
}

export interface AdminSubscriptionPage {
  total: number
  items: AdminSubscriptionItem[]
}

export type AdminSubscriptionFilters = {
  status?: AdminSubscriptionStatus
  plan_id?: number
  user_id?: string
  offset?: number
  limit?: number
}

/** Har bir o'zgarish izoh bilan audit qilinadi (note majburiy). */
export interface AdminSubscriptionPatchInput {
  plan_id?: number
  end_date?: string
  is_active?: boolean
  note: string
}

export interface AdminSubscriptionExtendInput {
  days: number
  note: string
}
