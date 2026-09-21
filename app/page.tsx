"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { LandingPage } from "@/components/marketing/landing-page"

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
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-svh flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
      >
        <img src="/logo-full.png" alt="Steply" className="h-10 w-auto object-contain" />
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Yuklanmoqda...
        </span>
      </div>
    )
  }

  return <LandingPage />
}