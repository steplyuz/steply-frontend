'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Mic2, PenLine, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { writingApi, speakingApi } from '@/lib/api'
import type { WritingResult, SpeakingSubmission } from '@/lib/api/types'

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const [writing, setWriting] = useState<WritingResult[] | null>(null)
  const [speaking, setSpeaking] = useState<SpeakingSubmission[] | null>(null)
  const [error, setError] = useState('')
  const load = () => {
    setError('')
    Promise.allSettled([writingApi.pending(), speakingApi.pendingSubmissions()]).then(([w, s]) => {
      if (w.status === 'fulfilled') setWriting(w.value); else { setWriting([]); setError('Writing navbatini yuklab bo‘lmadi.') }
      if (s.status === 'fulfilled') setSpeaking(s.value); else { setSpeaking([]); setError(current => current ? current + ' Speaking navbatini ham yuklab bo‘lmadi.' : 'Speaking navbatini yuklab bo‘lmadi.') }
    })
  }
  useEffect(() => { load() }, [])
  const firstName = user?.profile?.full_name?.trim().split(/\s+/)[0] || 'Teacher'
  const stat = (label: string, value: number | null, Icon: typeof PenLine) => <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="size-5" /></div><p className="mt-3 text-3xl font-bold">{value ?? '—'}</p></div>
  return <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Teacher workspace</p><h1 className="mt-2 text-3xl font-bold">Xush kelibsiz, {firstName}</h1><p className="mt-2 text-sm text-muted-foreground">Writing va Speaking javoblarini bitta joydan kuzating va baholang.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="size-4"/> Yangilash</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2">{stat('Writing kutilmoqda', writing?.length ?? null, PenLine)}{stat('Speaking kutilmoqda', speaking?.length ?? null, Mic2)}</div>
    <div className="grid gap-4 md:grid-cols-2"><Link href="/teacher-expert/writing" className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50"><PenLine className="size-6 text-primary"/><h2 className="mt-4 text-lg font-bold">Writing baholash</h2><p className="mt-1 text-sm text-muted-foreground">Yozma javoblarni ko‘ring, ball va izoh kiriting.</p><p className="mt-4 text-sm font-semibold">Navbatni ochish →</p></Link><Link href="/teacher-expert/speaking" className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50"><Mic2 className="size-6 text-primary"/><h2 className="mt-4 text-lg font-bold">Speaking javoblari</h2><p className="mt-1 text-sm text-muted-foreground">Audio topshiriqlar navbati va holatini kuzating.</p><p className="mt-4 text-sm font-semibold">Navbatni ochish →</p></Link></div>
    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground"><Clock3 className="mr-2 inline size-4"/> Ma’lumotlar backend API’dan olinadi; ruxsat berilmagan endpointlar xatolik sifatida ko‘rsatiladi.</div>
  </div>
}
