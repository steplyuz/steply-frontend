'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getErrorMessage, practiceApi } from '@/shared/api'
import type { PracticeSkill } from '@/shared/api/types'
import { isLockedTest } from '@/features/practice/lib/access'
import { PremiumGate } from '@/features/practice/components/premium-gate'
import { ErrorBox } from '@/shared/ui/dashboard-kit'

type Props = {
  skill: PracticeSkill
  testId: string
  children: ReactNode
}

type GateState =
  | { status: 'loading' }
  | { status: 'open' }
  | { status: 'locked' }
  | { status: 'error'; message: string }

/*
 * Premium (obunali) practice testni obunasi yo'q foydalanuvchidan yashiradi.
 * Qulflanganlik backend katalogidagi is_locked bo'yicha aniqlanadi.
 * Server baribir 403 qaytaradi — bu komponent faqat UI himoyasi.
 * Mock imtihon (?mode=mock) bu tekshiruvdan o'tkazilmaydi.
 * Katalogni yuklab bo'lmasa, test ochilmaydi (xavfsiz tomondan), qayta urinish tugmasi chiqadi.
 */
function PremiumTestGuardInner({ skill, testId, children }: Props) {
  const isMock = useSearchParams().get('mode') === 'mock'
  const [state, setState] = useState<GateState>({ status: isMock ? 'open' : 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (isMock) return
    let alive = true
    practiceApi
      .testsBySkill(skill)
      .then((items) => {
        if (!alive) return
        // Katalogda topilmagan test (masalan, mock test) — server tekshiruviga qoldiriladi.
        const item = items.find((i) => String(i.id) === String(testId))
        setState({ status: item && isLockedTest(item) ? 'locked' : 'open' })
      })
      .catch((e) => {
        if (alive) setState({ status: 'error', message: getErrorMessage(e, 'Test holatini tekshirib bo‘lmadi') })
      })
    return () => {
      alive = false
    }
  }, [skill, testId, isMock, attempt])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Yuklanmoqda…</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-md py-10">
        <ErrorBox
          message={state.message}
          onRetry={() => {
            setState({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
        />
      </div>
    )
  }

  if (state.status === 'locked') {
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
