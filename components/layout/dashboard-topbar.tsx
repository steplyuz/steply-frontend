'use client'

import { Menu } from 'lucide-react'

interface Props {
  title?: string
  onMenuClick: () => void
}

export function DashboardTopbar({ title = 'Shaxsiy kabinet', onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-5">
      <button onClick={onMenuClick} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" aria-label="Menyuni ochish">
        <Menu className="size-5" />
      </button>
      <h1 className="flex-1 text-sm font-semibold text-foreground truncate">{title}</h1>
    </header>
  )
}
