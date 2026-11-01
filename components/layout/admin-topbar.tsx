'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronRight,
  Loader2,
  LogOut,
  Menu,
} from 'lucide-react'

import { useAuth } from '@/lib/auth/auth-context'
import { getBreadcrumb, getNavSections } from './admin-nav'

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
interface Props {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
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

  const { section, title, detail } = getBreadcrumb(pathname, getNavSections(user?.global_role || ''))

  const displayName =
    user?.profile?.full_name ||
    user?.profile?.username ||
    user?.contacts?.find((c) => c.contact_type === 'email')?.value ||
    'Administrator'

  const avatarLetter = displayName.trim().charAt(0).toUpperCase()

  const isEvaluator = user?.global_role === 'teacher'

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 lg:px-6">
      <div className="mx-auto flex h-[60px] max-w-[1600px] items-center rounded-2xl border border-border bg-background px-3 sm:px-4">

        {/* ── Mobile menu ─────────────────────────────────── */}
        <button
          type="button"
          onClick={onMenuClick}
          className="mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
          aria-label="Menyuni ochish"
        >
          <Menu className="size-[18px]" />
        </button>

        {/* ── Breadcrumb ───────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={isEvaluator ? '/teacher-expert' : '/admin'}
              className="hidden shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {isEvaluator ? 'Baholash' : 'Admin'}
            </Link>

            {section && (
              <>
                <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
                <span className="hidden shrink-0 text-xs font-medium text-muted-foreground md:block">
                  {section}
                </span>
              </>
            )}

            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
            <h1
              className={[
                'truncate text-sm tracking-[-0.01em]',
                detail ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground',
              ].join(' ')}
            >
              {title}
            </h1>

            {detail && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">{detail}</span>
              </>
            )}
          </div>

          {/* Mobile context */}
          <div className="mt-0.5 flex items-center gap-1.5 sm:hidden">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Admin
            </span>
          </div>
        </div>

        {/* ── Right actions ────────────────────────────────── */}
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          {/* Divider */}
          <div aria-hidden className="mx-1 hidden h-7 w-px bg-border sm:block" />

          {/* User */}
          <div className="ml-0.5 flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 sm:pr-2">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground text-[11px] font-bold text-background"
              aria-hidden
            >
              {avatarLetter}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-[150px] truncate text-xs font-semibold leading-4 text-foreground">
                {displayName}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {isEvaluator ? 'Evaluator' : 'Administrator'}
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