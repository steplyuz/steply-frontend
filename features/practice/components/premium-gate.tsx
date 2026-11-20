'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useApi } from '@/shared/api/use-api'
import { PREMIUM_UPGRADE_HREF } from '@/features/practice/lib/access'
import { FOCUS } from '@/shared/lib/brand'
import { ErrorBox, Loading } from '@/shared/ui/dashboard-kit'

type BillingLimits = { tier: string }

export function PremiumGate({ isPremium, children }: { isPremium: boolean; children: ReactNode }) {
  const limits = useApi<BillingLimits>(isPremium ? '/billing/me/limits' : null)

  if (!isPremium) return <>{children}</>
  if (limits.loading) return <Loading rows={1} />
  if (limits.error) return <ErrorBox message={limits.error.message} onRetry={limits.reload} />

  if (!limits.data || limits.data.tier === 'FREE') {
    return (
      <div className="mx-auto max-w-md space-y-5 rounded-3xl bg-white p-8 text-center ring-1 ring-[#0F3D26]/[0.07]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-foreground/[0.07]">
          <Lock aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Bu test Premium</h2>
        <p className="text-sm text-foreground/60">Testni boshlash uchun obunani faollashtiring.</p>
        <Link
          href={PREMIUM_UPGRADE_HREF}
          className={`inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-white ${FOCUS}`}
        >
          Obunani ochish
        </Link>
      </div>
    )
  }

  return <>{children}</>
}