'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

interface Props {
  title?: string
  description?: string
  onMenuClick: () => void
}

function initials(name?: string) {
  if (!name) return 'U'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

export function DashboardTopbar({ title = 'Shaxsiy kabinet', description, onMenuClick }: Props) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Menyuni ochish"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight text-foreground">{title}</h1>
        {description && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
        )}
      </div>

      <button
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Bildirishnomalar"
      >
        <Bell className="size-5" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-card" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary-strong">
            {initials(user?.name)}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-medium text-foreground md:block">
            {user?.name}
          </span>
          <ChevronDown
            className={`hidden size-4 text-muted-foreground transition-transform md:block ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-card p-1 shadow-lg"
          >
            <div className="border-b px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Link
              href="/dashboard/profile"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <User className="size-4 text-muted-foreground" /> Profil
            </Link>
            <button
              role="menuitem"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
            >
              <LogOut className="size-4" /> Chiqish
            </button>
          </div>
        )}
      </div>
    </header>
  )
}