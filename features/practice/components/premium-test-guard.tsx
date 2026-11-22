'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getErrorMessage, practiceApi } from '@/shared/api'
import type { PracticeCatalogItem, PracticeSkill } from '@/shared/api/types'
import { isBlockedForUser } from '@/features/practice/lib/access'
import { usePaidAccess } from '@/features/practice/lib/use-paid-access'
import { PremiumGate } from '@/features/practice/components/premium-gate'
import { ErrorBox } from '@/shared/ui/dashboard-kit'
import { FOCUS } from '@/shared/lib/brand'

type Props = {
  skill: PracticeSkill
  testId: string
  children: ReactNode
}

type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; item: PracticeCatalogItem | null; hasTests: boolean }
  | { status: 'error'; message: string }

// Faqat ko'rinadigan (is_practice / is_active) testlar hisobga olinadi
const isVisibleItem = (i: object) => {
  const r = i as { is_practice?: boolean; is_active?: boolean }
  return r.is_practice !== false && r.is_active !== false
}

/*
 * Premium practice testni obunasi yo'q foydalanuvchidan yashiradi.
 * Qoida: isBlockedForUser (access.ts) — backend is_locked yoki premium + faol obuna yo'q.
 * Ko'nikmada ko'rinadigan testlar bo'lmasa, test sahifasi ochilmaydi.
 * Server baribir 403 qaytaradi; bu komponent UI himoyasi.
 * Mock imtihon (?mode=mock) bu tekshiruvdan o'tkazilmaydi.
 * Katalog yoki obuna holati yuklanmasa, test ochilmaydi (qayta urinish tugmasi bor).
 */
function PremiumTestGuardInner({ skill, testId, children }: Props) {
  const isMock = useSearchParams().get('mode') === 'mock'
  const paid = usePaidAccess()
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (isMock) return
    let alive = true
    practiceApi
      .testsBySkill(skill)
      .then((items) => {
        if (!alive) return
        const item = items.find((i) => String(i.id) === String(testId)) ?? null
        const hasTests = items.some(isVisibleItem)
        setCatalog({ status: 'ready', item, hasTests })
      })
      .catch((e) => {
        if (alive) setCatalog({ status: 'error', message: getErrorMessage(e, 'Test holatini tekshirib bo‘lmadi') })
      })
    return () => {
      alive = false
    }
  }, [skill, testId, isMock, attempt])

  if (isMock) return <>{children}</>

  if (catalog.status === 'error') {
    return (
      <div className="mx-auto max-w-md py-10">
        <ErrorBox
          message={catalog.message}
          onRetry={() => {
            setCatalog({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
        />
      </div>
    )
  }

  if (catalog.status === 'loading' || paid === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Yuklanmoqda…</span>
      </div>
    )
  }

  // Ko'nikmada testlar yo'q: kirish yopiq, mashq sahifasiga qaytariladi
  if (!catalog.hasTests) {
    return (
      <div className="mx-auto my-10 max-w-md space-y-5 rounded-3xl bg-white p-8 text-center ring-1 ring-[#0F3D26]/[0.07]">
        <h2 className="text-xl font-semibold text-foreground">Bu ko'nikma bo'yicha testlar yo'q</h2>
        <p className="text-sm text-foreground/60">Hozircha bu bo'limda test mavjud emas.</p>
        <Link
          href="/dashboard/practice"
          className={`inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-white ${FOCUS}`}
        >
          Mashq sahifasiga qaytish
        </Link>
      </div>
    )
  }

  if (catalog.item && isBlockedForUser(catalog.item, paid)) {
    return (
      <div className="py-10">
        <PremiumGate locked>{null}</PremiumGate>
      </div>
    )
  }

  return <>{children}</>
}

export function PremiumTestGuard(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <PremiumTestGuardInner {...props} />
    </Suspense>
  )
}