/**
 * app/admin/(skill)/writing/[id]/page.tsx
 * ================================
 * Admin ?" Writing test tahrirlash.
 * Reading / Listening test tahrirlash UI arxitekturasiga mos.
 */
'use client'

import Link from 'next/link'
import { use, useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, Braces, Save, Layout, ShieldAlert,
  Trash2, Plus, GripVertical
} from 'lucide-react'
import { writingApi } from '@/lib/api'
import type { WritingExam, WritingTask } from '@/lib/api/types'
import { ApiRequestError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth/auth-context'

export default function EditWritingTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  
  const [exam, setExam] = useState<WritingExam | null>(null)
  const [tasks, setTasks] = useState<WritingTask[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  const [mode, setMode] = useState<'simple' | 'json'>('simple')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await writingApi.get(id)
      setExam(data)
      setTasks(data.tasks || [])
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
    // Backend: topic va instruction kamida 5 belgi bo'lishi shart (WritingTaskBase).
    const badIndex = tasks.findIndex(task => (task.topic ?? '').trim().length < 5 || (task.instruction ?? '').trim().length < 5)
    if (badIndex !== -1) {
      setError(`${badIndex + 1}-topshiriq: mavzu va ko'rsatma kamida 5 belgidan iborat bo'lishi kerak.`)
      return
    }
    try {
      setSaving(true)
      setError(null)
      await writingApi.update(id, {
        title: exam.title,
        cefr_level: exam.cefr_level,
        duration_minutes: exam.duration_minutes,
        is_active: exam.is_active,
        is_demo: exam.is_demo,
        is_free: exam.is_free,
        is_practice: exam.is_practice,
        tasks: tasks,
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
  }, [dirty, saving, exam, tasks, handleSave])

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        part_number: tasks.length + 1,
        topic: '',
        instruction: '',
        word_limit: null,
      }
    ])
    setDirty(true)
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
    setDirty(true)
  }

  const updateTask = (index: number, updates: Partial<WritingTask>) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], ...updates }
    setTasks(newTasks)
    setDirty(true)
  }

  const updateExam = <K extends keyof WritingExam>(key: K, value: WritingExam[K]) => {
    if (exam) {
      setExam({ ...exam, [key]: value })
      setDirty(true)
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
        <Link href="/admin/writing" className="text-sm font-semibold text-primary hover:underline">
          Ro'yxatga qaytish
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Sticky panel */}
      <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/writing"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Orqaga"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight">{exam.title || exam.id}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {exam.id} • {tasks.length} ta task
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

      {/* Main content */}
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
                <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase">Davomiyligi (daqiqa)</span>
                <input
                  type="number"
                  min={10}
                  value={exam.duration_minutes}
                  onChange={e => updateExam('duration_minutes', Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {([
                ['is_demo', 'Demo'],
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

          {/* Tasks Section */}
          {mode === 'json' ? (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JSON Tahrirlash (Tasks)</span>
              </div>
              <textarea
                value={JSON.stringify(tasks, null, 2)}
                onChange={e => {
                  try {
                    setTasks(JSON.parse(e.target.value))
                    setDirty(true)
                  } catch (err) {}
                }}
                className="w-full h-[500px] p-4 font-mono text-[13px] outline-none resize-y bg-transparent"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Tasks ({tasks.length})</h2>
              </div>

              {tasks.map((task, i) => (
                <div key={i} className="group relative rounded-xl border border-border bg-card shadow-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                        <GripVertical className="size-4" />
                      </div>
                      <span className="text-[13px] font-bold text-foreground">Task {task.part_number}</span>
                    </div>
                    <button
                      onClick={() => removeTask(i)}
                      className="text-muted-foreground transition hover:text-red-600"
                      title="O'chirish"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mavzu (Topic)</label>
                      <input
                        value={task.topic}
                        onChange={e => updateTask(i, { topic: e.target.value })}
                        placeholder="Masalan: Environment"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qo'llanma (Instruction)</label>
                      <textarea
                        value={task.instruction}
                        onChange={e => updateTask(i, { instruction: e.target.value })}
                        placeholder="Masalan: You should spend about 20 minutes on this task..."
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Savol (Question / Prompt)</label>
                      <textarea
                        value={task.question || ''}
                        onChange={e => updateTask(i, { question: e.target.value })}
                        placeholder="Masalan: To what extent do you agree or disagree?"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addTask}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent py-4 text-[13px] font-semibold text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="size-4" /> Yangi Task qo'shish
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}