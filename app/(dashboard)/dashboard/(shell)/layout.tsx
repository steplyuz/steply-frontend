'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { DashboardBottomNav } from '@/components/layout/dashboard-bottom-nav'
import { useAuth } from '@/lib/auth/auth-context'

const BONE = 'bg-foreground/[0.06]'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:flex" aria-busy="true" aria-label="Yuklanmoqda">
      <aside className="hidden w-64 shrink-0 border-r bg-white lg:block">
        <div className="flex h-16 items-center border-b px-5">
          <div className={`h-6 w-24 animate-pulse rounded-md ${BONE}`} />
        </div>
        <div className="space-y-2 p-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-11 animate-pulse rounded-2xl ${BONE}`} />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="hidden h-16 border-b bg-white lg:block" />
        <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 lg:p-8">
          <div className={`h-8 w-48 animate-pulse rounded-md ${BONE}`} />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-24 animate-pulse rounded-3xl ${BONE}`} />
            ))}
          </div>
          <div className={`h-44 animate-pulse rounded-3xl ${BONE}`} />
        </div>
      </div>
      {/* Mobil pastki panel o'rni */}
      <div
        aria-hidden="true"
        className="fixed inset-x-3 bottom-3 h-[4.25rem] animate-pulse rounded-full bg-foreground/15 lg:hidden"
      />
    </div>
  )
}

export default function DashboardCabinetLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const close = useCallback(() => setOpen(false), [])
  const openMenu = useCallback(() => setOpen(true), [])

  // Login'ga yo'naltirganda joriy sahifani eslab qolamiz
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/dashboard')}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  // Sahifa almashganda mobil menyu yopiladi
  useEffect(() => {
    close()
  }, [pathname, close])

  // Menyu ochiq: Escape bilan yopish va orqa fon scrollini qotirish
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  // Desktop'ga o'tganda (rotatsiya, oynani kattalashtirish) ochiq qolgan menyuni tozalaymiz
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && close()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [close])

  // Test tanlash sahifalari ham odatiy kabinet navigatsiyasidan foydalanadi.
  // Faqat real imtihon route'lari (dashboard/(test)) alohida exam layoutiga o'tadi.
  if (isLoading || !isAuthenticated) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-background lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Asosiy qismga o‘tish
      </a>
      <DashboardSidebar open={open} onClose={close} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Topbar faqat desktopda (lg+) ko'rinadi; mobilda navigatsiya pastki panelda */}
        <DashboardTopbar />
        <main id="main" className="flex-1 focus:outline-none" tabIndex={-1}>
          {/* Mobilda pastki panel (taxminan 4.25rem + chetlari) kontentni yopmasligi uchun katta pastki padding.
              sm:p-6 hamma tomonni qayta yozgani uchun sm:pb ham alohida beriladi.
              Topbar yo'q, shuning uchun mobilda tepada safe-area (notch) hisobga olinadi. */}
          <div className="mx-auto w-full max-w-[1440px] p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8 xl:px-10">
            {children}
          </div>
        </main>
      </div>
      <DashboardBottomNav onMenuClick={openMenu} />
    </div>
  )
}