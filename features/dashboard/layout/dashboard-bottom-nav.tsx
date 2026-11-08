'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { DASHBOARD_NAV as NAV, isExternalHref as isExternal, type NavItem as Item } from './dashboard-nav'

/* Yashil uslub: teksturali to'q yashil suzuvchi panel, faol bo'lim — och yashil (mint) "pill". */
const G_DARK = '#0F3D26'
const G_GLOW = '#9BE3BC'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/**
 * Pastki tab-bar nechta bo'lim ko'rsatadi (oxirgi tugma — "Menyu").
 * 360px ekranda 5 ta tugma sig'adi: 4 ta bo'lim + Menyu.
 */
const TAB_COUNT = 4

/**
 * Qaysi bo'limlar ko'rinishini o'zingiz tanlamoqchi bo'lsangiz, href'larni shu yerga yozing,
 * masalan: ['/dashboard', '/dashboard/reading', '/dashboard/listening', '/dashboard/billing'].
 * Bo'sh qoldirilsa — DASHBOARD_NAV dagi dastlabki ichki havolalar olinadi.
 */
const PINNED_HREFS: string[] = []

const allItems: Item[] = NAV.flatMap((g) => g.items).filter((i) => !isExternal(i.href))

const tabs: Item[] = (
  PINNED_HREFS.length
    ? PINNED_HREFS.map((h) => allItems.find((i) => i.href === h)).filter((i): i is Item => !!i)
    : allItems
).slice(0, TAB_COUNT)

/** Mobil (lg dan kichik) ekranlarda pastda suzib turuvchi navigatsiya. */
export function DashboardBottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname() || ''

  const isActive = ({ href, exact, also }: Item) =>
    exact ? pathname === href : [href, ...(also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`))

  const base = `group flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-semibold transition active:scale-95 motion-reduce:transition-none ${focusRing}`

  return (
    <nav
      aria-label="Tezkor menyu"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul
        className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-full p-1.5 shadow-2xl shadow-[#0F3D26]/35 ring-1 ring-white/10"
        style={{
          background: [
            'radial-gradient(70% 120% at 100% 0%, rgba(93,187,138,0.28), transparent 60%)',
            'radial-gradient(60% 120% at 0% 100%, rgba(31,122,77,0.45), transparent 60%)',
            '#0B2E1D',
          ].join(', '),
        }}
      >
        {tabs.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`${base} ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none"
                  style={active ? { backgroundColor: G_GLOW, color: G_DARK } : undefined}
                >
                  <item.icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}

        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Menyuni ochish"
            className={`${base} text-white/60 hover:text-white`}
          >
            <span aria-hidden="true" className="flex h-7 w-12 items-center justify-center rounded-full">
              <Menu className="size-[18px]" strokeWidth={1.75} />
            </span>
            <span>Menyu</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}