'use client'

import { useEffect, useState } from 'react'
import { billingApi } from '@/shared/api'
import type { BillingSubscription } from '@/shared/api/types'

/** Obuna faol va muddati tugamagan bo'lsa true. */
export function hasActiveSubscription(s: BillingSubscription | null | undefined, now = Date.now()): boolean {
  return !!s && s.is_active === true && new Date(s.end_date).getTime() > now
}

/**
 * Joriy foydalanuvchida faol obuna bormi.
 * null — hali aniqlanmagan. Xatolikda false (xavfsiz tomon: premium bloklanadi;
 * server baribir 403 qaytaradi).
 */
export function usePaidAccess(): boolean | null {
  const [paid, setPaid] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    billingApi
      .mySubscription()
      .then((s) => alive && setPaid(hasActiveSubscription(s)))
      .catch(() => alive && setPaid(false))
    return () => {
      alive = false
    }
  }, [])

  return paid
}
