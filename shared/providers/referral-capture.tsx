'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureReferralFromUrl } from '@/shared/lib/referral'

/** Har sahifa o'zgarganda ?ref= ni saqlaydi. Hech narsa render qilmaydi. */
export function ReferralCapture() {
  const pathname = usePathname()
  useEffect(() => {
    captureReferralFromUrl(window.location.search)
  }, [pathname])
  return null
}
