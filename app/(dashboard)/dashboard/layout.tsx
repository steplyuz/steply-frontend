'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { useAuth } from '@/lib/auth/auth-context'

// useAuth faqat mijoz tomonida ishlaydi — shu bo'lim doim dinamik render qilinadi.
export const dynamic = 'force-dynamic'

export default function DashboardCabinetLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login?next=/dashboard')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <DashboardSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardTopbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
