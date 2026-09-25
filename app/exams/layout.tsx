'use client'

import { ReactNode } from 'react'

export default function ExamsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b h-14 flex items-center px-6 sticky top-0 z-50">
        <div className="font-bold tracking-tight">
          Steply<span className="text-primary">.</span> <span className="font-normal text-muted-foreground">Exams Portal</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
