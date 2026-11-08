'use client'

/**
 * Admin — Writing baholash navbati.
 * Insho yuklash (test kutubxonasi) bilan aralashmasligi uchun alohida sahifa.
 */

import { AdminPageShell } from '@/features/admin/layout/admin-page-shell'
import { WritingGradingQueue } from '@/features/admin/components/writing-grading-queue'

export default function AdminWritingGradingPage() {
  return (
    <AdminPageShell
      eyebrow="Testlar bazasi · Writing"
      title="Writing baholash"
      description="Topshirilgan inshalarni AI qoralama va o'qituvchi bahosi bo'yicha ko'ring."
    >
      <WritingGradingQueue />
    </AdminPageShell>
  )
}
