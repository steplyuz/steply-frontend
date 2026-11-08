'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/features/dashboard/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/features/dashboard/layout/dashboard-topbar'
import { DashboardBottomNav } from '@/features/dashboard/layout/dashboard-bottom-nav'
import { useAuth } from '@/shared/providers/auth-context'
import { onboardingApi } from '@/shared/api'

/* Kabinet foni: yashilga moyil och kulrang. Sahifalardagi oq kartalar shu fonda ko‘rinadi,
   shuning uchun sahifalar o‘z ichida alohida fon panel yasashi shart emas. */
const SHELL_BG = 'bg-[#F1F5F2]'
const BONE = 'bg-[#0F3D26]/[0.07]'

function DashboardSkeleton() {
  return (
    <div className={`min-h-dvh ${SHELL_BG} lg:flex`} aria-busy="true" aria-label="Yuklanmoqda">
      <aside className="hidden w-64 shrink-0 border-r border-[#0F3D26]/10 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-[#0F3D26]/10 px-5">
          <div className={`h-6 w-24 animate-pulse rounded-md motion-reduce:animate-none ${BONE}`} />
        </div>
        <div className="space-y-2 p-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-11 animate-pulse rounded-2xl motion-reduce:animate-none ${BONE}`} />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="hidden h-16 border-b border-[#0F3D26]/10 bg-white lg:block" />
        <div className="w-full space-y-4 p-4 sm:p-6 lg:px-3 lg:pb-8 lg:pt-4">
          {/* Sarlavha */}
          <div className="space-y-2 px-1">
            <div className={`h-9 w-56 animate-pulse rounded-lg motion-reduce:animate-none ${BONE}`} />
            <div className={`h-4 w-72 max-w-full animate-pulse rounded-md motion-reduce:animate-none ${BONE}`} />
          </div>
          {/* Statistika kartalari */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-36 animate-pulse rounded-3xl motion-reduce:animate-none sm:h-40 ${BONE}`} />
            ))}
          </div>
          {/* Mashq bo'limlari */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-52 animate-pulse rounded-3xl motion-reduce:animate-none sm:h-60 ${BONE}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobil pastki panel o'rni */}
      <div
        aria-hidden="true"
        className="fixed inset-x-3 bottom-3 h-[4.25rem] animate-pulse rounded-full bg-[#0F3D26]/15 motion-reduce:animate-none lg:hidden"
      />
    </div>
  )
}

export default function DashboardCabinetLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user, isLoading, isAuthenticated } = useAuth()
  // Talaba onboardingni tugatmaguncha kabinetga kiritilmaydi
  const [onboardingReady, setOnboardingReady] = useState(false)
  const isStudent = user?.global_role === 'student'
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

  // Onboarding gate: faqat talabalar uchun. Xatolikda kabinet ochiladi (fail open).
  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    if (!isStudent) {
      setOnboardingReady(true)
      return
    }
    let cancelled = false
    onboardingApi
      .get()
      .then((state) => {
        if (cancelled) return
        if (state.is_complete) setOnboardingReady(true)
        else router.replace('/dashboard/onboarding')
      })
      .catch(() => {
        if (!cancelled) setOnboardingReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isLoading, isAuthenticated, isStudent, router])

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
  if (isLoading || !isAuthenticated || !onboardingReady) return <DashboardSkeleton />

  return (
    <div className={`min-h-dvh ${SHELL_BG} lg:flex`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#0F3D26] focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Asosiy qismga o‘tish
      </a>
      <DashboardSidebar open={open} onClose={close} />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        {/* Topbar faqat desktopda (lg+) ko'rinadi; mobilda navigatsiya pastki panelda */}
        <DashboardTopbar />
        <main id="main" className="flex-1 focus:outline-none" tabIndex={-1}>
          {/* Mobilda pastki panel (taxminan 4.25rem + chetlari) kontentni yopmasligi uchun katta pastki padding.
              sm:p-6 hamma tomonni qayta yozgani uchun sm:pb ham alohida beriladi.
              Topbar yo'q, shuning uchun mobilda tepada safe-area (notch) hisobga olinadi. */}
          <div className="w-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-3 lg:pb-8 lg:pt-4">
            {children}
          </div>
        </main>
      </div>
      <DashboardBottomNav onMenuClick={openMenu} />
    </div>
  )
}