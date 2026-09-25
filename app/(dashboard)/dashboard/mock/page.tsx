'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ArrowRight, Play, CheckCircle } from 'lucide-react'
import { mockExamsApi, mockCenterApi } from '@/lib/api'
import type { SessionRegistration, MockFinalResult } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'

export default function DashboardMockExamsPage() {
  const { isAuthenticated } = useAuth()
  const [onlineExams, setOnlineExams] = useState<SessionRegistration[]>([])
  const [offlineExams, setOfflineExams] = useState<SessionRegistration[]>([])
  const [results, setResults] = useState<MockFinalResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    Promise.all([
      mockExamsApi.myRegistrations().catch(() => []),
      mockCenterApi.myRegistrations().catch(() => []),
      mockCenterApi.myResults().catch(() => [])
    ]).then(([online, offline, res]) => {
      setOnlineExams(online)
      setOfflineExams(offline)
      setResults(res)
    }).finally(() => {
      setLoading(false)
    })
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="py-10 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-8"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-40 bg-muted rounded-xl"></div>
          <div className="h-40 bg-muted rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <main className="py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mening Mock Imtihonlarim</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sotib olingan va ro'yxatdan o'tilgan barcha imtihonlar
          </p>
        </div>
        <Link 
          href="/mock" 
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Yangi imtihon izlash <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Computer Based (Online) Exams */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Play className="size-5 text-primary" /> Online Imtihonlar
          </h2>
          {onlineExams.length === 0 ? (
            <div className="surface p-6 text-center text-muted-foreground text-sm">
              Sizda hozircha online mock imtihonlar yo'q.
            </div>
          ) : (
            <div className="space-y-4">
              {onlineExams.map((exam) => (
                <div key={exam.id} className="surface p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{exam.full_name || 'Mock Imtihon'}</h3>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 font-mono">{exam.student_id}</p>
                  
                  <Link 
                    href={`/exams/${exam.id}`}
                    className="inline-flex items-center gap-2 rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-xs font-semibold hover:bg-secondary/80"
                  >
                    <Play className="size-3.5" /> Imtihonni boshlash
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Paper Based (Offline) Exams */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" /> Markaziy (Offline) Imtihonlar
          </h2>
          {offlineExams.length === 0 ? (
            <div className="surface p-6 text-center text-muted-foreground text-sm">
              Sizda hozircha markazda topshiriladigan imtihonlar yo'q.
            </div>
          ) : (
            <div className="space-y-4">
              {offlineExams.map((exam) => (
                <div key={exam.id} className="surface p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{exam.full_name || 'Mock Imtihon'}</h3>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{exam.student_id}</p>
                  {exam.exam_date && (
                    <p className="text-sm mt-2 font-medium">
                      Sana: {new Date(exam.exam_date).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        <section className="lg:col-span-2 mt-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-primary" /> Yakunlangan Natijalar
          </h2>
          {results.length === 0 ? (
            <div className="surface p-6 text-center text-muted-foreground text-sm">
              Sizda hozircha tekshirilgan imtihon natijalari yo'q.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((r) => (
                <Link href={`/mock/${r.id}/result`} key={r.id} className="surface p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Level: {r.cefr_level || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-sm">
                    <div className="bg-muted rounded p-2"><p className="text-[10px] text-muted-foreground">L</p><p className="font-bold">{r.listening_ball}</p></div>
                    <div className="bg-muted rounded p-2"><p className="text-[10px] text-muted-foreground">R</p><p className="font-bold">{r.reading_ball}</p></div>
                    <div className="bg-muted rounded p-2"><p className="text-[10px] text-muted-foreground">W</p><p className="font-bold">{r.writing_ball}</p></div>
                    <div className="bg-muted rounded p-2"><p className="text-[10px] text-muted-foreground">S</p><p className="font-bold">{r.speaking_ball}</p></div>
                    <div className="bg-primary/10 text-primary rounded p-2"><p className="text-[10px]">ALL</p><p className="font-bold">{r.overall_score}</p></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
