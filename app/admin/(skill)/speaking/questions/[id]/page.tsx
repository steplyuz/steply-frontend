/**
 * app/admin/(skill)/speaking/questions/[id]/page.tsx
 * ================================
 * Admin ?" Speaking test tahrirlash.
 * Reading / Listening / Writing kabi sticky sarlavha va UI elementlarga ega.
 */
'use client'

import Link from 'next/link'
import { use, useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, Braces, Save, Layout, ShieldAlert
} from 'lucide-react'
import { speakingApi } from '@/lib/api'
import { resolveAssetUrl } from '@/lib/api/config'
import type { SpeakingTest } from '@/lib/api/types'
import { ApiRequestError } from '@/lib/api/client'

export default function EditSpeakingTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [exam, setExam] = useState<SpeakingTest | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)
  
  const [mode, setMode] = useState<'simple' | 'json'>('simple')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await speakingApi.adminGet(id)
      setExam(data)
      setLastSaved(new Date())
      setDirty(false)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Testni yuklab bo\'lmadi')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void loadData() }, [loadData])

  const handleSave = async () => {
    if (!exam) return
    try {
      setSaving(true)
      setError(null)
      await speakingApi.update(id, {
        title: exam.title,
        description: exam.description,
        is_active: exam.is_active,
        is_free: exam.is_free,
        is_practice: exam.is_practice,
        part_1_1: exam.part_1_1,
        part_1_2: exam.part_1_2,
        part_2: exam.part_2,
        part_3: exam.part_3,
      })
      setLastSaved(new Date())
      setDirty(false)
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  // Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (dirty && !saving) void handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dirty, saving, exam, handleSave])

  const updateExam = <K extends keyof SpeakingTest>(key: K, value: SpeakingTest[K]) => {
    if (exam) {
      setExam({ ...exam, [key]: value })
      setDirty(true)
    }
  }

  const handleImageUpload = async (partKey: 'part_1_2' | 'part_2', field: 'image_1_url' | 'image_2_url' | 'image_url', file?: File) => {
    if (!file || !exam) return
    try {
      setError(null)
      const uploaded = await speakingApi.uploadImage(file)
      const part = exam[partKey] as any
      updateExam(partKey, { ...part, [field]: uploaded.url } as any)
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Rasm yuklanmadi')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">Yuklanmoqda...</p>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="font-semibold text-muted-foreground">{error || 'Test topilmadi'}</p>
        <Link href="/admin/speaking/questions" className="text-sm font-semibold text-primary hover:underline">
          Ro'yxatga qaytish
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/speaking/questions"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Orqaga"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight">{exam.title || exam.id}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {exam.id} • Speaking
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                exam.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {exam.is_active ? 'Faol (Active)' : 'Qoralama (Draft)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {error && <span className="text-sm font-medium text-red-600 truncate max-w-[200px]">{error}</span>}
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {dirty ? <span className="text-amber-600">Saqlanmagan...</span> : `Saqlandi: ${lastSaved.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            )}

            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                onClick={() => setMode('simple')}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                  mode === 'simple' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layout className="size-3.5" /> Dizayn
              </button>
              <button
                onClick={() => setMode('json')}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                  mode === 'json' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Braces className="size-3.5" /> JSON
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="size-3.5" />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      <main className="container-shell py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Metadata Section */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Test Sozlamalari</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase">Sarlavha</span>
                <input
                  type="text"
                  value={exam.title}
                  onChange={e => updateExam('title', e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase">Tavsif (Description)</span>
                <input
                  type="text"
                  value={exam.description || ''}
                  onChange={e => updateExam('description', e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {([
                ['is_free', 'Bepul'],
                ['is_practice', 'Mashq (practice) testi'],
                ['is_active', 'Faol'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!exam[key]}
                    onChange={e => updateExam(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* Parts Section */}
          {mode === 'json' ? (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JSON Tahrirlash (Parts)</span>
              </div>
              <textarea
                value={JSON.stringify({
                  part_1_1: exam.part_1_1,
                  part_1_2: exam.part_1_2,
                  part_2: exam.part_2,
                  part_3: exam.part_3
                }, null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setExam(prev => prev ? { ...prev, ...parsed } : null)
                    setDirty(true)
                  } catch (err) {}
                }}
                className="w-full h-[500px] p-4 font-mono text-[13px] outline-none resize-y bg-transparent"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Part 1.1 */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <h3 className="text-[14px] font-bold text-foreground">Part 1.1 - Introduction</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Tayyorgarlik (sekund)</span>
                      <input type="number" value={exam.part_1_1.prep_seconds} onChange={e => updateExam('part_1_1', { ...exam.part_1_1, prep_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Javob (sekund)</span>
                      <input type="number" value={exam.part_1_1.answer_seconds} onChange={e => updateExam('part_1_1', { ...exam.part_1_1, answer_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                  </div>
                  {[1, 2, 3].map(num => (
                    <label key={num} className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Savol {num}</span>
                      <input
                        type="text"
                        value={(exam.part_1_1 as any)[`question_${num}`]}
                        onChange={e => updateExam('part_1_1', { ...exam.part_1_1, [`question_${num}`]: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Part 1.2 */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <h3 className="text-[14px] font-bold text-foreground">Part 1.2 - Compare 2 Pictures</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Rasm 1 URL</span>
                      <input type="text" value={exam.part_1_2.image_1_url} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, image_1_url: e.target.value })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={saving} onChange={e => { void handleImageUpload('part_1_2', 'image_1_url', e.target.files?.[0]); e.currentTarget.value = '' }} className="mt-2 block w-full text-xs" />
                      {exam.part_1_2.image_1_url && <img src={resolveAssetUrl(exam.part_1_2.image_1_url)} alt="Part 1.2 rasm 1" className="mt-2 max-h-36 rounded-lg border object-contain" />}

                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Rasm 2 URL</span>
                      <input type="text" value={exam.part_1_2.image_2_url} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, image_2_url: e.target.value })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={saving} onChange={e => { void handleImageUpload('part_1_2', 'image_2_url', e.target.files?.[0]); e.currentTarget.value = '' }} className="mt-2 block w-full text-xs" />
                      {exam.part_1_2.image_2_url && <img src={resolveAssetUrl(exam.part_1_2.image_2_url)} alt="Part 1.2 rasm 2" className="mt-2 max-h-36 rounded-lg border object-contain" />}

                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Tayyorgarlik (s)</span>
                      <input type="number" value={exam.part_1_2.prep_seconds} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, prep_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Tasvirlash javobi (s)</span>
                      <input type="number" value={exam.part_1_2.describe_answer_seconds} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, describe_answer_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Normal javob (s)</span>
                      <input type="number" value={exam.part_1_2.answer_seconds} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, answer_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Tasvirlash savoli (Describe)</span>
                    <input type="text" value={exam.part_1_2.question_describe} onChange={e => updateExam('part_1_2', { ...exam.part_1_2, question_describe: e.target.value })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                  </label>
                  {[2, 3].map(num => (
                    <label key={num} className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Savol {num}</span>
                      <input
                        type="text"
                        value={(exam.part_1_2 as any)[`question_${num}`]}
                        onChange={e => updateExam('part_1_2', { ...exam.part_1_2, [`question_${num}`]: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Part 2 */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <h3 className="text-[14px] font-bold text-foreground">Part 2 - Describe 1 Picture</h3>
                </div>
                <div className="p-4 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Rasm URL</span>
                    <input type="text" value={exam.part_2.image_url} onChange={e => updateExam('part_2', { ...exam.part_2, image_url: e.target.value })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={saving} onChange={e => { void handleImageUpload('part_2', 'image_url', e.target.files?.[0]); e.currentTarget.value = '' }} className="mt-2 block w-full text-xs" />
                    {exam.part_2.image_url && <img src={resolveAssetUrl(exam.part_2.image_url)} alt="Part 2 rasm" className="mt-2 max-h-36 rounded-lg border object-contain" />}

                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Tayyorgarlik (s)</span>
                      <input type="number" value={exam.part_2.prep_seconds} onChange={e => updateExam('part_2', { ...exam.part_2, prep_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Javob (s)</span>
                      <input type="number" value={exam.part_2.answer_seconds} onChange={e => updateExam('part_2', { ...exam.part_2, answer_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                  </div>
                  {[1, 2, 3].map(num => (
                    <label key={num} className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Savol {num}</span>
                      <input
                        type="text"
                        value={(exam.part_2 as any)[`question_${num}`]}
                        onChange={e => updateExam('part_2', { ...exam.part_2, [`question_${num}`]: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Part 3 */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <h3 className="text-[14px] font-bold text-foreground">Part 3 - Discussion Topic</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Tayyorgarlik (s)</span>
                      <input type="number" value={exam.part_3.prep_seconds} onChange={e => updateExam('part_3', { ...exam.part_3, prep_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Javob (s)</span>
                      <input type="number" value={exam.part_3.answer_seconds} onChange={e => updateExam('part_3', { ...exam.part_3, answer_seconds: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Mavzu (Topic)</span>
                    <input type="text" value={exam.part_3.topic} onChange={e => updateExam('part_3', { ...exam.part_3, topic: e.target.value })} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Rozi fikrlar (For Points) - Yangi qator bilan</span>
                      <textarea
                        value={exam.part_3.for_points.join('\n')}
                        onChange={e => updateExam('part_3', { ...exam.part_3, for_points: e.target.value.split('\n').filter(Boolean) })}
                        className="w-full min-h-[100px] rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Qarshi fikrlar (Against Points) - Yangi qator bilan</span>
                      <textarea
                        value={exam.part_3.against_points.join('\n')}
                        onChange={e => updateExam('part_3', { ...exam.part_3, against_points: e.target.value.split('\n').filter(Boolean) })}
                        className="w-full min-h-[100px] rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}