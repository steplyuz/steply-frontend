'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import { apiUrl } from '@/lib/api/config'
import { btn } from '@/components/dashboard/ui'
import {
  Circle, LIME, SKILLS, authFetch, errorMessage, parseSkill, type AnalysisVideo,
} from '@/components/dashboard/analysis-shared'

export default function AnalysisVideoPage() {
  const params = useParams<{ skill: string; testId: string }>()
  const skill = parseSkill(params.skill)
  const testId = decodeURIComponent(String(params.testId ?? ''))
  const videos = useApi<AnalysisVideo[]>('/analysis/videos')

  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!skill) return
    const ctrl = new AbortController()
    let objectUrl: string | null = null
    setLoading(true)
    setError('')
    setUrl(null)
    ;(async () => {
      try {
        const response = await authFetch(apiUrl(`/analysis/${skill}/${encodeURIComponent(testId)}`), ctrl.signal)
        if (!response.ok) throw new Error(await errorMessage(response, 'Videoni yuklab bo‘lmadi'))
        const blob = await response.blob()
        if (ctrl.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : 'Videoni yuklab bo‘lmadi')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    })()
    return () => {
      ctrl.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [skill, testId, attempt])

  const back = (
    <Link
      href="/dashboard/analysis"
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground/65 transition active:scale-95 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> Analysis’ga qaytish
    </Link>
  )

  if (!skill) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-3xl border border-dashed border-foreground/20 bg-white p-8 text-center">
          <p className="font-bold">Bunday video sahifasi mavjud emas.</p>
        </div>
      </div>
    )
  }

  const { label, icon: Icon, tint, accent } = SKILLS[skill]
  const meta = videos.data?.find((v) => v.skill === skill && String(v.test_id) === testId)
  const title = meta?.title ?? `${label} · Test ${testId}`

  return (
    <div className="space-y-5 pb-6 sm:space-y-6">
      {back}

      <section
        className="relative isolate overflow-hidden rounded-3xl p-5 ring-1 ring-black/5 sm:rounded-[32px] sm:p-8"
        style={{ background: tint }}
      >
        <Circle color={`${accent}1A`} width={22} className="-right-14 -top-14 size-40 sm:-right-16 sm:-top-16 sm:size-64" />
        <div className="relative z-10 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:size-14" style={{ background: accent }}>
            <Icon aria-hidden="true" className="size-6 sm:size-7" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: accent }}>{label} · tahlil videosi</p>
            <h1 className="mt-1 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground/70">
              Test {testId}
            </p>
          </div>
        </div>
      </section>

      <section aria-label={title} className="overflow-hidden rounded-3xl bg-foreground sm:rounded-[32px]">
        {loading ? (
          <div className="flex aspect-video items-center justify-center gap-2 text-sm text-white/70" role="status">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Video yuklanmoqda…
          </div>
        ) : error ? (
          <div role="alert" className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
            <AlertCircle className="size-7" style={{ color: LIME }} aria-hidden="true" />
            <p className="max-w-md">{error}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${btn.primary} inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-bold`}>
              <RefreshCw className="size-4" aria-hidden="true" /> Qayta urinish
            </button>
          </div>
        ) : url ? (
          <video key={url} className="mx-auto max-h-[75vh] w-full" controls playsInline autoPlay src={url}>
            Brauzeringiz video formatini qo‘llamaydi.
          </video>
        ) : null}
      </section>
    </div>
  )
}