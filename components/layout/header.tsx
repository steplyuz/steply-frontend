'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react'

import { useAuth } from '@/lib/auth/auth-context'

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */

type SiteHeaderVariant = 'public' | 'dashboard'

type NavLink = {
  href: string
  label: string
  badge?: string
  external?: boolean
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Design tokens
 * ──────────────────────────────────────────────────────────────────────────── */

// Keep in sync with `.container-shell` in app/globals.css
const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/*
 * Steply brand tokens (see app/globals.css)
 *
 * Primary lime: var(--primary)   #E4F70A
 * Dark text:    var(--foreground) #0A0A0C
 * Soft bg:      var(--muted)      #F4F5F0
 */

/* ─────────────────────────────────────────────────────────────────────────────
 * Navigation data
 * ──────────────────────────────────────────────────────────────────────────── */

const PUBLIC_LINKS: NavLink[] = [
  {
    href: '/mock',
    label: 'Mock imtihonlar',
  },
  {
    href: process.env.NEXT_PUBLIC_SPEAKING_URL || '/speaking',
    label: 'Speaking',
    badge: 'AI',
    external: Boolean(process.env.NEXT_PUBLIC_SPEAKING_URL),
  },
  {
    href: '/result',
    label: 'Natijalar',
  },
]

const DASHBOARD_LINKS: NavLink[] = [
  {
    href: '/mock',
    label: 'Mock imtihonlar',
  },
  {
    href: '/dashboard',
    label: 'Kabinet',
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
 * Scroll hook
 * ──────────────────────────────────────────────────────────────────────────── */

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold)
    }

    onScroll()

    window.addEventListener('scroll', onScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])

  return scrolled
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Logo (PNG only). File: public/logo-full.png
 * ──────────────────────────────────────────────────────────────────────────── */

function Logo({ scrolled }: { scrolled: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Steply bosh sahifa"
      className={[
        'group inline-flex min-w-0 shrink-0 items-center rounded-xl',
        FOCUS_RING,
      ].join(' ')}
    >
      <img
        src="/logo-full.png"
        alt="Steply"
        className={[
          'w-auto shrink-0 object-contain',
          'transition-all duration-300 group-hover:scale-[1.03]',
          scrolled ? 'h-10 sm:h-11' : 'h-11 sm:h-12',
        ].join(' ')}
      />
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Active link helper
 * ──────────────────────────────────────────────────────────────────────────── */

function isLinkActive(pathname: string, href: string) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return false
  }

  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Navigation item
 * ──────────────────────────────────────────────────────────────────────────── */

function NavBadge({ children }: { children: string }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        'rounded-full',
        'bg-foreground',
        'px-2 py-0.5',
        'text-[9px] font-bold',
        'uppercase tracking-wider',
        'text-background',
        'shadow-sm',
      ].join(' ')}
    >
      <Sparkles aria-hidden="true" className="size-2.5 text-primary" />
      {children}
    </span>
  )
}

