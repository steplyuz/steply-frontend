'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock3, Mic2, ShieldAlert } from 'lucide-react'
import { speakingApi } from '@/lib/api'
import type { SpeakingSubmission } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'

// Backend /speaking/pending va /speaking/{id}/result endpointlari ADMIN VA
// SPEAKING_EVALUATOR rollariga ruxsat beradi (require_role(SPEAKING_EVALUATOR, ADMIN)).
//
// Bu sahifa — teacher (speaking_evaluator) uchun /admin ga kirganda avtomatik
// yo'naltiriladigan ALOHIDA, soddalashtirilgan "Baholash markazi": to'liq
// Mock Center boshqaruv paneli (imtihonlar, sessiyalar, testlar CRUD) o'rniga
// faqat ularning bitta haqiqiy vazifasi — navbatdagi speaking javoblarini
// baholash — ko'rsatiladi.
const ALLOWED_ROLES = ['admin', 'speaking_evaluator']

export default function Page() {
  const { user, isLoading } = useAuth()
  const [submissions, setSubmissions] = useState<SpeakingSubmission[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canGrade = !!user && ALLOWED_ROLES.includes(user.global_role)
  const isEvaluator = user?.global_role === 'speaking_evaluator'

  useEffect(() => {
    if (!canGrade) return
    speakingApi.pendingSubmissions()
      .then(setSubmissions)
      .catch(() => {
        setSubmissions([])
        setError("Speaking topshiriqlarini yuklab bo'lmadi.")
      })
  }, [canGrade])

  if (isLoading) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  )

  if (!canGrade) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administrator yoki baholovchi kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
    </div>
  )

  const firstName = (user?.profile?.full_name || '').trim().split(/\s+/)[0] || 'Baholovchi'
  const pendingCount = submissions?.length ?? null

  return (
    <div className="container-shell py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {isEvaluator ? 'Baholash markazi' : 'Speaking'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isEvaluator ? `Xush kelibsiz, ${firstName}` : 'Talabgorlar javoblari'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Talabgor speaking imtihonini topshirgach, uning audio javoblari shu ro'yxatda paydo bo'ladi.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Mic2 className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{pendingCount ?? '—'}</p>
            <p className="mt-1 text-xs text-muted-foreground">kutilmoqda</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {submissions === null && (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      )}

      {submissions?.length === 0 && !error && (
        <div className="surface mt-8 p-10 text-center">
          <Clock3 className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Hozircha baholanishi kutilayotgan speaking topshiriqlari yo'q.</p>
        </div>
      )}

      {submissions && submissions.length > 0 && (
        <div className="surface mt-8 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Talabgor</th>
                <th className="px-5 py-3 font-medium">Test</th>
                <th className="px-5 py-3 font-medium">Topshirilgan vaqt</th>
                <th className="px-5 py-3 font-medium">Holati</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <p className="font-medium">{sub.full_name || `Foydalanuvchi #${sub.user_id}`}</p>
                    {sub.student_id && <p className="mt-0.5 font-mono text-xs text-primary">{sub.student_id}</p>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{sub.speaking_test_id}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(sub.created_at).toLocaleString('uz-UZ')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      sub.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sub.status === 'graded' ? 'Baholandi' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/speaking/assessments/${sub.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Baholash →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
