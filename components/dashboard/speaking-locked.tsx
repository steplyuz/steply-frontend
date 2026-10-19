'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Download, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { speakingApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import { btn } from './ui'

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
    <button type="button" onClick={() => void download()} disabled={busy} className={`${btn.outline} !min-h-10 gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60 ${className}`}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} PDF yuklab olish
    </button>
  )
}

/** Obunasiz foydalanuvchi uchun test kartochkasidagi o'rnini bosuvchi amallar. */
export function SpeakingLockedActions({ testId, title }: { testId: string; title: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SpeakingPdfButton testId={testId} title={title} />
      <Link href="/dashboard/billing" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Obuna kerak
      </Link>
    </div>
  )
}

/** Obunasiz foydalanuvchi test sahifasiga kirganda: imtihon bloklanadi, PDF ochiq qoladi. */
export function SpeakingLockedTest({ testId }: { testId?: string | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 text-center shadow-[0_8px_28px_rgba(11,11,13,0.035)] sm:p-8">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <Lock className="size-5 text-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Speaking imtihoni obunada</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Imtihonni topshirish va baholash faqat faol obunada mavjud. Savollarni PDF formatida yuklab olishingiz mumkin.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {testId && <SpeakingPdfButton testId={testId} title={`speaking-${testId}`} />}
          <Link href="/dashboard/billing" className={`${btn.primary} !min-h-10 rounded-xl px-4 text-sm font-semibold inline-flex items-center justify-center`}>
            Obunani ko‘rish
          </Link>
        </div>
        <Link href="/dashboard/speaking" className="mt-4 inline-block text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Speaking testlariga qaytish
        </Link>
      </div>
    </div>
  )
}
