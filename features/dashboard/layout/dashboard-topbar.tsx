'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '@/shared/providers/auth-context'
import { LanguageSwitch } from '@/shared/ui/language-switch'
import { CefrBadge, UserAvatar } from './user-badges'
import { PROFILE_ITEM, pageMeta } from './dashboard-nav'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

interface Props {
  /** Berilmasa — joriy yo'ldan (dashboard-nav) olinadi */
  title?: string
  description?: string
  /** Endi ishlatilmaydi: topbar faqat desktopda ko'rinadi, mobil menyu pastki panelda. */
  onMenuClick?: () => void
}

// Sticky holati, fon va ko'rinish shu komponentning o'zida (layout'da qo'shimcha o'ram yo'q).
// Sidebar kabi yumaloq "suzuvchi" karta: lg:mx-3 lg:mt-3, sticky top-3.
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
    <header className="sticky top-3 z-30 mx-3 mt-3 hidden h-16 items-center gap-3 rounded-3xl bg-white/85 px-6 ring-1 ring-[#0F3D26]/[0.06] backdrop-blur supports-[backdrop-filter]:bg-white/75 lg:flex">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-tight tracking-tight text-[#0F2A1C]">{title}</h1>
        {description && <p className="hidden truncate text-xs text-[#0F2A1C]/55 sm:block">{description}</p>}
      </div>

      <LanguageSwitch className="hidden xl:flex" />

      <div className="relative" ref={menuRef}>
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Foydalanuvchi menyusi"
          className={`flex h-11 items-center gap-2 rounded-full bg-white p-1 ring-1 ring-[#0F3D26]/15 transition hover:bg-[#E4F1E9]/70 active:scale-[0.98] motion-reduce:transition-none md:pr-3 ${menuOpen ? 'bg-[#E4F1E9]/70' : ''
            } ${focusRing}`}
        >
          <UserAvatar name={displayName} src={avatarUrl} className="size-8 ring-2 ring-[#E4F1E9]" />
          <span className="hidden max-w-32 truncate text-sm font-semibold text-[#0F2A1C] md:block">{displayName}</span>
          <ChevronDown
            className={`hidden size-4 text-[#0F2A1C]/50 transition-transform motion-reduce:transition-none md:block ${menuOpen ? 'rotate-180' : ''
              }`}
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl shadow-[#0F3D26]/15 ring-1 ring-[#0F3D26]/10"
          >
            {/* Sarlavha: teksturali to'q yashil (sidebar profil kartasi bilan bir xil) */}
            <div
              className="relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-white"
              style={{
                background: [
                  'radial-gradient(90% 70% at 100% 0%, rgba(93,187,138,0.40), transparent 60%)',
                  'radial-gradient(70% 60% at 0% 100%, rgba(31,122,77,0.55), transparent 60%)',
                  'repeating-radial-gradient(circle at 120% -10%, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
                  '#0B2E1D',
                ].join(', '),
              }}
            >
              <div className="relative min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {primaryContact && <p className="truncate text-xs text-white/65">{primaryContact}</p>}
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
                className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#0F2A1C]/80 transition-colors hover:bg-[#E4F1E9]/70 hover:text-[#0F2A1C] ${focusRing}`}
              >
                <User className="size-4 text-[#1F7A4D]" strokeWidth={1.75} aria-hidden="true" /> Profil
              </Link>
              <button
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-60 ${focusRing}`}
              >
                {loggingOut ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
                )}
                Chiqish
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}