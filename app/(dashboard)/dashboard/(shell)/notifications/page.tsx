'use client'

import { InboxList } from '@/features/notifications/components/inbox-list'
import { PageHeader } from '@/shared/ui/dashboard-kit'

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title="Bildirishnomalar" desc="Buyurtma, mukofot va yangiliklar haqidagi xabarlar" />
      <InboxList />
    </div>
  )
}
