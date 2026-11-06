import { Suspense } from 'react'
import { PracticeHub } from '@/components/dashboard/practice-hub'
import { Loading } from '@/components/dashboard/ui'

export default function PracticePage() {
  return (
    <Suspense fallback={<Loading rows={3} />}>
      <PracticeHub />
    </Suspense>
  )
}
