'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'

import { RoleSidebar } from '@/components/layout/role-sidebar'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { useAuth } from '@/lib/auth/auth-context'

export const dynamic = 'force-dynamic'

const adminDisplayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--admin-display-font',
})

const ALLOWED_ROLES = ['admin', 'super_admin']

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

  const isAuthorized = isAuthenticated && !!user && ALLOWED_ROLES.includes(user.global_role)

  if (isLoading || !isAuthorized) {
    return (
      <div className="admin-theme flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div aria-hidden className="mb-4 h-2 w-2 rounded-full bg-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-theme ${adminDisplayFont.variable} min-h-svh bg-background text-foreground`}>
      <RoleSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} basePath="/admin" />
      <div className="min-h-svh lg:pl-[272px]">
        <div className="flex min-h-svh flex-col">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}