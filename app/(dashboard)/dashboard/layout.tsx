'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { useAuth } from '@/lib/auth/auth-context'

export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:flex" aria-busy="true">
      <aside className="hidden w-64 shrink-0 border-r bg-card p-4 lg:block">
        <div className="mb-6 h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </aside>
      <div className="flex-1">
        <div className="h-16 border-b bg-card" />
        <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 lg:p-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardCabinetLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login?next=/dashboard')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      <DashboardSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DashboardTopbar onMenuClick={() => setOpen(true)} />
        </div>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}