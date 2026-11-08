'use client'

import Link from 'next/link'
import { CheckCircle2, Lock } from 'lucide-react'
import { useAiQuota, useSpeakingGrading } from '@/features/speaking/lib/access'
import { btn } from '@/shared/ui/dashboard-kit'

/**
 * Javoblar har doim saqlanadi. Speaking AI baholash tarif kvotasi bilan cheklanadi:
 * - Speaking'siz obuna: baholash yo'q;
 * - Speaking'li obuna, kvota bor: qolgan baholashlar ko'rsatiladi;
 * - Kvota tugagan: tarifni yangilash taklif qilinadi.
 */
export function SpeakingGradingNotice({ className = '' }: { className?: string }) {
  const { loading, canGrade } = useSpeakingGrading()
  const aiQuota = useAiQuota()
  if (loading) return null

  if (!canGrade) {
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

  const remaining = aiQuota.quota?.remaining ?? 0
  if (!aiQuota.loading && remaining > 0) {
    return (
      <div className={`flex items-start gap-3 rounded-3xl bg-white p-4 text-sm ${className} ring-1 ring-[#0F3D26]/[0.06]`}>
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        <p className="text-muted-foreground">
          <span className="font-bold text-foreground">Baholash yoqilgan.</span> Yozilgan javoblaringiz AI tomonidan baholanadi. Qolgan AI kreditlar (Writing + Speaking): <span className="font-bold text-foreground">{remaining}</span>.
        </p>
      </div>
    )
  }

  if (aiQuota.loading) return null

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0 text-foreground" />
        <p className="text-foreground/80">
          <span className="font-bold text-foreground">AI baholash limiti tugagan.</span> Javoblaringiz saqlangan; yangi baholash uchun tarifni yangilang.
        </p>
      </div>
      <Link href="/dashboard/billing" className={`${btn.primary} shrink-0`}>Tarifni ko‘rish</Link>
    </div>
  )
}
