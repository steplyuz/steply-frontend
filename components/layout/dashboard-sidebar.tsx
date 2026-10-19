'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Loader2, LogOut, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { FOCUS, LIME, TONES } from '@/lib/brand'
import { CefrBadge, UserAvatar } from './user-badges'
import { DASHBOARD_NAV as NAV, PROFILE_ITEM, isExternalHref as isExternal, type NavItem as Item } from './dashboard-nav'

// Esc bilan yopish va orqa fon scrollini qotirish layout'da bajariladi.
export function DashboardSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)

  const fullName = user?.profile?.full_name
  const avatarUrl = user?.profile?.avatar_url
  const cefr = user?.profile?.cefr_code

  // Mobilda menyu ochilganda fokus yopish tugmasiga o'tadi
  useEffect(() => {
    if (open && window.matchMedia('(max-width: 1023px)').matches) closeRef.current?.focus()
  }, [open])

  const isActive = ({ href, exact }: Item) =>
    !isExternal(href) && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`))

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

  const profileActive = pathname === PROFILE_ITEM.href

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity motion-reduce:transition-none lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-label="Asosiy menyu"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          // Chapga surib yopish
          if (touchX.current !== null && touchX.current - e.changedTouches[0].clientX > 60) onClose()
          touchX.current = null
        }}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r bg-white transition-[transform,visibility] duration-200 motion-reduce:transition-none max-lg:rounded-r-3xl max-lg:shadow-2xl lg:visible lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        {/* Logo: balandligi topbar bilan bir xil, chiziq davom etadi */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-md text-2xl font-black tracking-tighter text-foreground ${FOCUS}`}
          >
            Steply
            <span
              aria-hidden="true"
              className="mt-2 size-3 rounded-full ring-1 ring-black/10"
              style={{ background: LIME }}
            />
          </Link>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Menyuni yopish"
            className={`flex size-11 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground active:scale-95 lg:hidden ${FOCUS}`}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 pb-4 pt-5 [scrollbar-width:thin]">
          {NAV.map((group, i) => (
            <div key={group.title ?? i}>
              {group.title && (
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-foreground/45">{group.title}</p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item)
                  const external = isExternal(item.href)
                  const cls = `group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-1.5 text-sm transition-[background-color,transform] active:scale-[0.98] motion-reduce:transition-none lg:min-h-11 ${FOCUS} ${
                    active
                      ? 'font-bold text-foreground shadow-sm ring-1 ring-black/5'
                      : 'font-medium text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                  }`
                  const tone = item.tone ? TONES[item.tone] : null
                  const inner = (
                    <>
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none"
                        style={
                          tone
                            ? { backgroundColor: active ? tone : `${tone}1F`, color: active ? '#fff' : tone }
                            : active
                              ? { backgroundColor: 'var(--foreground, #111)', color: LIME }
                              : { backgroundColor: 'rgba(0,0,0,0.05)' }
                        }
                      >
                        <item.icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.9} />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {external && (
                        <ArrowUpRight className="ml-auto mr-1 size-3.5 shrink-0 opacity-50 transition group-hover:opacity-100" />
                      )}
                    </>
                  )
                  const style = active ? { backgroundColor: LIME } : undefined
                  return (
                    <li key={item.href}>
                      {external ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>
                          {inner}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? 'page' : undefined}
                          style={style}
                          className={cls}
                        >
                          {inner}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Profil kartasi — dashboarddagi "Limit sarfi" kartasi kabi to'q */}
          <Link
            href={PROFILE_ITEM.href}
            onClick={onClose}
            aria-current={profileActive ? 'page' : undefined}
            style={profileActive ? { boxShadow: `inset 0 0 0 2px ${LIME}` } : undefined}
            className={`relative flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl bg-foreground p-3 text-white transition hover:bg-foreground/90 active:scale-[0.98] motion-reduce:transition-none ${FOCUS}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 z-0 size-20 rounded-full"
              style={{ border: '12px solid rgba(228,247,10,0.22)' }}
            />
            <UserAvatar name={fullName} src={avatarUrl} className="relative z-10 size-10 ring-2 ring-white/20" />
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{fullName ?? 'Profil'}</span>
              <span className="block truncate text-xs text-white/60">Profilni ochish</span>
            </span>
            <span className="relative z-10 rounded-full bg-white p-0.5">
              <CefrBadge code={cefr} />
            </span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground active:scale-[0.98] disabled:opacity-60 lg:min-h-11 ${FOCUS}`}
          >
            {loggingOut ? <Loader2 className="size-[18px] animate-spin" /> : <LogOut className="size-[18px]" strokeWidth={1.75} />}
            Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}