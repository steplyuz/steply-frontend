'use client'

import Link from 'next/link'
import { CheckCircle2, Lock } from 'lucide-react'
import { useSpeakingGrading } from '@/lib/speaking/access'
import { btn } from './ui'

/** Obunasiz: javoblar saqlanadi, lekin baholanmaydi. Obunali: baholashga yuboriladi. */
export function SpeakingGradingNotice({ className = '' }: { className?: string }) {
  const { loading, canGrade } = useSpeakingGrading()
  if (loading) return null

  if (canGrade) {
    return (
      <div className={`flex items-start gap-3 rounded-2xl border border-border bg-white p-4 text-sm ${className}`}>
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        <p className="text-muted-foreground">
          <span className="font-bold text-foreground">Baholash yoqilgan.</span> Yozilgan javoblaringiz baholash uchun yuboriladi.
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0 text-foreground" />
        <p className="text-foreground/80">
          <span className="font-bold text-foreground">Baholash faqat obunada.</span> Javoblaringiz to‘liq yozib olinadi va saqlanadi, savollar bilan birga yuklab olishingiz mumkin — lekin obunasiz baholanmaydi.
        </p>
      </div>
      <Link href="/dashboard/billing" className={`${btn.primary} shrink-0`}>Obunani ko‘rish</Link>
    </div>
  )
}
