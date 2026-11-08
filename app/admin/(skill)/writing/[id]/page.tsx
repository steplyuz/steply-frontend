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
import { writingApi } from '@/shared/api'
import type { WritingExam, WritingTask } from '@/shared/api/types'
import { ApiRequestError } from '@/shared/api/client'
import { useAuth } from '@/shared/providers/auth-context'
import { LockControls } from '@/features/admin/components/lock-controls'
import { adminInput } from '@/features/admin/components/ui/styles'
import { TestSettings } from '@/features/admin/components/test-settings'

// Reading / Listening bilan bir xil ro'yxat — barcha skill testlarida CEFR darajasi shu to'plamdan tanlanadi.
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

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

  const [taskSaving, setTaskSaving] = useState<number | null>(null)

  /** Topshiriq maydonlari (id, format va vaqt maydonlari yuborilmaydi). */
  const taskPayload = (task: WritingTask) => ({
    part_number: task.part_number,
    sub_part: task.sub_part ?? null,
    topic: task.topic,
    instruction: task.instruction,
    context_text: task.context_text ?? null,
    question: task.question ?? null,
    word_limit: task.word_limit ?? null,
    format_id: task.format_id ?? null,
  })

  /** Bitta topshiriqni alohida saqlaydi: mavjudi PUT /tasks/{id}, yangisi POST /tasks. Boshqalar o'zgarmaydi. */
  const saveTask = async (i: number) => {
    if (!exam) return
    const task = tasks[i]
    if ((task.topic ?? '').trim().length < 5 || (task.instruction ?? '').trim().length < 5) {
      setError(`${i + 1}-topshiriq: mavzu va ko'rsatma kamida 5 belgidan iborat bo'lishi kerak.`)
      return
    }
    try {
      setTaskSaving(i)
      setError(null)
      const updated = task.id != null
        ? await writingApi.updateTask(id, task.id, taskPayload(task))
        : await writingApi.addTask(id, taskPayload(task))
      setExam(updated)
      setTasks(updated.tasks || [])
      setLastSaved(new Date())
      setDirty(false)
    } catch (e) {
      setError(e instanceof ApiRequestError ? `${i + 1}-topshiriq: ${e.message}` : `${i + 1}-topshiriq saqlanmadi`)
    } finally {
      setTaskSaving(null)
    }
  }

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
                exam.is_active ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}
            >
              {exam.is_active ? 'Faol (Active)' : 'Qoralama (Draft)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {error && <span className="text-sm font-medium text-error truncate max-w-[200px]">{error}</span>}
            <LockControls onLock={() => writingApi.lock(id)} onUnlock={() => writingApi.unlock(id)} />
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {dirty ? <span className="text-warning">Saqlanmagan...</span> : `Saqlandi: ${lastSaved.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`}
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
          {/* Test Sozlamalari */}
          <TestSettings
            skill="writing"
            value={exam}
            onChange={(key, val) => updateExam(key, val as never)}
          />

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
                      type="button"
                      onClick={() => void saveTask(i)}
                      disabled={taskSaving !== null || saving}
                      className="ml-auto mr-3 rounded-lg border border-border px-3 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      {taskSaving === i ? 'Saqlanmoqda...' : task.id != null ? 'Topshiriqni saqlash' : 'Qo\'shish'}
                    </button>
                    <button
                      onClick={() => removeTask(i)}
                      className="text-muted-foreground transition hover:text-error"
                      title="o'chirish"
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
                        className={adminInput}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qo'llanma (Instruction)</label>
                      <textarea
                        value={task.instruction}
                        onChange={e => updateTask(i, { instruction: e.target.value })}
                        placeholder="Masalan: You should spend about 20 minutes on this task..."
                        className={adminInput}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Savol (Question / Prompt)</label>
                      <textarea
                        value={task.question || ''}
                        onChange={e => updateTask(i, { question: e.target.value })}
                        placeholder="Masalan: To what extent do you agree or disagree?"
                        className={adminInput}
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