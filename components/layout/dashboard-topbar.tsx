'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { FOCUS, LIME } from '@/lib/brand'
import { CefrBadge, UserAvatar } from './user-badges'
import { PROFILE_ITEM, pageMeta } from './dashboard-nav'

interface Props {
  /** Berilmasa — joriy yo'ldan (dashboard-nav) olinadi */
  title?: string
  description?: string
  /** Endi ishlatilmaydi: topbar faqat desktopda ko'rinadi, mobil menyu pastki panelda. */
  onMenuClick?: () => void
}

// Sticky holati, fon va pastki chiziq shu komponentning o'zida (layout'da qo'shimcha o'ram yo'q).
export function DashboardTopbar({ title, description }: Props) {
  const pathname = usePathname() || ''
  const meta = pageMeta(pathname)
  title ??= meta.title
  description ??= meta.description
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const displayName = user?.profile?.full_name || user?.profile?.username || 'Foydalanuvchi'
  const avatarUrl = user?.profile?.avatar_url
  const cefr = user?.profile?.cefr_code
  const primaryContact =
    user?.contacts?.find((c) => c.is_primary)?.value ?? user?.contacts?.[0]?.value ?? ''

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } finally {
      setLoggingOut(false)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center gap-3 border-b bg-white/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/70 lg:flex">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-black leading-tight tracking-tight text-foreground sm:text-lg">{title}</h1>
        {description && <p className="hidden truncate text-xs text-foreground/55 sm:block">{description}</p>}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Foydalanuvchi menyusi"
          className={`flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white p-1 shadow-sm transition hover:bg-foreground/[0.03] active:scale-[0.98] md:pr-3 ${
            menuOpen ? 'bg-foreground/[0.04]' : ''
          } ${FOCUS}`}
        >
          <UserAvatar name={displayName} src={avatarUrl} className="size-8 ring-2" />
          <span className="hidden max-w-32 truncate text-sm font-semibold text-foreground md:block">{displayName}</span>
          <ChevronDown
            className={`hidden size-4 text-foreground/55 transition-transform motion-reduce:transition-none md:block ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl shadow-black/10"
          >
            {/* Sarlavha: dashboarddagi lime kartaga mos */}
            <div className="relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3" style={{ background: LIME }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full"
                style={{ border: '10px solid rgba(0,0,0,0.07)' }}
              />
              <div className="relative min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                {primaryContact && <p className="truncate text-xs font-medium text-foreground/65">{primaryContact}</p>}
              </div>
              <span className="relative rounded-full bg-white p-0.5">
                <CefrBadge code={cefr} />
              </span>
            </div>

            <div className="mt-1.5 space-y-0.5">
              <Link
                href={PROFILE_ITEM.href}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground ${FOCUS}`}
              >
                <User className="size-4" strokeWidth={1.75} /> Profil
              </Link>
              <button
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-60 ${FOCUS}`}
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" strokeWidth={1.75} />}
                Chiqish
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}