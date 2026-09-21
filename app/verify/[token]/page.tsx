'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Headphones, PenLine, ShieldCheck, X } from 'lucide-react'
import { SiteHeader } from '@/components/layout/header'
import { publicApi } from '@/lib/api/endpoints'
import type { VerifiedResult } from '@/lib/api/types'

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<VerifiedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    params.then(({ token: value }) => {
      if (!active) return
      setToken(value)
      publicApi.resultByQr(value)
        .then(data => { if (active) setResult(data) })
        .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Natija topilmadi') })
        .finally(() => { if (active) setLoading(false) })
    })
    return () => { active = false }
  }, [params])

  const components = result ? [
    { name: 'Reading', icon: BookOpen, band: result.reading?.cefr_level, score: result.reading?.scaled_score },
    { name: 'Listening', icon: Headphones, band: result.listening?.cefr_level, score: result.listening?.scaled_score },
    { name: 'Writing', icon: PenLine, band: result.writing?.cefr_level, score: result.writing?.scaled_score },
    { name: 'Speaking', icon: PenLine, band: result.speaking?.cefr_level, score: result.speaking?.scaled_score },
  ] : []

  return <div className="min-h-screen bg-background">
    <SiteHeader />
    <main className="container-shell py-14"><div className="mx-auto max-w-xl">
      {loading ? <div className="surface p-8 text-center">Natija tekshirilmoqda...</div> : result ? <>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><ShieldCheck className="size-5" /></div><div><p className="font-semibold text-emerald-800">Result verified</p><p className="text-sm text-emerald-700">Ushbu natija backend tomonidan tasdiqlangan.</p></div></div>
        <div className="surface mt-6 p-6"><p className="text-xs text-muted-foreground">Verification token: <span className="font-mono">{token}</span></p><h1 className="mt-3 text-2xl font-bold">{result.full_name}</h1><p className="text-muted-foreground">Student ID: {result.student_id}</p><p className="text-muted-foreground">Result ID: {result.result_id}</p>
        <div className="mt-6 grid gap-3">{components.map(({ name, icon: Icon, band, score }) => <div key={name} className="flex items-center gap-3 rounded-xl border p-4"><div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="size-4" /></div><div className="flex-1 text-sm font-medium">{name}</div><div className="text-right"><span className="font-bold text-primary">{band}</span><span className="ml-2 text-xs text-muted-foreground">{score}</span></div></div>)}</div>
        <div className="mt-5 flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3"><span>Overall</span><span className="font-bold">{result.overall_score} · {result.cefr_level}</span></div>
        </div>
      </> : <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5"><div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600"><X className="size-5" /></div><div><p className="font-semibold text-red-800">Result not found</p><p className="text-sm text-red-700">{error || 'No published result matches this verification token.'}</p></div></div>}
      <div className="mt-6 flex gap-3"><Link href="/result" className="text-sm font-semibold text-primary hover:underline">Verify another result</Link><span className="text-muted-foreground">·</span><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Return to home</Link></div>
    </div></main></div>
}
