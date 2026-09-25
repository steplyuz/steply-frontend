'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  Headphones,
  LayoutDashboard,
  Mic2,
  ScanLine,
  Users,
  X,
  PenLine,
  Settings2,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/lib/auth/auth-context'

interface Props {
  open: boolean
  onClose: () => void
}

const SKILL_ITEMS = [
  {
    href: '/admin/reading',
    label: 'Reading',
    icon: BookOpen,
  },
  {
    href: '/admin/listening',
    label: 'Listening',
    icon: Headphones,
  },
  {
    href: '/admin/writing',
    label: 'Writing',
    icon: PenLine,
  },
  {
    href: '/admin/speaking/questions',
    label: 'Speaking',
    icon: Mic2,
  },
]

const RESULT_ITEMS = [
  {
    href: '/admin/omr',
    label: 'OMR tekshirish',
    icon: ScanLine,
  },
  {
    href: '/admin/writing',
    label: 'Writing baholash',
    icon: FileText,
  },
  {
    href: '/admin/speaking/assessments',
    label: 'Speaking baholash',
    icon: Mic2,
  },
  {
    href: '/admin/finalize',
    label: 'Finalizatsiya',
    icon: FileCheck2,
  },
]

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

export function AdminSidebar({
  open,
  onClose,
}: Props) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isEvaluator =
    user?.global_role === 'speaking_evaluator'

  const [skillsOpen, setSkillsOpen] = useState(true)
  const [resultsOpen, setResultsOpen] = useState(true)

  const skillActive = SKILL_ITEMS.some((item) =>
    isPathActive(pathname, item.href),
  )

  const resultActive = RESULT_ITEMS.some((item) =>
    isPathActive(pathname, item.href),
  )

  return (
    <>
      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col',
          'border-r border-border bg-muted',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        {/* ─────────────────────
            HEADER
        ───────────────────── */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-sm font-black text-primary">
              S
            </div>

            <div>
              <div className="text-[15px] font-bold tracking-[-0.03em] text-foreground">
                Steply
              </div>

              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Control Center
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ─────────────────────
            USER
        ───────────────────── */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-xs font-bold text-primary">
                {(user?.profile?.full_name || user?.contacts?.find((c) => c.contact_type === 'email')?.value || 'A').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user?.profile?.full_name || user?.contacts?.find((c) => c.contact_type === 'email')?.value || 'Administrator'}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {isEvaluator
                      ? 'Speaking evaluator'
                      : 'Administrator'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────
            NAVIGATION
        ───────────────────── */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-7">

            {/* OVERVIEW */}
            <section>
              <SectionLabel>
                Umumiy
              </SectionLabel>

              <NavItem
                href={isEvaluator ? '/admin/speaking/assessments' : '/admin'}
                label={isEvaluator ? 'Baholash markazi' : 'Boshqaruv paneli'}
                icon={LayoutDashboard}
                active={isPathActive(
                  pathname,
                  isEvaluator ? '/admin/speaking/assessments' : '/admin',
                  true,
                )}
                onClick={onClose}
              />
            </section>

            {/* EXAMS */}
            {!isEvaluator && (
              <section>
                <SectionLabel>
                  Imtihonlar
                </SectionLabel>

                <div className="space-y-1">
                  <NavItem
                    href="/admin/mock"
                    label="Mock imtihonlar"
                    icon={ClipboardList}
                    active={isPathActive(
                      pathname,
                      '/admin/mock',
                    )}
                    onClick={onClose}
                  />

                  <NavItem
                    href="/admin/applications"
                    label="Ro'yxatlar"
                    icon={Users}
                    active={isPathActive(
                      pathname,
                      '/admin/applications',
                    )}
                    onClick={onClose}
                  />

                  <NavItem
                    href="/admin/check-in"
                    label="Check-in"
                    icon={CheckCircle2}
                    active={isPathActive(
                      pathname,
                      '/admin/check-in',
                    )}
                    onClick={onClose}
                  />

                  <NavItem
                    href="/admin/mock"
                    label="Sessiyalar"
                    icon={CalendarDays}
                    active={false}
                    onClick={onClose}
                    muted
                  />
                </div>
              </section>
            )}

            {/* SKILLS */}
            {!isEvaluator && (
              <section>
                <SectionButton
                  label="Testlar"
                  open={skillsOpen}
                  active={skillActive}
                  onClick={() =>
                    setSkillsOpen((value) => !value)
                  }
                />

                {skillsOpen && (
                  <div className="mt-1 space-y-1 border-l border-border pl-3">
                    {SKILL_ITEMS.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isPathActive(
                          pathname,
                          item.href,
                        )}
                        onClick={onClose}
                        nested
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* RESULTS — evaluator uchun bu bo'lim ko'rsatilmaydi, chunki
                yagona bandi ("Speaking baholash") allaqachon yuqoridagi
                "Umumiy > Baholash markazi" bilan bir xil sahifaga olib boradi. */}
            {!isEvaluator && (
              <section>
                <SectionButton
                  label="Natijalar"
                  open={resultsOpen}
                  active={resultActive}
                  onClick={() =>
                    setResultsOpen((value) => !value)
                  }
                />

                {resultsOpen && (
                  <div className="mt-1 space-y-1 border-l border-border pl-3">
                    {RESULT_ITEMS.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isPathActive(
                          pathname,
                          item.href,
                        )}
                        onClick={onClose}
                        nested
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SETTINGS / FUTURE */}
            {!isEvaluator && (
              <section>
                <SectionLabel>
                  Tizim
                </SectionLabel>

                <NavItem
                  href="/admin/users"
                  label="Foydalanuvchilar"
                  icon={Users}
                  active={isPathActive(
                    pathname,
                    '/admin/users',
                  )}
                  onClick={onClose}
                />
                
                <NavItem
                  href="/admin/billing"
                  label="Obunalar (Billing)"
                  icon={CreditCard}
                  active={isPathActive(
                    pathname,
                    '/admin/billing',
                  )}
                  onClick={onClose}
                />

                <NavItem
                  href="/dashboard"
                  label="Saytga qaytish"
                  icon={ChevronRight}
                  active={false}
                  onClick={onClose}
                  muted
                />
              </section>
            )}
          </div>
        </nav>

        {/* ─────────────────────
            BOTTOM STATUS
        ───────────────────── */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-foreground px-3 py-2.5">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-primary/40" />
              <span className="relative size-2 rounded-full bg-primary" />
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-background/60">
              System operational
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ─────────────────────────
   SECTION LABEL
───────────────────────── */

function SectionLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 px-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

/* ─────────────────────────
   COLLAPSIBLE SECTION
───────────────────────── */

function SectionButton({
  label,
  open,
  active,
  onClick,
}: {
  label: string
  open: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 px-2',
        'text-left transition-colors',
        active
          ? 'text-foreground'
          : 'text-muted-foreground',
      ].join(' ')}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.18em]">
        {label}
      </span>

      <span className="h-px flex-1 bg-border" />

      <ChevronDown
        className={[
          'size-3 transition-transform duration-200',
          open ? 'rotate-0' : '-rotate-90',
        ].join(' ')}
      />
    </button>
  )
}

/* ─────────────────────────
   NAV ITEM
───────────────────────── */

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  nested = false,
  muted = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick: () => void
  nested?: boolean
  muted?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex min-h-10 items-center gap-3 rounded-xl',
        nested ? 'px-3' : 'px-3',
        'text-[13px] font-medium',
        'transition-all duration-200',
        active
          ? 'bg-foreground text-background shadow-[0_8px_22px_rgba(21,21,21,0.10)]'
          : muted
            ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      ].join(' ')}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
        />
      )}

      <span
        className={[
          'flex size-7 shrink-0 items-center justify-center rounded-lg',
          active
            ? 'bg-card/[0.08] text-primary'
            : 'text-muted-foreground group-hover:text-foreground',
        ].join(' ')}
      >
        <Icon className="size-[15px]" strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1 truncate">
        {label}
      </span>

      {active && (
        <ChevronRight
          className="size-3.5 text-primary"
          strokeWidth={2}
        />
      )}
    </Link>
  )
}