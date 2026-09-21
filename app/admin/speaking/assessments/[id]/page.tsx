'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { speakingApi } from '@/lib/api/endpoints'
import type { SpeakingSubmission, SpeakingResultInput } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'

export default function Page() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  // Backend /speaking/{id}/result endpointi ADMIN VA SPEAKING_EVALUATOR
  // rollariga ruxsat beradi — bu yerda ham ikkalasi ham tekshiriladi.
  const canGrade = !!user && ['admin', 'speaking_evaluator'].includes(user.global_role)

  const [submission, setSubmission] = useState<SpeakingSubmission | null>(null)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [scores, setScores] = useState<SpeakingResultInput>({
    fluency_coherence: null,
    lexical_resource: null,
    grammar_accuracy: null,
    pronunciation: null,
    overall_band: 0,
    cefr_level: null,
    comment: null,
  })

  useEffect(() => {
    if (!canGrade) return
    speakingApi.pendingSubmissions()
      .then((list) => {
        const found = list.find((s) => String(s.id) === params.id) ?? null
        setSubmission(found)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [canGrade, params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!submission) return
    setSaving(true)
    setMessage(null)
    try {
      await speakingApi.submitResult(submission.id, scores)
      setMessage({ type: 'ok', text: 'Baholash muvaffaqiyatli saqlandi. Ro‘yxatga qaytilmoqda...' })
      setTimeout(() => router.push('/admin/speaking/assessments'), 1200)
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof ApiRequestError ? err.message : 'Xatolik yuz berdi.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || fetching) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  )

  if (!canGrade) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administrator yoki baholovchi kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
    </div>
  )

  if (!submission) return (
    <main className="container-shell py-10">
      <Link href="/admin/speaking/assessments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Ro'yxatga qaytish
      </Link>
      <p className="mt-6 text-sm text-muted-foreground">Bu topshiriq topilmadi.</p>
    </main>
  )

  const bandOptions = Array.from({ length: 151 }, (_, i) => i / 2)
  const cefrOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  return (
    <div className="container-shell py-10">
        <div className="mb-6">
          <Link href="/admin/speaking/assessments" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Ro'yxatga qaytish
          </Link>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Baholash</p>
          <h1 className="mt-1 text-2xl font-bold">
            {submission.full_name || `Topshiriq #${submission.id}`}
            {submission.student_id && <span className="ml-2 font-mono text-sm text-muted-foreground">{submission.student_id}</span>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Topshirilgan: {new Date(submission.created_at).toLocaleString('uz-UZ')} ·
            Holati: <span className={submission.status === 'graded' ? 'text-emerald-600' : 'text-amber-600'}>{submission.status}</span>
          </p>
        </div>

        {/* Audio fayl */}
        <div className="surface mb-6 p-6">
          <p className="font-semibold">Audio javob</p>
          <audio className="mt-4 w-full" controls src={submission.audio_url.startsWith("http") ? submission.audio_url : `${process.env.NEXT_PUBLIC_API_URL ?? ""}${submission.audio_url}`} />
          <p className="mt-2 text-xs text-muted-foreground">Davomiyligi: {submission.duration_seconds} soniya</p>
        </div>

        {/* Baholash formasi */}
        <form onSubmit={handleSubmit}>
          <div className="surface p-6">
            <p className="font-semibold">Mezonlar bo'yicha baho</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { key: 'fluency_coherence' as const, label: 'Fluency & Coherence' },
                { key: 'lexical_resource' as const, label: 'Lexical Resource' },
                { key: 'grammar_accuracy' as const, label: 'Grammar Accuracy' },
                { key: 'pronunciation' as const, label: 'Pronunciation' },
              ].map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1.5 text-sm font-medium">
                  {label}
                  <select
                    value={scores[key] ?? ''}
                    onChange={(e) => setScores((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : null }))}
                    className="rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Baho tanlang</option>
                    {bandOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Umumiy ball (Overall Band) *
                <select
                  value={scores.overall_band || ''}
                  onChange={(e) => setScores((p) => ({ ...p, overall_band: Number(e.target.value) }))}
                  required
                  className="rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Tanlang</option>
                  {bandOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                CEFR darajasi
                <select
                  value={scores.cefr_level ?? ''}
                  onChange={(e) => setScores((p) => ({ ...p, cefr_level: e.target.value || null }))}
                  className="rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Tanlang</option>
                  {cefrOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
              Izoh / Feedback
              <textarea
                value={scores.comment ?? ''}
                onChange={(e) => setScores((p) => ({ ...p, comment: e.target.value || null }))}
                rows={4}
                placeholder="Talabgor uchun izoh..."
                className="rounded-lg border bg-card p-3 text-sm outline-none focus:border-primary"
              />
            </label>

            {message && (
              <p className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                message.type === 'ok'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}>
                {message.text}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? 'Saqlanmoqda...' : 'Baholashni saqlash'}
              </button>
              <Link
                href="/admin/speaking/assessments"
                className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Bekor qilish
              </Link>
            </div>
          </div>
        </form>
    </div>
  )
}
