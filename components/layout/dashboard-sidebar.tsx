'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutDashboard, LogOut, Mic2, UserRound, X, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Bosh sahifa', exact: true },
  { href: '/dashboard/mock', icon: CalendarDays, label: 'Mock imtihonlar' },
  { href: (process.env.NEXT_PUBLIC_SPEAKING_URL || '/speaking'), icon: Mic2, label: 'Speaking' },
  { href: '/dashboard/settings', icon: Settings, label: 'Sozlamalar' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function DashboardSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-card
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
        `}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/" className="font-semibold tracking-tight text-sm">
            Steply<span className="text-primary">.</span>{' '}
            <span className="font-normal text-muted-foreground">Kabinet</span>
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
            <UserRound className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.profile?.full_name ?? '—'}</p>
            <p className="truncate font-mono text-[11px] text-primary">{user?.profile?.cefr_code ?? ''}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}
