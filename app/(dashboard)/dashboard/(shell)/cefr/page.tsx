import { Suspense } from 'react'
import { PracticeHub } from '@/features/practice/components/practice-hub'
import { Loading } from '@/shared/ui/dashboard-kit'

export default function PracticePage() {
  return (
    <Suspense fallback={<Loading rows={3} />}>
      <PracticeHub />
    </Suspense>
  )
}
