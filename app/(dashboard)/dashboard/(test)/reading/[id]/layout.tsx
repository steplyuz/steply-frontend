import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { PremiumTestGuard } from '@/features/practice/components/premium-test-guard'
import { isReservedTestSlug } from '@/features/practice/lib/access'

export default async function ReadingTestLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // /dashboard/reading/ai, /start kabi maxsus yo'llar test id sifatida ochilmasin
  if (isReservedTestSlug(id)) redirect('/dashboard/cefr?skill=reading')

  return (
    <PremiumTestGuard skill="reading" testId={id}>
      {children}
    </PremiumTestGuard>
  )
}
