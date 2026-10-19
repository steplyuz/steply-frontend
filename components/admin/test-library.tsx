'use client'

/**
 * components/admin/test-library.tsx
 * =================================
 * Reading / Listening / Writing / Speaking "testlar kutubxonasi" uchun YAGONA sahifa.
 *
 * Avval to'rt sahifaning har biri o'zicha yozilgan edi (Reading va Listening nusxa, Writing va Speaking
 * butunlay boshqa ko'rinish va boshqa mantiq). Endi hammasi shu komponent orqali: bir xil sarlavha,
 * "JSON import" / "Yangi test" tugmalari, yaratish formasi, ro'yxat qatori, amallar va JSON namuna bloki.
 * Har bir skill faqat `TestLibraryConfig` beradi.
 */

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { ChevronRight, Download, FileDown, Pencil, Plus, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'
import { authenticatedDownload } from '@/lib/api/download'
import {
  AdminButton, AdminEmpty, AdminError, AdminPageShell, StatusBadge,
} from '@/components/layout/admin-page-shell'

export interface CreateField {
  name: string
  label: string
  type: 'text' | 'select' | 'number'
  options?: string[]
  min?: number
  max?: number
  required?: boolean
  placeholder?: string
  defaultValue?: string | number
  /** Gridda necha ustun egallaydi (1..3), default 1 */
  span?: 1 | 2 | 3
}

export interface LibraryRow {
  id: string
  title: string
  /** Sarlavha tagidagi meta qismlar: ["B1", "40 savol", "60 daq"] */
  meta: string[]
  isActive?: boolean
  badges?: string[]
}

export interface RowDownload {
  label: string
  title?: string
  url: (id: string) => string
  filename: (id: string) => string
}

export interface TestLibraryConfig<T> {
  /** "Reading" */
  noun: string
  eyebrow?: string
  title: string
  description: string
  icon: ElementType
  load: () => Promise<T[]>
  toRow: (item: T) => LibraryRow
  remove: (id: string) => Promise<unknown>
  importJson: (file: File) => Promise<unknown>
  /** Bo'sh test yaratish: forma qiymatlari -> API chaqiruvi */
  create: (values: Record<string, string | number>) => Promise<unknown>
  createFields: CreateField[]
  createHint?: string
  createSubmitLabel?: string
  jsonTemplate: string
  jsonHint: ReactNode
  /** Tahrirlash sahifasi (bo'lsa "Tahrirlash" tugmasi chiqadi) */
  editHref?: (id: string) => string
  downloads?: RowDownload[]
  /** Mavjud testni JSON fayl bilan yangilash (PUT) */
  updateFromJson?: (id: string, file: File) => Promise<unknown>
  /** Testni JSON sifatida yuklab olish */
  exportJson?: (item: T) => unknown
  /** Sarlavhadagi qo'shimcha havolalar (masalan, "Baholash →") */
  headerExtra?: ReactNode
  /** Qatordagi qo'shimcha amallar */
  rowExtra?: (item: T) => ReactNode
  /** Ro'yxat kategoriyalari (tab sifatida ko'rinadi). Masalan: To'liq testlar, Part 1..5 */
  categories?: { key: string; label: string }[]
  /** Har bir element qaysi kategoriyaga tegishli ekanini qaytaradi (categories key'lariga mos) */
  categoryOf?: (item: T) => string
}

const errMsg = (err: unknown, fallback: string) =>
  err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : fallback

const rowBtn =
  'inline-flex h-8 items-center gap-1 rounded-xl border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:bg-muted hover:text-foreground disabled:opacity-40'

export function TestLibrary<T>({ config, below }: { config: TestLibraryConfig<T>; below?: ReactNode }) {
  const c = config
  const { user, isLoading } = useAuth()
  const isAdmin = user?.global_role === 'admin' || user?.global_role === 'super_admin'

  const [items, setItems] = useState<T[] | null>(null)
  const [category, setCategory] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>(() => defaults(c.createFields))
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const importRef = useRef<HTMLInputElement>(null)
  const updateRef = useRef<HTMLInputElement>(null)
  const updateTarget = useRef<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await c.load())
    } catch (err) {
      setItems([])
      setError(errMsg(err, "Ro'yxatni yuklashda xatolik"))
    }
    // c.load har renderda yangi bo'lishi mumkin; faqat isAdmin o'zgarganda yuklaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (isAdmin) void load() }, [isAdmin, load])

  const flash = (m: string) => { setMessage(m); setError(null) }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSaving(true); setError(null); setMessage(null)
    try {
      await c.importJson(file)
      await load()
      setShowForm(false)
      flash(`${c.noun} testi JSON orqali qo'shildi.`)
    } catch (err) {
      setError(errMsg(err, 'JSON importda xatolik'))
    } finally { setSaving(false) }
  }

  async function handleUpdateFromJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const id = updateTarget.current
    e.target.value = ''
    updateTarget.current = null
    if (!file || !id || !c.updateFromJson) return
    setBusy(b => ({ ...b, [`upd-${id}`]: true })); setError(null); setMessage(null)
    try {
      await c.updateFromJson(id, file)
      await load()
      flash(`"${id}" testi JSON orqali yangilandi.`)
    } catch (err) {
      setError(errMsg(err, 'Yangilashda xatolik'))
    } finally { setBusy(b => ({ ...b, [`upd-${id}`]: false })) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setMessage(null)
    try {
      await c.create(form)
      await load()
      setShowForm(false)
      setForm(defaults(c.createFields))
      flash(`${c.noun} testi yaratildi.`)
    } catch (err) {
      setError(errMsg(err, 'Test yaratishda xatolik'))
    } finally { setSaving(false) }
  }

  async function handleRemove(row: LibraryRow) {
    if (!confirm(`"${row.title}" (${row.id}) ${c.noun} testini butunlay o'chirishni tasdiqlaysizmi?`)) return
    setBusy(b => ({ ...b, [row.id]: true })); setError(null)
    try {
      await c.remove(row.id)
      setItems(prev => prev?.filter(t => c.toRow(t).id !== row.id) ?? null)
    } catch (err) {
      setError(errMsg(err, "O'chirishda xatolik"))
    } finally { setBusy(b => ({ ...b, [row.id]: false })) }
  }

  async function handleDownload(d: RowDownload, id: string) {
    const key = `${d.label}-${id}`
    setBusy(b => ({ ...b, [key]: true }))
    await authenticatedDownload(d.url(id), { filename: d.filename(id), onError: setError })
    setBusy(b => ({ ...b, [key]: false }))
  }

  function handleExportJson(item: T) {
    if (!c.exportJson) return
    const row = c.toRow(item)
    const url = URL.createObjectURL(new Blob([JSON.stringify(c.exportJson(item), null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categoryOf = c.categoryOf
  const visibleItems = items && categoryOf && category !== 'all'
    ? items.filter(item => categoryOf(item) === category)
    : items

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="font-semibold">Bu bo&apos;limga faqat administratorlar kira oladi.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
      </div>
    )
  }

  const Icon = c.icon

  return (
    <AdminPageShell
      eyebrow={c.eyebrow ?? 'Testlar'}
      title={c.title}
      description={c.description}
      actions={
        <>
          {c.headerExtra}
          <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
          <AdminButton onClick={() => importRef.current?.click()} disabled={saving}>
            <Upload className="size-4" /> JSON import
          </AdminButton>
          <AdminButton variant="primary" onClick={() => setShowForm(v => !v)}>
            <Plus className="size-4" /> Yangi test
          </AdminButton>
        </>
      }
    >
      <div className="space-y-6">
        {error && <AdminError message={error} />}
        {message && <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm">{message}</p>}

        {showForm && (
          <form onSubmit={handleCreate} className="surface space-y-5 p-6">
            <div>
              <h2 className="font-bold">Yangi {c.noun} test</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.createHint ?? "Bo'sh test yaratadi. To'liq testni JSON import orqali bir martada qo'shish qulayroq."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {c.createFields.map(f => (
                <label key={f.name} className={`block ${f.span === 3 ? 'sm:col-span-3' : f.span === 2 ? 'sm:col-span-2' : ''}`}>
                  <span className="label-xs">{f.label}{f.required ? ' *' : ''}</span>
                  {f.type === 'select' ? (
                    <select value={form[f.name]} onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))} className="field">
                      {f.options?.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      required={f.required}
                      type={f.type}
                      min={f.min}
                      max={f.max}
                      minLength={f.type === 'text' && f.required ? 3 : undefined}
                      value={form[f.name]}
                      placeholder={f.placeholder}
                      onChange={e => setForm(v => ({ ...v, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="field"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <AdminButton onClick={() => setShowForm(false)}>Bekor</AdminButton>
              <AdminButton type="submit" variant="primary" disabled={saving}>
                {saving ? 'Yaratilmoqda...' : c.createSubmitLabel ?? 'Yaratish'}
              </AdminButton>
            </div>
          </form>
        )}

        {c.updateFromJson && (
          <input ref={updateRef} type="file" accept=".json,application/json" className="hidden" onChange={handleUpdateFromJson} />
        )}

        {items !== null && items.length > 0 && c.categories && categoryOf && (
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Kategoriyalar">
            {[{ key: 'all', label: 'Hammasi' }, ...c.categories].map(cat => {
              const count = cat.key === 'all'
                ? items.length
                : items.filter(item => categoryOf(item) === cat.key).length
              const active = category === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(cat.key)}
                  className={`inline-flex h-8 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors ${
                    active ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? 'bg-background/20' : 'bg-muted'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {items === null ? (
          <p className="animate-pulse py-6 text-sm text-muted-foreground">Yuklanmoqda...</p>
        ) : items.length === 0 ? (
          <AdminEmpty
            icon={Icon}
            title={`Hozircha ${c.noun} testlari yo'q`}
            description={`"Yangi test" yoki "JSON import" tugmasini bosing.`}
          />
        ) : visibleItems && visibleItems.length === 0 ? (
          <AdminEmpty icon={Icon} title="Bu kategoriyada test yo'q" description="Boshqa kategoriyani tanlang." />
        ) : (
          <div className="space-y-3">
            {(visibleItems ?? []).map(item => {
              const row = c.toRow(item)
              return (
                <div key={row.id} className="surface flex flex-wrap items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.editHref ? (
                        <Link href={c.editHref(row.id)} className="truncate text-sm font-semibold hover:underline">{row.title}</Link>
                      ) : (
                        <span className="truncate text-sm font-semibold">{row.title}</span>
                      )}
                      {row.isActive === false && (
                        <StatusBadge label="Nofaol" colorClass="border-red-200 bg-red-50 text-red-700" />
                      )}
                      {row.badges?.map(b => (
                        <StatusBadge key={b} label={b} colorClass="border-border bg-muted text-muted-foreground" />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{[row.id, ...row.meta].join(' · ')}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {c.rowExtra?.(item)}
                    {c.downloads?.map(d => (
                      <button key={d.label} onClick={() => handleDownload(d, row.id)} disabled={!!busy[`${d.label}-${row.id}`]}
                        title={d.title ?? d.label} className={rowBtn}>
                        <FileDown className="size-3" /> {d.label}
                      </button>
                    ))}
                    {c.exportJson && (
                      <button onClick={() => handleExportJson(item)} title="JSON yuklab olish" className={rowBtn}>
                        <Download className="size-3" /> JSON
                      </button>
                    )}
                    {c.updateFromJson && (
                      <button
                        onClick={() => { updateTarget.current = row.id; updateRef.current?.click() }}
                        disabled={!!busy[`upd-${row.id}`] || saving}
                        title="JSON fayl bilan yangilash" className={rowBtn}>
                        <Pencil className="size-3" /> Yangilash
                      </button>
                    )}
                    {c.editHref && (
                      <Link href={c.editHref(row.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-border px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary">
                        Tahrirlash <ChevronRight className="size-3" />
                      </Link>
                    )}
                    <button onClick={() => handleRemove(row)} disabled={!!busy[row.id]} title="O'chirish"
                      className="rounded-xl p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {below}

        <div className="surface bg-muted/30 p-5">
          <h2 className="font-semibold">JSON format</h2>
          <div className="mt-2 text-sm text-muted-foreground">{c.jsonHint}</div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background p-4 text-xs">{c.jsonTemplate}</pre>
        </div>
      </div>
    </AdminPageShell>
  )
}

function defaults(fields: CreateField[]): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const f of fields) {
    out[f.name] = f.defaultValue ?? (f.type === 'select' ? f.options?.[0] ?? '' : f.type === 'number' ? f.min ?? 0 : '')
  }
  return out
}
