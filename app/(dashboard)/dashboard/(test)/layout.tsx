"use client"

// Vaqt bilan ishlaydigan practice sahifalari: sidebar va topbar YO'Q — to'liq ekran.
// Faqat auth tekshiruvi va bitta ExamTopBar (sahifa ichida) bo'ladi.

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Toaster } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
        Yuklanmoqda...
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <Toaster richColors position="top-center" />
      <main id="main" className="mx-auto w-full px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