function NavItem({
  link,
  pathname,
  mobile = false,
  highlighted = false,
  indicatorIsActive = false,
  reduceMotion = false,
  onClick,
  onHover,
}: {
  link: NavLink
  pathname: string
  mobile?: boolean
  /** Desktop: the sliding indicator currently sits on this item */
  highlighted?: boolean
  /** Desktop: the indicator is showing the active route (vs. a hover preview) */
  indicatorIsActive?: boolean
  reduceMotion?: boolean
  onClick?: () => void
  onHover?: (href: string | null) => void
}) {
  const active = isLinkActive(pathname, link.href)

  /* Mobile */

  if (mobile) {
    const mobileClass = [
      'group flex min-h-12 w-full items-center',
      'justify-between',
      'rounded-xl px-4 py-3',
      'text-sm font-medium',
      'transition-all duration-200',
      FOCUS_RING,
      active
        ? 'bg-primary/20 font-semibold text-foreground'
        : 'text-muted-foreground hover:bg-black/[0.035] hover:text-foreground',
    ].join(' ')

    const mobileContent = (
      <>
        <span className="flex items-center gap-1.5">
          {link.label}
          {link.badge && <NavBadge>{link.badge}</NavBadge>}
        </span>

        <ChevronRight
          aria-hidden="true"
          className={[
            'size-4 transition-all duration-200',
            active
              ? 'text-primary-strong'
              : 'text-muted-foreground group-hover:translate-x-0.5',
          ].join(' ')}
        />
      </>
    )

    return link.external ? (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={mobileClass}
      >
        {mobileContent}
      </a>
    ) : (
      <Link
        href={link.href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={mobileClass}
      >
        {mobileContent}
      </Link>
    )
  }

  /* Desktop: label sits above a shared sliding indicator */

  const desktopClass = [
    'relative flex items-center gap-1.5',
    'rounded-full',
    'px-4 py-2',
    'text-[13px] font-medium',
    'lg:text-sm',
    'transition-colors duration-200',
    FOCUS_RING,
    highlighted || active ? 'text-foreground' : 'text-muted-foreground',
  ].join(' ')

  const desktopContent = (
    <>
      {highlighted && (
        <motion.span
          layoutId="header-nav-indicator"
          aria-hidden="true"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 420, damping: 34 }
          }
          className={[
            'absolute inset-0 rounded-full',
            indicatorIsActive
              ? 'bg-primary/80 shadow-[0_3px_12px_rgba(228,247,10,0.2)]'
              : 'bg-card shadow-sm ring-1 ring-black/[0.06]',
          ].join(' ')}
        />
      )}

      <span className="relative z-10 flex items-center gap-1.5">
        {link.label}
        {link.badge && <NavBadge>{link.badge}</NavBadge>}
      </span>
    </>
  )

  const hoverProps = {
    onMouseEnter: () => onHover?.(link.href),
    onFocus: () => onHover?.(link.href),
  }

  return link.external ? (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={desktopClass}
      {...hoverProps}
    >
      {desktopContent}
    </a>
  ) : (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={desktopClass}
      {...hoverProps}
    >
      {desktopContent}
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Desktop navigation (centered pill with sliding indicator)
 * ──────────────────────────────────────────────────────────────────────────── */

function DesktopNavigation({
  links,
  pathname,
}: {
  links: NavLink[]
  pathname: string
}) {
  const reduceMotion = useReducedMotion() ?? false
  const [hovered, setHovered] = useState<string | null>(null)

  const activeHref =
    links.find((link) => isLinkActive(pathname, link.href))?.href ?? null

  const target = hovered ?? activeHref

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      onMouseLeave={() => setHovered(null)}
      onBlur={() => setHovered(null)}
      className={[
        'hidden items-center gap-0.5',
        'rounded-full',
        'border border-black/[0.06]',
        'bg-card/55',
        'p-1',
        'shadow-sm backdrop-blur-md',
        'lg:flex',
      ].join(' ')}
    >
      {links.map((link) => (
        <NavItem
          key={link.href}
          link={link}
          pathname={pathname}
          highlighted={target === link.href}
          indicatorIsActive={target === activeHref}
          reduceMotion={reduceMotion}
          onHover={setHovered}
        />
      ))}
    </nav>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Auth skeleton
 * ──────────────────────────────────────────────────────────────────────────── */

function AuthSkeleton({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-11 animate-pulse rounded-xl bg-black/[0.05]" />
        <div className="h-11 animate-pulse rounded-xl bg-black/[0.05]" />
      </div>
    )
  }

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="h-10 w-16 animate-pulse rounded-full bg-black/[0.05]" />
      <div className="h-10 w-32 animate-pulse rounded-full bg-black/[0.05]" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Auth actions
 * ──────────────────────────────────────────────────────────────────────────── */

function AuthActions({
  variant,
  isAuthenticated,
  isLoading,
  isLoggingOut,
  user,
  onLogout,
  mobile = false,
}: {
  variant: SiteHeaderVariant
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  user: any
  onLogout: () => void
  mobile?: boolean
}) {
  /* Loading */

  if (isLoading && variant !== 'dashboard') {
    return <AuthSkeleton mobile={mobile} />
  }

  /* Mobile */

  if (mobile) {
    /* Dashboard logout */

    if (variant === 'dashboard') {
      return (
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className={[
            'flex min-h-11 w-full',
            'items-center justify-center gap-2',
            'rounded-xl',
            'border border-red-200',
            'bg-red-50',
            'px-4 py-2.5',
            'text-sm font-semibold',
            'text-red-600',
            'transition-all duration-200',
            'hover:bg-red-100',
            'disabled:opacity-60',
            FOCUS_RING,
          ].join(' ')}
        >
          {isLoggingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut aria-hidden="true" className="size-4" />
          )}

          Chiqish
        </button>
      )
    }

    /* Authenticated */

    if (isAuthenticated) {
      return (
        <Link
          href="/dashboard"
          className={[
            'flex min-h-11 w-full',
            'items-center justify-center gap-2',
            'rounded-xl',
            'bg-primary',
            'px-4 py-2.5',
            'text-sm font-bold',
            'text-foreground',
            'shadow-[0_5px_18px_rgba(228,247,10,0.22)]',
            'transition-all duration-200',
            'hover:-translate-y-0.5',
            'hover:shadow-[0_8px_24px_rgba(228,247,10,0.34)]',
            FOCUS_RING,
          ].join(' ')}
        >
          <UserIcon aria-hidden="true" className="size-4" />
          Kabinetga o'tish
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )
    }

    /* Guest */

    return (
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/login"
          className={[
            'flex min-h-11',
            'items-center justify-center',
            'rounded-xl',
            'border border-black/10',
            'bg-card/70',
            'px-4 py-2.5',
            'text-sm font-semibold',
            'text-[#222]',
            'transition-all duration-200',
            'hover:bg-card',
            FOCUS_RING,
          ].join(' ')}
        >
          Kirish
        </Link>

        <Link
          href="/register"
          className={[
            'flex min-h-11',
            'items-center justify-center',
            'rounded-xl',
            'bg-primary',
            'px-4 py-2.5',
            'text-sm font-bold',
            'text-foreground',
            'shadow-[0_5px_18px_rgba(228,247,10,0.22)]',
            'transition-all duration-200',
            'hover:-translate-y-0.5',
            FOCUS_RING,
          ].join(' ')}
        >
          Ro'yxatdan o'tish
        </Link>
      </div>
    )
  }

  /* Desktop dashboard */

  if (variant === 'dashboard') {
    return (
      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className={[
          'hidden min-h-10',
          'items-center gap-2',
          'rounded-full',
          'border border-black/10',
          'bg-card/65',
          'px-4 py-2',
          'text-sm font-semibold',
          'text-muted-foreground',
          'shadow-sm',
          'backdrop-blur-md',
          'transition-all duration-200',
          'hover:border-red-200',
          'hover:bg-red-50',
          'hover:text-red-600',
          'disabled:opacity-60',
          'lg:flex',
          FOCUS_RING,
        ].join(' ')}
      >
        {isLoggingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut aria-hidden="true" className="size-4" />
        )}

        Chiqish
      </button>
    )
  }

  /* Desktop authenticated */

  if (isAuthenticated) {
    const fullName = user?.profile?.full_name?.trim()
    const firstName = fullName?.split(/\s+/)[0] || 'Kabinet'
    const initial = firstName.charAt(0).toUpperCase()

    return (
      <Link
        href="/dashboard"
        className={[
          'group hidden min-h-10',
          'items-center gap-2.5',
          'rounded-full',
          'border border-black/10',
          'bg-card/65',
          'py-1.5 pl-1.5 pr-3.5',
          'text-sm font-medium',
          'text-[#222]',
          'shadow-sm',
          'backdrop-blur-md',
          'transition-all duration-200',
          'hover:border-primary/60',
          'hover:bg-card',
          'hover:shadow-md',
          'active:scale-[0.98]',
          'lg:flex',
          FOCUS_RING,
        ].join(' ')}
      >
        <span
          className={[
            'flex size-7 items-center justify-center',
            'rounded-full',
            'bg-primary',
            'text-xs font-bold',
            'text-foreground',
          ].join(' ')}
        >
          {initial || <UserIcon className="size-3.5" />}
        </span>

        <span className="max-w-28 truncate font-semibold">{firstName}</span>

        <ArrowRight
          aria-hidden="true"
          className={[
            'size-4',
            'text-muted-foreground',
            'transition-all duration-200',
            'group-hover:translate-x-0.5',
            'group-hover:text-foreground',
          ].join(' ')}
        />
      </Link>
    )
  }

  /* Desktop guest */

  return (
    <div className="hidden items-center gap-1.5 lg:flex">
      <Link
        href="/login"
        className={[
          'flex min-h-10 items-center',
          'rounded-full',
          'px-4 py-2',
          'text-sm font-semibold',
          'text-muted-foreground',
          'transition-all duration-200',
          'hover:bg-card/70',
          'hover:text-foreground',
          FOCUS_RING,
        ].join(' ')}
      >
        Kirish
      </Link>

      <Link
        href="/register"
        className={[
          'group flex min-h-10',
          'items-center gap-1.5',
          'rounded-full',
          'bg-primary',
          'px-4 py-2',
          'text-sm font-bold',
          'text-foreground',
          'shadow-[0_5px_18px_rgba(228,247,10,0.22)]',
          'transition-all duration-200',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_8px_25px_rgba(228,247,10,0.34)]',
          'active:scale-[0.98]',
          FOCUS_RING,
        ].join(' ')}
      >
        Ro'yxatdan o'tish

        <ArrowRight
          aria-hidden="true"
          className={[
            'size-4',
            'transition-transform duration-200',
            'group-hover:translate-x-0.5',
          ].join(' ')}
        />
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Mobile menu (animated)
 * ──────────────────────────────────────────────────────────────────────────── */

function MobileMenu({
  open,
  menuId,
  links,
  pathname,
  variant,
  isAuthenticated,
  isLoading,
  isLoggingOut,
  user,
  onClose,
  onLogout,
}: {
  open: boolean
  menuId: string
  links: NavLink[]
  pathname: string
  variant: SiteHeaderVariant
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  user: any
  onClose: () => void
  onLogout: () => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={menuId}
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'absolute left-0 right-0 top-full',
            'max-h-[calc(100svh-6rem)] overflow-y-auto',
            'rounded-b-2xl',
            'border-t border-black/[0.05]',
            'bg-muted/95',
            'p-3',
            'shadow-[0_20px_50px_rgba(0,0,0,0.10)]',
            'backdrop-blur-2xl',
            'lg:hidden',
          ].join(' ')}
        >
          <nav
            aria-label="Mobil navigatsiya"
            className={[
              'flex flex-col gap-1',
              'rounded-2xl',
              'border border-black/[0.08]',
              'bg-card/80',
              'p-2',
              'shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
              'backdrop-blur-xl',
            ].join(' ')}
          >
            {links.map((link) => (
              <NavItem
                key={link.href}
                link={link}
                pathname={pathname}
                mobile
                onClick={onClose}
              />
            ))}

            <div className="my-1.5 border-t border-black/[0.07]" />

            <div className="p-1">
              <AuthActions
                variant={variant}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                isLoggingOut={isLoggingOut}
                user={user}
                onLogout={onLogout}
                mobile
              />
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main header
 * ──────────────────────────────────────────────────────────────────────────── */

export function SiteHeader({
  variant = 'public',
}: {
  variant?: SiteHeaderVariant
}) {
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const pathname = usePathname()
  const router = useRouter()

  const menuId = useId()
  const scrolled = useScrolled(24)

  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const links = variant === 'dashboard' ? DASHBOARD_LINKS : PUBLIC_LINKS

  /* Close mobile menu after route change */

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* Mobile scroll lock + Escape + close when resized to desktop */

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow

    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  /* Logout */

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    try {
      setIsLoggingOut(true)
      setOpen(false)

      await logout()

      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {/*
       * Backdrop lives outside <header>: backdrop-blur on the header would
       * turn it into the containing block for `fixed` children.
       */}
      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <header
        className={[
          'fixed left-1/2 top-0 z-50 -translate-x-1/2',
          'transition-all duration-300 ease-out',

          scrolled
            ? [
              'top-3 w-[calc(100%-1.5rem)] max-w-7xl',
              'rounded-2xl',
              'border border-black/[0.08]',
              'bg-muted/95',
              'shadow-[0_10px_40px_rgba(0,0,0,0.11)]',
              'backdrop-blur-2xl',
            ].join(' ')
            : 'w-full border-transparent bg-transparent',
        ].join(' ')}
      >
        {scrolled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
          >
            <div className="absolute -left-24 -top-24 size-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-24 -top-24 size-52 rounded-full bg-primary/[0.06] blur-3xl" />
          </div>
        )}

        <div
          className={
            scrolled ? 'mx-auto w-full px-4 sm:px-6 lg:px-8' : CONTAINER
          }
        >
          {/* lg: 3-column grid keeps the nav truly centered */}
          <div
            className={[
              'flex items-center justify-between gap-4',
              'lg:grid lg:grid-cols-[1fr_auto_1fr]',
              'transition-all duration-300',
              scrolled ? 'h-[62px] lg:h-[68px]' : 'h-16 lg:h-[72px]',
            ].join(' ')}
          >
            <div className="flex items-center lg:justify-self-start">
              <Logo scrolled={scrolled} />
            </div>

            <DesktopNavigation links={links} pathname={pathname} />

            <div className="flex items-center justify-end gap-2 lg:justify-self-end">
              <AuthActions
                variant={variant}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                isLoggingOut={isLoggingOut}
                user={user}
                onLogout={handleLogout}
              />

              <button
                type="button"
                aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
                disabled={isLoggingOut}
                className={[
                  'flex size-10 items-center justify-center',
                  'rounded-xl',
                  'border border-black/10',
                  'bg-card/70',
                  'text-foreground',
                  'backdrop-blur-md',
                  'transition-all duration-200',
                  'hover:bg-card',
                  'active:scale-95',
                  'disabled:cursor-not-allowed',
                  'disabled:opacity-60',
                  'lg:hidden',
                  FOCUS_RING,
                ].join(' ')}
              >
                {open ? (
                  <X aria-hidden="true" className="size-5" />
                ) : (
                  <Menu aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <MobileMenu
          open={open}
          menuId={menuId}
          links={links}
          pathname={pathname}
          variant={variant}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          isLoggingOut={isLoggingOut}
          user={user}
          onClose={() => setOpen(false)}
          onLogout={handleLogout}
        />
      </header>

      <div aria-hidden="true" className="h-16 lg:h-[72px]" />
    </>
  )
}