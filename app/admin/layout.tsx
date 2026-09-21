'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'

import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { useAuth } from '@/lib/auth/auth-context'

export const dynamic = 'force-dynamic'

// Admin panelning sarlavhalari uchun foydalanuvchi ilovasidagi Inter'dan
// ataylab boshqa, geometrik shrift — "boshqaruv markazi" hissini kuchaytiradi.
const adminDisplayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--admin-display-font',
})

const ALLOWED_ROLES = ['admin', 'speaking_evaluator']

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login?next=/admin')
      return
    }

    if (user && !ALLOWED_ROLES.includes(user.global_role)) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, user, router])

  const isAuthorized =
    isAuthenticated &&
    !!user &&
    ALLOWED_ROLES.includes(user.global_role)

  /*
   * Auth holati aniqlanayotgan paytda yoki redirect
   * qilinayotgan paytda admin UI'ni ko'rsatmaymiz.
   */
  if (isLoading || !isAuthorized) {
    return (
      <div className="admin-theme flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div
            aria-hidden
            className="mb-4 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_5px_rgba(79,70,229,0.18)]"
          />

          <p className="text-sm font-medium text-muted-foreground">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-theme ${adminDisplayFont.variable} min-h-svh bg-background text-foreground`}>
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main application shell */}
      <div className="min-h-svh lg:pl-[272px]">
        <div className="flex min-h-svh flex-col">
          {/* Top navigation */}
          <AdminTopbar
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/*
           * Page content — no extra max-width/padding wrapper here:
           * every admin page already sets its own width via
           * `.container-shell` (or, for the few full-bleed sections
           * like admin/mock and admin/applications headers, none at
           * all). Wrapping again in a 1600px box double-padded and
           * inset those "edge-to-edge" headers.
           */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}