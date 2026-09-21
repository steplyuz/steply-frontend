'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Bell,
  ChevronRight,
  Loader2,
  LogOut,
  Menu,
  Search,
} from 'lucide-react'

import { useAuth } from '@/lib/auth/auth-context'

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Boshqaruv paneli',
  '/admin/mock': 'Sessiyalar',
  '/admin/reading': 'Reading',
  '/admin/listening': 'Listening',
  '/admin/writing': 'Writing',
  '/admin/omr': 'OMR',
  '/admin/check-in': 'Check-in',
  '/admin/finalize': 'Finalizatsiya',
  '/admin/speaking/questions': 'Speaking testlari',
  '/admin/speaking/assessments': 'Baholash',
  '/admin/applications': "Ro'yxatlar",
}

function getPageTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname]
  }

  if (pathname.startsWith('/admin/reading/')) {
    return 'Reading — Tahrirlash'
  }

  if (pathname.startsWith('/admin/listening/')) {
    return 'Listening — Tahrirlash'
  }

  if (pathname.startsWith('/admin/writing/')) {
    return 'Writing — Baholash'
  }

  if (pathname.startsWith('/admin/speaking/assessments/')) {
    return 'Baholash — Batafsil'
  }

  return 'Admin'
}

function getSection(pathname: string): string | null {
  if (pathname === '/admin') return null

  if (pathname.startsWith('/admin/speaking')) {
    return 'Speaking'
  }

  if (pathname.startsWith('/admin/reading')) {
    return 'Reading'
  }

  if (pathname.startsWith('/admin/listening')) {
    return 'Listening'
  }

  if (pathname.startsWith('/admin/writing')) {
    return 'Writing'
  }

  if (pathname.startsWith('/admin/mock')) {
    return 'Mock Center'
  }

  if (
    pathname.startsWith('/admin/omr') ||
    pathname.startsWith('/admin/check-in') ||
    pathname.startsWith('/admin/finalize') ||
    pathname.startsWith('/admin/applications')
  ) {
    return 'Imtihon jarayoni'
  }

  return null
}

interface Props {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } finally {
      setLoggingOut(false)
    }
  }

  const title = getPageTitle(pathname)
  const section = getSection(pathname)

  const displayName =
    user?.profile?.full_name ||
    user?.profile?.username ||
    user?.contacts?.find((c) => c.contact_type === 'email')?.value ||
    'Administrator'

  const avatarLetter = displayName
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 lg:px-6">
      <div className="mx-auto flex h-[60px] max-w-[1600px] items-center rounded-2xl border border-border bg-background/90 px-3 shadow-[0_8px_30px_rgba(21,21,21,0.04)] backdrop-blur-xl sm:px-4">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
          aria-label="Menyuni ochish"
        >
          <Menu className="size-[18px]" />
        </button>

        {/* Breadcrumb / page title */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/admin"
              className="hidden shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Admin
            </Link>

            {section && (
              <>
                <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />

                <span className="hidden shrink-0 text-xs font-medium text-muted-foreground md:block">
                  {section}
                </span>
              </>
            )}

            {section && (
              <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground md:block" />
            )}

            <h1 className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </h1>
          </div>

          {/* Small mobile context */}
          <div className="mt-0.5 flex items-center gap-1.5 sm:hidden">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Admin
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          {/* Search */}
          <button
            type="button"
            aria-label="Qidirish"
            className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <Search className="size-[17px] transition-transform duration-200 group-hover:scale-105" />
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Bildirishnomalar"
            className="group relative inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95"
          >
            <Bell className="size-[17px] transition-transform duration-200 group-hover:scale-105" />

            {/* Notification indicator */}
            <span
              aria-hidden
              className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-primary ring-2 ring-background"
            />
          </button>

          {/* Divider */}
          <div
            aria-hidden
            className="mx-1 hidden h-7 w-px bg-border sm:block"
          />

          {/* User */}
          <div className="ml-0.5 flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 sm:pr-2">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground text-[11px] font-bold text-primary shadow-sm"
              aria-hidden
            >
              {avatarLetter}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-[150px] truncate text-xs font-semibold leading-4 text-foreground">
                {displayName}
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {user?.global_role === 'speaking_evaluator'
                  ? 'Evaluator'
                  : 'Administrator'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Chiqish"
            title="Chiqish"
            className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="size-[17px] animate-spin" />
            ) : (
              <LogOut className="size-[17px] transition-transform duration-200 group-hover:scale-105" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}