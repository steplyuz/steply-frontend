/* app/not-found.tsx */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sahifa topilmadi — Steply',
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong'

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Dekorativ pill ustunlar (dashboard hero bilan bir xil motiv) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-between px-8 sm:flex lg:px-24"
      >
        <div className="flex items-end gap-3">
          <span className="-mb-8 h-40 w-14 rounded-full bg-primary" />
          <span className="-mb-8 h-56 w-14 rounded-full bg-hatch ring-1 ring-primary-strong/10" />
          <span className="-mb-8 h-32 w-14 rounded-full bg-primary-strong" />
        </div>
        <div className="flex items-end gap-3">
          <span className="-mb-8 h-36 w-14 rounded-full bg-brand-bright" />
          <span className="-mb-8 h-52 w-14 rounded-full bg-primary-strong" />
          <span className="-mb-8 h-44 w-14 rounded-full bg-hatch ring-1 ring-primary-strong/10" />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Logotip: sidebar bilan bir xil */}
        <div className="mb-10 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-foreground">
          <span
            aria-hidden="true"
            className="size-4 rounded-full bg-gradient-to-br from-brand-glow via-primary to-primary-strong"
          />
          Steply
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Xatolik
        </span>

        <h1
          aria-label="404"
          className="mt-4 bg-gradient-to-br from-primary-strong via-primary to-brand-bright bg-clip-text text-8xl font-semibold leading-none tracking-tighter text-transparent sm:text-9xl"
        >
          404
        </h1>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Sahifa topilmadi</h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          Siz qidirayotgan sahifa mavjud emas, manzili o‘zgargan yoki o‘chirib tashlangan bo‘lishi mumkin.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className={`group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-strong py-2 pl-6 pr-2 text-[15px] font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] motion-reduce:transition-none ${focusRing}`}
          >
            Bosh sahifaga qaytish
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-primary-strong transition-transform group-hover:rotate-45 motion-reduce:transition-none">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/dashboard"
            className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-primary-strong ring-1 ring-primary-strong/70 transition hover:bg-card active:scale-[0.98] motion-reduce:transition-none ${focusRing}`}
          >
            Kabinetga o‘tish
          </Link>
        </div>

        <p className="mt-12 text-sm text-muted-foreground/80">Steply — Milliy sertifikat practice platformasi</p>
      </div>
    </main>
  )
}