'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CheckCircle2,
  Headphones,
  LayoutDashboard,
  Mic2,
  X,
  PenLine,
  Users,
  CreditCard,
  GraduationCap,
  ChartNoAxesCombined,
} from 'lucide-react'

import { useAuth } from '@/lib/auth/auth-context'

interface Props {
  open: boolean
  onClose: () => void
  basePath?: string
}

function isPathActive(
  pathname: string,
  href: string,
  exact = false,
) {
  if (exact) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function RoleSidebar({
  open,
  onClose,
  basePath = '/admin',
}: Props) {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = user?.global_role || ''

  // Nav configuration based on role
  interface NavSection {
    title: string
    items: { href: string; label: string; icon: React.ElementType }[]
  }

  const getNavSections = (): NavSection[] => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return [
          {
            title: 'Boshqaruv',
            items: [
              { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
              { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
              { href: '/admin/mock-exams', label: 'Mock imtihonlar', icon: GraduationCap },
              { href: '/admin/analysis', label: 'Analysis videolari', icon: ChartNoAxesCombined },
            ],
          },
          {
            title: 'Testlar bazasi',
            items: [
              { href: '/admin/reading', label: 'Reading', icon: BookOpen },
              { href: '/admin/listening', label: 'Listening', icon: Headphones },
              { href: '/admin/writing', label: 'Writing', icon: PenLine },
              { href: '/admin/writing/grading', label: 'Writing Baholash', icon: CheckCircle2 },
              { href: '/admin/speaking/questions', label: 'Speaking Savollar', icon: Mic2 },
              { href: '/admin/speaking/assessments', label: 'Speaking Baholash', icon: CheckCircle2 },
            ],
          },
          {
            title: 'Moliya',
            items: [
              { href: '/admin/billing', label: 'Obunalar (Billing)', icon: CreditCard },
            ],
          },
        ]
      case 'teacher':
        return [
          {
            title: 'Baholash',
            items: [
              { href: '/teacher-expert', label: 'Dashboard', icon: LayoutDashboard },
              { href: '/teacher-expert/writing', label: 'Writing Baholash', icon: PenLine },
              { href: '/teacher-expert/speaking', label: 'Speaking Baholash', icon: Mic2 },
              { href: '/teacher-expert/history', label: 'Bajarilganlar', icon: CheckCircle2 },
            ],
          },
        ]
      default:
        return []
    }
  }

  const navSections = getNavSections()

  return (
    <>
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]',
          'transition-opacity duration-300 lg:hidden',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col',
          'border-r border-border bg-muted',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5">
          <Link href={basePath} onClick={onClose} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-sm font-black text-background">
              S
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[-0.03em] text-foreground">Steply</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Control Center</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-6">
            {navSections.map((section) => (
              <section key={section.title}>
                <SectionLabel>{section.title}</SectionLabel>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isPathActive(pathname, item.href, item.href === basePath)}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

function NavItem({
  href, label, icon: Icon, active, onClick, nested = false, muted = false,
}: { href: string; label: string; icon: React.ElementType; active: boolean; onClick: () => void; nested?: boolean; muted?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex min-h-10 items-center gap-3 rounded-xl px-3',
        'text-[13px] font-medium transition-all duration-200',
        active
          ? 'bg-foreground text-background shadow-[0_8px_22px_rgba(21,21,21,0.10)]'
          : muted
            ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      ].join(' ')}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <span
        className={[
          'flex size-7 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-card/[0.08] text-primary' : 'text-muted-foreground group-hover:text-foreground',
        ].join(' ')}
      >
        <Icon className="size-[15px]" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  )
}