'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import OnboardingWizard from '@/components/onboarding/onboarding-wizard'
import { OnboardingStyles } from '@/components/onboarding/onboarding-animations'
import { Circle } from '@/components/ui/circle'

// Onboarding dashboard shell'idan tashqarida: sidebar yo'q, to'liq ekran wizard.
// Shell layout'dagi gate shu sahifaga yo'naltiradi, shuning uchun bu yerda gate yo'q.
export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?next=%2Fdashboard%2Fonboarding')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center bg-background px-4 py-6 sm:px-6 sm:py-12" aria-busy="true">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-5 lg:gap-6">
          <div className="h-56 animate-pulse rounded-3xl bg-foreground/10 motion-reduce:animate-none sm:h-64 sm:rounded-[32px] lg:col-span-2 lg:h-[30rem]" />
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/5 motion-reduce:animate-none sm:rounded-[32px] lg:col-span-3 lg:h-[30rem]" />
        </div>
      </div>
    )
  }

  return (
    <main className="relative flex min-h-screen items-start overflow-hidden bg-background px-4 py-6 pb-12 sm:px-6 sm:py-12 lg:items-center">
      <OnboardingStyles />

      {/* Bezak: orqa fondagi sekin suzuvchi halqalar */}
      <Circle color="rgba(200,255,0,0.35)" width={36} className="ob-drift -bottom-40 -left-32 size-[28rem]" />
      <Circle color="rgba(0,0,0,0.04)" width={28} className="ob-float -right-32 -top-32 size-[26rem]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <OnboardingWizard />
      </div>
    </main>
  )
}