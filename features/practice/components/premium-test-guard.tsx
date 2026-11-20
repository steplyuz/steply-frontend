'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getErrorMessage, practiceApi } from '@/shared/api'
import type { PracticeCatalogItem, PracticeSkill } from '@/shared/api/types'
import { isBlockedForUser } from '@/features/practice/lib/access'
import { usePaidAccess } from '@/features/practice/lib/use-paid-access'
import { PremiumGate } from '@/features/practice/components/premium-gate'
import { ErrorBox } from '@/shared/ui/dashboard-kit'

type Props = {
  skill: PracticeSkill
  testId: string
  children: ReactNode
}

type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; item: PracticeCatalogItem | null }
  | { status: 'error'; message: string }

/*
 * Premium practice testni obunasi yo'q foydalanuvchidan yashiradi.
 * Qoida: isBlockedForUser (access.ts) — backend is_locked yoki premium + faol obuna yo'q.
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
        // Katalogda topilmagan test — server tekshiruviga qoldiriladi
        const item = items.find((i) => String(i.id) === String(testId)) ?? null
        setCatalog({ status: 'ready', item })
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
