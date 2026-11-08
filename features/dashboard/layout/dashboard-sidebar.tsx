'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, LogOut, X } from 'lucide-react'
import { useAuth } from '@/shared/providers/auth-context'
import { CefrBadge, UserAvatar } from './user-badges'
import { LanguageSwitch } from '@/shared/ui/language-switch'
import { DASHBOARD_NAV as NAV, PROFILE_ITEM, isExternalHref as isExternal, type NavItem as Item } from './dashboard-nav'

/* Yashil uslub: kartaga o‘xshash sidebar, faol bo‘limda chap chiziq, neytral ikonkalar,
   pastda teksturali to‘q yashil profil kartasi.
   Desktopda (lg+) tugma bilan yig‘iladi: faqat ikonkalar qoladi. Holat localStorage'da saqlanadi.
   Mobilda (drawer) har doim to‘liq ko‘rinadi. */
const G_DARK = '#0F3D26'
const G_MID = '#1F7A4D'
const G_GLOW = '#9BE3BC'

const STORAGE_KEY = 'steply:sidebar-collapsed'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

/* Profil avatari: rasm bo'lsa — UserAvatar, bo'lmasa yashil bosh harflar (lime emas) */
function ProfileAvatar({ name, src, className = '' }: { name?: string | null; src?: string | null; className?: string }) {
  if (src) return <UserAvatar name={name ?? undefined} src={src} className={className} />
  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || 'U'
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full text-sm font-semibold ${className}`}
      style={{ background: `linear-gradient(135deg, ${G_GLOW}, #5DBB8A)`, color: G_DARK }}
    >
      {initials}
    </span>
  )
}

