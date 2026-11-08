// Practice testlar uchun premium qulf (UI qatlami).
//
// Qoida backendda (billing.entitlements.ensure_practice_access) va ro'yxat javobida (`is_locked`) hisoblanadi.
// Bu yerda faqat UI uchun umumiy yordamchilar bor. Asl himoya — server: qulflangan testni boshlash 403 qaytaradi.

import type { PracticeCatalogItem } from '@/shared/api/types'

/** Obuna sotib olish sahifasi. */
export const PREMIUM_UPGRADE_HREF = '/dashboard/billing'

export const isPremiumTest = (t: Pick<PracticeCatalogItem, 'access' | 'is_free'>) => t.access === 'premium' || !t.is_free

/** Katalog elementi joriy foydalanuvchi uchun qulflanganmi (eski javoblarda `is_locked` bo'lmasa — ochiq deb olinadi). */
export const isLockedTest = (t: Partial<Pick<PracticeCatalogItem, 'is_locked'>>) => t.is_locked === true

/** 403 "obuna kerak" xatosini aniqlaydi (test boshlash / kontent olishda). */
export const isSubscriptionRequiredError = (e: unknown) => {
  const status = (e as { status?: number } | null)?.status
  return status === 403
}
