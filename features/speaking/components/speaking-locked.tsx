'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { speakingApi } from '@/shared/api'
import { authenticatedDownload } from '@/shared/api/download'
import { PracticeActionButton, PracticeActionLink } from '@/shared/ui/action-button'

function safeName(input: string): string {
  return input.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'speaking'
}

/** Speaking savollari PDF'ini yuklab olish (obuna shart emas). */
export function SpeakingPdfButton({ testId, title, className = '' }: { testId: string; title?: string; className?: string }) {
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    try {
      await authenticatedDownload(speakingApi.practicePaperUrl(testId), {
        filename: `${safeName(title ?? testId)}.pdf`,
        onError: (message) => toast.error(message),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PracticeActionButton
      variant="download"
      label="PDF yuklab olish"
      busy={busy}
      disabled={busy}
      onClick={() => void download()}
      className={className}
    />
  )
}

/** Obunasiz foydalanuvchi uchun test kartochkasidagi amallar (kartochka tugmalari bilan bir xil ko'rinishda). */
export function SpeakingLockedActions({ testId, title }: { testId: string; title: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <SpeakingPdfButton testId={testId} title={title} />
      <PracticeActionLink href="/dashboard/billing" variant="locked" label="Obunani ochish" />
    </div>
  )
}

/** Obunasiz foydalanuvchi test sahifasiga kirganda: imtihon bloklanadi, PDF ochiq qoladi. */
export function SpeakingLockedTest({ testId }: { testId?: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_8px_28px_rgba(15,61,38,0.035)] ring-1 ring-[#0F3D26]/[0.06] sm:p-8">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <Lock className="size-5 text-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Speaking imtihoni obunada</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Imtihonni topshirish va baholash faqat faol obunada mavjud. Savollarni PDF formatida yuklab olishingiz mumkin.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {testId && <SpeakingPdfButton testId={testId} title={`speaking-${testId}`} />}
          <PracticeActionLink href="/dashboard/billing" variant="start" label="Obunani ko‘rish" />
        </div>
        <Link
          href="/dashboard/cefr?skill=speaking"
          className="mt-4 inline-block text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Speaking testlariga qaytish
        </Link>
      </div>
    </div>
  )
}
