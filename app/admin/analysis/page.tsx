'use client'

import { useState } from 'react'
import { Loader2, Trash2, Upload, Video } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import { apiRequest, apiUpload } from '@/lib/api/client'
import { errMsg } from '@/lib/api/dashboard'
import { Empty, ErrorBox, Loading, PageHeader, Section, input } from '@/components/dashboard/ui'

type AnalysisVideo = { id: number; skill: 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'; test_id: string; title: string; created_at: string }
const SKILLS: AnalysisVideo['skill'][] = ['READING', 'LISTENING', 'WRITING', 'SPEAKING']

export default function AdminAnalysisPage() {
  const videos = useApi<AnalysisVideo[]>('/admin/analysis/videos')
  const [skill, setSkill] = useState<AnalysisVideo['skill']>('READING')
  const [testId, setTestId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function uploadVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || !testId.trim() || !title.trim()) {
      setError('Test ID, sarlavha va video faylini to‘ldiring.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiUpload('/admin/analysis/videos', { skill, test_id: testId.trim(), title: title.trim(), file })
      setMessage('Tahlil videosi saqlandi.')
      setTestId('')
      setTitle('')
      setFile(null)
      const picker = document.getElementById('analysis-video-file') as HTMLInputElement | null
      if (picker) picker.value = ''
      videos.reload()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  async function deleteVideo(id: number) {
    if (!window.confirm('Bu tahlil videosini o‘chirishni tasdiqlaysizmi?')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiRequest(`/admin/analysis/videos/${id}`, { method: 'DELETE' })
      setMessage('Video o‘chirildi.')
      videos.reload()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analysis videolari" desc="Har bir skill va test ID uchun tahlil videosini yuklang yoki mavjud videoni almashtiring." />
      <Section title="Video yuklash">
        <form onSubmit={uploadVideo} className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">Skill
            <select className={input} value={skill} onChange={e => setSkill(e.target.value as AnalysisVideo['skill'])}>
              {SKILLS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">Test ID
            <input className={input} value={testId} onChange={e => setTestId(e.target.value)} maxLength={64} placeholder="Masalan: test-b2-01" />
          </label>
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Video sarlavhasi
            <input className={input} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Masalan: Reading test 1 tahlili" />
          </label>
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Video fayli (MP4, WebM yoki MOV, maksimal 500 MB)
            <input id="analysis-video-file" className={`${input} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5`} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error && <div role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</div>}
          {message && <div role="status" className="text-sm text-emerald-700 sm:col-span-2">{message}</div>}
          <div className="sm:col-span-2"><button disabled={busy || !file || !testId.trim() || !title.trim()} type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Videoni saqlash</button></div>
        </form>
      </Section>

      <Section title="Joylangan videolar">
        {videos.loading ? <Loading rows={3} /> : videos.error ? <ErrorBox message={videos.error.message} onRetry={videos.reload} /> : !videos.data?.length ? <Empty text="Hozircha tahlil videosi yo‘q." /> : (
          <div className="space-y-3">
            {videos.data.map(item => (
              <article key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Video className="size-5" /></span>
                <div className="min-w-0 flex-1"><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.skill} · Test ID: {item.test_id}</p><p className="mt-1 text-xs text-muted-foreground">ID: {item.id} · {new Date(item.created_at).toLocaleDateString('uz-UZ')}</p></div>
                <button type="button" disabled={busy} onClick={() => deleteVideo(item.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-4" /> O‘chirish</button>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
