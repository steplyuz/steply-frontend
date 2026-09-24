"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react"
import { speakingApi } from "@/lib/api"
import type { SpeakingTest, SpeakingTestCreateInput } from "@/lib/api/types"

/* ─── ImageUploader ────────────────────────────────────────────────── */
function ImageUploader({
  label,
  images,
  onChange,
}: {
  label: string
  images: { src: string; alt: string }[]
  onChange: (imgs: { src: string; alt: string }[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [altDraft, setAltDraft] = useState("")

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        onChange([...images, { src, alt: altDraft || file.name }])
        setAltDraft("")
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-20 w-28 rounded-md border object-cover" />
              <button
                onClick={() => remove(i)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white"
              >
                <X className="size-3" />
              </button>
              <p className="mt-0.5 truncate text-center text-[10px] text-muted-foreground w-28">{img.alt}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={altDraft}
          onChange={(e) => setAltDraft(e.target.value)}
          placeholder="Rasm tavsifi (alt)"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <Upload className="size-3.5" /> Rasm yuklash
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

/* ─── Field ─────────────────────────────────────────────────────────── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const cls =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  )
}

/* ─── Section ────────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t p-4 space-y-4">{children}</div>}
    </div>
  )
}

/* ─── Blank form ─────────────────────────────────────────────────────── */
function blankForm() {
  return {
    title: "",
    part11: { q1: "", q2: "", q3: "" },
    part12: {
      intro:
        "Now, I'm going to ask you to compare two pictures and I will ask you two questions about them. Look at the photographs.",
      images: [] as { src: string; alt: string }[],
      q4: "",
      q5: "",
      q6: "",
    },
    part2: { images: [] as { src: string; alt: string }[], q1: "", q2: "", q3: "" },
    part3: { statement: "", forPoints: ["", ""], againstPoints: ["", ""] },
  }
}

type FormState = ReturnType<typeof blankForm>

/* ─── TestCreateForm ─────────────────────────────────────────────────── */
function TestCreateForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<FormState>(blankForm())
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const setPart = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const set11 = (key: keyof FormState["part11"], val: string) =>
    setForm((f) => ({ ...f, part11: { ...f.part11, [key]: val } }))

  const set12 = (key: keyof Omit<FormState["part12"], "images">, val: string) =>
    setForm((f) => ({ ...f, part12: { ...f.part12, [key]: val } }))

  const set2 = (key: keyof Omit<FormState["part2"], "images">, val: string) =>
    setForm((f) => ({ ...f, part2: { ...f.part2, [key]: val } }))

  const set3 = (key: keyof FormState["part3"], val: string | string[]) =>
    setForm((f) => ({ ...f, part3: { ...f.part3, [key]: val } }))

  const setForPoint = (i: number, val: string) => {
    const arr = [...form.part3.forPoints]; arr[i] = val; set3("forPoints", arr)
  }
  const setAgainstPoint = (i: number, val: string) => {
    const arr = [...form.part3.againstPoints]; arr[i] = val; set3("againstPoints", arr)
  }
  const addForPoint = () => set3("forPoints", [...form.part3.forPoints, ""])
  const addAgainstPoint = () => set3("againstPoints", [...form.part3.againstPoints, ""])
  const removeForPoint = (i: number) => set3("forPoints", form.part3.forPoints.filter((_, idx) => idx !== i))
  const removeAgainstPoint = (i: number) => set3("againstPoints", form.part3.againstPoints.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    const { title, part11, part12, part2, part3 } = form
    if (!title.trim()) return setError("Test nomini kiriting")
    if (!part11.q1.trim() || !part11.q2.trim() || !part11.q3.trim())
      return setError("Part 1.1 — 3 ta savol kiritilishi shart")
    if (!part12.q4.trim() || !part12.q5.trim() || !part12.q6.trim())
      return setError("Part 1.2 — 3 ta savol kiritilishi shart")
    if (!part2.q1.trim() || !part2.q2.trim() || !part2.q3.trim())
      return setError("Part 2 — 3 ta savol kiritilishi shart")
    if (!part3.statement.trim()) return setError("Part 3 — mavzu kiritilishi shart")
    if (part3.forPoints.filter((p) => p.trim()).length < 2)
      return setError("Part 3 — kamida 2 ta FOR nuqta kiritilishi shart")
    if (part3.againstPoints.filter((p) => p.trim()).length < 2)
      return setError("Part 3 — kamida 2 ta AGAINST nuqta kiritilishi shart")

    setSaving(true)
    setError("")

    // Part 1.2 rasmlarini URL sifatida joylash (base64 yoki path)
    const img1 = part12.images[0]?.src ?? ""
    const img2 = part12.images[1]?.src ?? ""
    const img2url = part2.images[0]?.src ?? ""

    const payload: SpeakingTestCreateInput = {
      title: title.trim(),
      is_active: true,
      part_1_1: {
        question_1: part11.q1.trim(),
        question_2: part11.q2.trim(),
        question_3: part11.q3.trim(),
        prep_seconds: 0,
        answer_seconds: 30,
      },
      part_1_2: {
        image_1_url: img1,
        image_2_url: img2,
        question_describe: part12.q4.trim(),
        question_2: part12.q5.trim(),
        question_3: part12.q6.trim(),
        prep_seconds: 0,
        describe_answer_seconds: 45,
        answer_seconds: 30,
      },
      part_2: {
        image_url: img2url,
        question_1: part2.q1.trim(),
        question_2: part2.q2.trim(),
        question_3: part2.q3.trim(),
        prep_seconds: 60,
        answer_seconds: 120,
      },
      part_3: {
        topic: part3.statement.trim(),
        for_points: part3.forPoints.map((p) => p.trim()).filter(Boolean),
        against_points: part3.againstPoints.map((p) => p.trim()).filter(Boolean),
        prep_seconds: 60,
        answer_seconds: 120,
      },
    }

    try {
      await speakingApi.create(payload)
      setForm(blankForm())
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? "Test yaratishda xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <Field
        label="Test nomi (admin uchun)"
        value={form.title}
        onChange={(v) => setPart("title", v as any)}
        placeholder="Masalan: 2024-01-15 guruh A"
      />

      <Section title="Part 1.1 — 3 ta savol (ketma-ket)">
        <Field label="1-savol" value={form.part11.q1} onChange={(v) => set11("q1", v)} placeholder="What is your favourite food?" />
        <Field label="2-savol" value={form.part11.q2} onChange={(v) => set11("q2", v)} placeholder="Do you go to bed early or late?" />
        <Field label="3-savol" value={form.part11.q3} onChange={(v) => set11("q3", v)} placeholder="How often do you go to a cinema?" />
      </Section>

      <Section title="Part 1.2 — Foto-set + 3 savol">
        <Field label="Kirish matni (intro)" value={form.part12.intro} onChange={(v) => set12("intro", v)} rows={2} />
        <ImageUploader
          label="Rasmlar (2 ta — image_1_url, image_2_url)"
          images={form.part12.images}
          onChange={(imgs) => setForm((f) => ({ ...f, part12: { ...f.part12, images: imgs } }))}
        />
        <Field label="Savol 4 (tasvirlash)" value={form.part12.q4} onChange={(v) => set12("q4", v)} placeholder="What do you see in these pictures?" />
        <Field label="Savol 5" value={form.part12.q5} onChange={(v) => set12("q5", v)} placeholder="What are some advantages of walking over driving?" />
        <Field label="Savol 6" value={form.part12.q6} onChange={(v) => set12("q6", v)} placeholder="Why do some people prefer having a car of their own?" />
      </Section>

      <Section title="Part 2 — Rasm + 3 savol">
        <ImageUploader
          label="Rasm (1 ta — image_url)"
          images={form.part2.images}
          onChange={(imgs) => setForm((f) => ({ ...f, part2: { ...f.part2, images: imgs } }))}
        />
        <Field label="Savol 1" value={form.part2.q1} onChange={(v) => set2("q1", v)} placeholder="Tell me about a critical decision you have made." />
        <Field label="Savol 2" value={form.part2.q2} onChange={(v) => set2("q2", v)} placeholder="How has this decision influenced you and your life?" />
        <Field label="Savol 3" value={form.part2.q3} onChange={(v) => set2("q3", v)} placeholder="What factors have the highest impact on decisions?" />
      </Section>

      <Section title="Part 3 — For/Against mavzu">
        <Field
          label="Mavzu (topic)"
          value={form.part3.statement}
          onChange={(v) => set3("statement", v)}
          placeholder="Citizens should be allowed to carry personal guns."
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">FOR nuqtalar</p>
            {form.part3.forPoints.map((p, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={p}
                  onChange={(e) => setForPoint(i, e.target.value)}
                  placeholder={`${i + 1}-nuqta`}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                />
                {form.part3.forPoints.length > 2 && (
                  <button onClick={() => removeForPoint(i)} className="text-red-400 hover:text-red-600">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addForPoint} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800">
              <Plus className="size-3.5" /> Nuqta qo'shish
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">AGAINST nuqtalar</p>
            {form.part3.againstPoints.map((p, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={p}
                  onChange={(e) => setAgainstPoint(i, e.target.value)}
                  placeholder={`${i + 1}-nuqta`}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
                {form.part3.againstPoints.length > 2 && (
                  <button onClick={() => removeAgainstPoint(i)} className="text-red-400 hover:text-red-600">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addAgainstPoint} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <Plus className="size-3.5" /> Nuqta qo'shish
            </button>
          </div>
        </div>
      </Section>

      <button
        onClick={handleCreate}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {saving ? "Yaratilmoqda..." : "Test yaratish"}
      </button>
    </div>
  )
}

/* ─── TestCard ───────────────────────────────────────────────────────── */
function TestCard({ test, onDelete }: { test: SpeakingTest; onDelete: () => void }) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const url =
    typeof window !== "undefined"
      ? `${process.env.NEXT_PUBLIC_SPEAKING_URL || window.location.origin + "/speaking"}?id=${test.id}`
      : `${process.env.NEXT_PUBLIC_SPEAKING_URL || "/speaking"}?id=${test.id}`

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDelete = async () => {
    if (!confirm("Bu testni o'chirishni tasdiqlaysizmi?")) return
    setDeleting(true)
    try {
      await speakingApi.remove(test.id)
      onDelete()
    } catch (err: any) {
      alert(err?.message ?? "O'chirishda xatolik")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{test.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ID: <code className="font-mono">{test.id}</code> ·{" "}
            {new Date(test.created_at).toLocaleDateString("uz-UZ")}
            {!test.is_active && <span className="ml-1.5 text-red-500">· Nofaol</span>}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 text-red-400 hover:text-red-600 disabled:opacity-40"
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className="font-medium text-foreground">1.1</span> ·{" "}
          {(test.part_1_1?.question_1 ?? "—").slice(0, 32)}…
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className="font-medium text-foreground">1.2</span> ·{" "}
          {(test.part_1_2?.question_describe ?? "—").slice(0, 32)}…
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className="font-medium text-foreground">P2</span> ·{" "}
          {(test.part_2?.question_1 ?? "—").slice(0, 32)}…
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className="font-medium text-foreground">P3</span> ·{" "}
          {(test.part_3?.topic ?? "—").slice(0, 32)}…
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={copyLink}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold hover:bg-muted"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Nusxalandi!" : "Havolani nusxalash"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          <ExternalLink className="size-3.5" /> Ko'rish
        </a>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export function SpeakingTestsAdmin() {
  const [tests, setTests] = useState<SpeakingTest[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    try {
      const data = await speakingApi.adminList()
      // listTests returns SpeakingTestSummary[], cast is safe since fields overlap
      setTests(data as unknown as SpeakingTest[])
    } catch (err: any) {
      setError(err?.message ?? "Testlarni yuklashda xatolik")
      setTests([])
    }
  }

  useEffect(() => { reload() }, [])

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container-shell flex items-center justify-between py-3">
          <Link
            href="/admin/speaking/assessments"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Orqaga
          </Link>
          <span className="text-sm font-semibold">Speaking — Testlar</span>
        </div>
      </header>

      <div className="container-shell max-w-3xl space-y-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Ro'yxat */}
        {tests === null ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Yuklanmoqda...
          </div>
        ) : tests.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Hozircha test yaratilmagan. Quyidan yangi test qo'shing.
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <TestCard key={test.id} test={test} onDelete={reload} />
            ))}
          </div>
        )}

        {/* Form toggler */}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          {showForm ? (
            <><ChevronUp className="size-4" /> Bekor qilish</>
          ) : (
            <><Plus className="size-4" /> Yangi test yaratish</>
          )}
        </button>

        {showForm && (
          <TestCreateForm
            onCreated={() => {
              reload()
              setShowForm(false)
            }}
          />
        )}
      </div>
    </main>
  )
}
