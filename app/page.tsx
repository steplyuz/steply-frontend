"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/shared/providers/auth-context"
import { Uz } from "@/shared/providers/alphabet-provider"
import { LandingPage } from "@/features/marketing/components/landing-page"

export default function RootPage() {
  const { isLoading, isAuthenticated, homeUrl } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    router.replace(homeUrl)
  }, [isLoading, isAuthenticated, homeUrl, router])

  // Login qilingan foydalanuvchi o'z kabinetiga (dashboard/admin) yo'naltiriladi.
  // Login qilinmagan tashrif buyuruvchi esa marketing landing sahifasini ko'radi.
  if (isLoading || isAuthenticated) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center"
      >
        {/* Logotip: sidebar bilan bir xil (gradient nuqta + wordmark) */}
        <div className="flex items-center gap-2.5 text-4xl font-semibold tracking-tight text-foreground">
          <span
            aria-hidden="true"
            className="size-5 rounded-full bg-gradient-to-br from-brand-glow via-primary to-primary-strong shadow-sm shadow-primary-strong/20"
          />
          Steply
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary ring-1 ring-primary/10">
            <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
          </span>
          <p className="text-sm font-medium text-muted-foreground">
            {isAuthenticated ? (
              <Uz>Kabinetingizga yo‘naltirilmoqda…</Uz>
            ) : (
              <Uz>Yuklanmoqda…</Uz>
            )}
          </p>
        </div>
      </main>
    )
  }

  return <LandingPage />
}