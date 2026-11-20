import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { PremiumTestGuard } from '@/features/practice/components/premium-test-guard'
import { isReservedTestSlug } from '@/features/practice/lib/access'

export default async function ListeningTestLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // /dashboard/listening/ai, /start kabi maxsus yo'llar test id sifatida ochilmasin
  if (isReservedTestSlug(id)) redirect('/dashboard/cefr?skill=listening')

  return (
    <PremiumTestGuard skill="listening" testId={id}>
      {children}
    </PremiumTestGuard>
  )
}
