'use client'

import { useEffect, useState } from 'react'
import { writingApi } from '@/lib/api'
import type { WritingResult } from '@/lib/api/types'

export default function TeacherHistoryPage() {
  const [results, setResults] = useState<WritingResult[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { writingApi.myResults().then(setResults).catch(() => { setResults([]); setError('Baholash tarixini yuklab bo‘lmadi.') }) }, [])
  return <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold">Bajarilgan baholashlar</h1><p className="text-sm text-muted-foreground">Writing natijalari va baholash tarixi.</p>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{results === null ? <p className="animate-pulse text-sm text-muted-foreground">Yuklanmoqda…</p> : results.length === 0 ? <div className="rounded-2xl border border-border p-8 text-sm text-muted-foreground">Hozircha tarix topilmadi.</div> : <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Natija</th><th className="px-4 py-3">Test</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Sana</th></tr></thead><tbody className="divide-y divide-border">{results.map(item => <tr key={item.id}><td className="px-4 py-3">#{item.id}</td><td className="px-4 py-3">{item.exam_id}</td><td className="px-4 py-3">{item.evaluation_status || '—'}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString('uz-UZ')}</td></tr>)}</tbody></table></div>}</div>
}