// Esc bilan yopish va orqa fon scrollini qotirish layout'da bajariladi.
export function DashboardSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  // Birinchi yuklanishda saqlangan holat qo'llanganda kenglik animatsiyasi bo'lmasligi uchun
  const [animate, setAnimate] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)

  const fullName = user?.profile?.full_name
  const avatarUrl = user?.profile?.avatar_url
  const cefr = user?.profile?.cefr_code

  // Saqlangan holatni o'qish (hydration muammosi bo'lmasligi uchun effect ichida)
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true)
    } catch {
      /* localStorage mavjud emas — e'tiborsiz */
    }
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* e'tiborsiz */
      }
      return next
    })
  }

  // Mobilda menyu ochilganda fokus yopish tugmasiga o'tadi
  useEffect(() => {
    if (open && window.matchMedia('(max-width: 1023px)').matches) closeRef.current?.focus()
  }, [open])

  const isActive = ({ href, exact, also }: Item) =>
    !isExternal(href) && (exact ? pathname === href : [href, ...(also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`)))

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

  // Yig'ilgan holatda (faqat lg+) matn vizual yashiriladi, lekin ekran o'qigichlar uchun qoladi
  const labelCls = collapsed ? 'lg:sr-only' : ''

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#0B2E1D]/40 backdrop-blur-sm transition-opacity motion-reduce:transition-none lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
      />

      <aside
        id="dashboard-sidebar"
        aria-label="Asosiy menyu"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          // Chapga surib yopish
          if (touchX.current !== null && touchX.current - e.changedTouches[0].clientX > 60) onClose()
          touchX.current = null
        }}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-white duration-200 motion-reduce:transition-none max-lg:rounded-r-3xl max-lg:shadow-2xl lg:visible lg:sticky lg:top-3 lg:ml-3 lg:mt-3 lg:h-[calc(100dvh-1.5rem)] lg:shrink-0 lg:translate-x-0 lg:self-start lg:rounded-3xl lg:ring-1 lg:ring-[#0F3D26]/[0.06] ${animate ? 'transition-[transform,visibility,width]' : 'transition-[transform,visibility]'
          } ${collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'} ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        {/* Yig'ish / yoyish tugmasi — faqat desktop, sidebar qirrasida */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-controls="dashboard-sidebar"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Menyuni yoyish' : 'Menyuni yig‘ish'}
          title={collapsed ? 'Menyuni yoyish' : 'Menyuni yig‘ish'}
          className={`absolute -right-3.5 top-[1.375rem] z-10 hidden size-7 items-center justify-center rounded-full bg-white text-[#0F3D26] shadow-sm ring-1 ring-[#0F3D26]/15 transition hover:bg-[#E4F1E9] active:scale-90 motion-reduce:transition-none lg:flex ${focusRing}`}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="size-4" aria-hidden="true" />
          )}
        </button>

        {/* Logo */}
        <div
          className={`flex h-[4.5rem] shrink-0 items-center justify-between px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
        >
          <Link
            href="/"
            title="Steply"
            className={`inline-flex items-center gap-2 rounded-md text-2xl font-semibold tracking-tight text-[#0F2A1C] ${focusRing}`}
          >
            <span
              aria-hidden="true"
              className={`rounded-full ${collapsed ? 'size-3.5 lg:size-5' : 'size-3.5'}`}
              style={{ background: `linear-gradient(135deg, ${G_GLOW}, ${G_MID} 55%, ${G_DARK})` }}
            />
            <span className={labelCls}>Steply</span>
          </Link>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Menyuni yopish"
            className={`flex size-11 items-center justify-center rounded-full bg-[#E4F1E9] text-[#0F3D26] transition hover:bg-[#d6e9de] active:scale-95 lg:hidden ${focusRing}`}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 pb-4 pt-2 [scrollbar-width:thin]">
          {NAV.map((group, i) => (
            <div key={group.title ?? i}>
              {group.title && (
                <p
                  className={`mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0F2A1C]/45 ${collapsed ? 'lg:hidden' : ''
                    }`}
                >
                  {group.title}
                </p>
              )}
              {/* Yig'ilganda sarlavha o'rniga ingichka ajratgich */}
              {collapsed && i > 0 && (
                <div aria-hidden="true" className="mx-3 mb-3 hidden h-px bg-[#0F3D26]/10 lg:block" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item)
                  const external = isExternal(item.href)
                  const cls = `group relative flex min-h-12 items-center gap-3 rounded-xl px-3 py-1.5 text-sm transition-colors active:scale-[0.98] motion-reduce:transition-none lg:min-h-11 ${collapsed ? 'lg:justify-center lg:px-0' : ''
                    } ${focusRing} ${active
                      ? 'bg-[#E4F1E9]/70 font-semibold text-[#0F2A1C]'
                      : 'font-medium text-[#0F2A1C]/55 hover:bg-[#0F3D26]/[0.05] hover:text-[#0F2A1C]'
                    }`
                  const inner = (
                    <>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full"
                          style={{ background: G_DARK }}
                        />
                      )}
                      <item.icon
                        aria-hidden="true"
                        className={`size-5 shrink-0 transition-colors motion-reduce:transition-none ${active ? 'text-[#1F7A4D]' : 'text-[#0F2A1C]/45 group-hover:text-[#0F2A1C]/70'
                          }`}
                        strokeWidth={active ? 2 : 1.75}
                      />
                      <span className={`truncate ${labelCls}`}>{item.label}</span>
                      {external && (
                        <ArrowUpRight
                          aria-hidden="true"
                          className={`ml-auto size-3.5 shrink-0 opacity-50 transition group-hover:opacity-100 ${collapsed ? 'lg:hidden' : ''
                            }`}
                        />
                      )}
                    </>
                  )
                  const tip = collapsed ? item.label : undefined
                  return (
                    <li key={item.href}>
                      {external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          title={tip}
                          className={cls}
                        >
                          {inner}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          title={tip}
                          aria-current={active ? 'page' : undefined}
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

        <div className="shrink-0 space-y-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Til: topbar'da joy bo'lmagan (xl dan kichik) ekranlarda shu yerda */}
          <LanguageSwitch className={`flex w-full xl:hidden ${collapsed ? 'lg:hidden' : ''}`} />

          {/* Profil kartasi — teksturali to'q yashil */}
          <Link
            href={PROFILE_ITEM.href}
            onClick={onClose}
            title={collapsed ? (fullName ?? 'Profil') : undefined}
            aria-current={profileActive ? 'page' : undefined}
            style={{
              background: [
                'radial-gradient(90% 70% at 100% 0%, rgba(93,187,138,0.40), transparent 60%)',
                'radial-gradient(70% 60% at 0% 100%, rgba(31,122,77,0.55), transparent 60%)',
                'repeating-radial-gradient(circle at 120% -10%, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
                '#0B2E1D',
              ].join(', '),
              boxShadow: profileActive ? `inset 0 0 0 2px ${G_GLOW}` : undefined,
            }}
            className={`relative flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl p-3 text-white transition active:scale-[0.98] hover:brightness-110 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26] ${collapsed ? 'lg:min-h-0 lg:justify-center lg:p-1.5' : ''
              }`}
          >
            <ProfileAvatar name={fullName} src={avatarUrl} className="relative z-10 size-10 shrink-0 ring-2 ring-white/25" />
            <span className={`relative z-10 min-w-0 flex-1 ${labelCls}`}>
              <span className="block truncate text-sm font-semibold">{fullName ?? 'Profil'}</span>
              <span className="block truncate text-xs text-white/60">Profilni ochish</span>
            </span>
            <span className={`relative z-10 rounded-full bg-white p-0.5 ${collapsed ? 'lg:hidden' : ''}`}>
              <CefrBadge code={cefr} />
            </span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Chiqish' : undefined}
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#0F2A1C]/55 transition hover:bg-[#0F3D26]/[0.05] hover:text-[#0F2A1C] active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none lg:min-h-11 ${collapsed ? 'lg:justify-center lg:px-0' : ''
              } ${focusRing}`}
          >
            {loggingOut ? (
              <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-5 shrink-0 text-[#0F2A1C]/45" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className={labelCls}>Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  )
}