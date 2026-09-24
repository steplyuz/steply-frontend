"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2,
  Clock3, MapPin, Users, AlertCircle, RefreshCw, Loader2,
} from "lucide-react"
import { motion, MotionConfig } from "framer-motion"

import { SiteHeader } from "@/components/layout/header"
import { publicApi } from "@/lib/api"
import type { PublicExamDetail } from "@/lib/api/types"

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const money = new Intl.NumberFormat("uz-UZ")
const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ")
const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"
const ease = [0.22, 1, 0.36, 1] as const

function formatDate(value: string) {
  if (!value) return "Sana belgilanmagan"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  try { return d.toLocaleString("uz-UZ", { dateStyle: "long", timeStyle: "short" }) }
  catch { return value }
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div className="flex gap-2">
          <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-12 w-3/4 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
      <div className="h-[480px] animate-pulse rounded-[24px] bg-muted" />
    </div>
  )
}

/* ─── Skill card ────────────────────────────────────────────────────────────── */

const SKILLS = [
  { name: "Reading", format: "Qog'oz asosida", index: "01" },
  { name: "Listening", format: "Qog'oz asosida", index: "02" },
  { name: "Writing", format: "Qog'oz asosida", index: "03" },
  { name: "Speaking", format: "Kompyuter asosida", index: "04" },
]

function SkillCard({ name, format, index }: { name: string; format: string; index: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-border-strong hover:shadow-[0_8px_24px_rgba(21,21,21,0.06)]">
      <div
        aria-hidden
        className="absolute right-[-20px] top-[-20px] size-20 rounded-full bg-primary/15 blur-2xl transition-transform duration-500 group-hover:scale-150"
      />
      <div className="flex items-start justify-between">
        <CheckCircle2 className="size-5 text-primary" aria-hidden />
        <span className="font-mono text-[10px] font-semibold text-muted-foreground">{index}</span>
      </div>
      <p className="mt-4 text-[15px] font-semibold">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{format}</p>
    </div>
  )
}

/* ─── Session card ──────────────────────────────────────────────────────────── */

function SessionCard({ session, examId }: {
  session: PublicExamDetail["sessions"][number]
  examId: string
}) {
  const seats = session.available_seats
  const isFull = session.is_full || seats === 0
  const isLow = !isFull && seats != null && seats <= 5

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200",
      isFull
        ? "border-border bg-muted/40 opacity-70"
        : "border-border bg-card hover:border-border-strong hover:shadow-[0_8px_24px_rgba(21,21,21,0.06)]"
    )}>
      {!isFull && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-30px] top-[-30px] size-24 rounded-full bg-primary/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      )}

      {/* Date & location */}
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays aria-hidden className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-snug">
            {formatDate(session.exam_date)}
          </p>
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span className="break-words">
              {session.center_name || session.location_address || "Manzil ko'rsatilmagan"}
            </span>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Users aria-hidden className="size-3.5 text-muted-foreground" />
          {seats == null ? (
            <span className="text-muted-foreground">Joylar cheklanmagan</span>
          ) : isFull ? (
            <span className="text-red-500 font-semibold">Joy qolmagan</span>
          ) : isLow ? (
            <span className="text-amber-600 font-semibold">Faqat {seats} ta joy!</span>
          ) : (
            <span className="text-muted-foreground">{seats} ta joy mavjud</span>
          )}
        </div>

        {/* Seats bar */}
        {seats != null && session.capacity != null && session.capacity > 0 && (
          <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                isFull ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-primary"
              )}
              style={{
                width: `${Math.min(100, ((session.capacity - seats) / session.capacity) * 100)}%`
              }}
            />
          </div>
        )}
      </div>

      {/* CTA */}
      {!isFull ? (
        <Link
          href={`/mock/${examId}/register?session=${session.id}`}
          className="group/btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Ro&apos;yxatdan o&apos;tish
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-foreground transition-transform duration-300 group-hover/btn:translate-x-0.5">
            <ArrowRight aria-hidden className="size-3" />
          </span>
        </Link>
      ) : (
        <div className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-muted text-xs font-semibold text-muted-foreground">
          Ro&apos;yxat yopiq
        </div>
      )}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function MockDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [exam, setExam] = useState<PublicExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    publicApi
      .mockExam(id)
      .then(setExam)
      .catch((e) => setError(e instanceof Error ? e.message : "Imtihon topilmadi"))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader variant="public" />

        <main>
          {/* ── Breadcrumb bar ─────────────────────────────────────────────── */}
          <div className="border-b border-border bg-card">
            <div className={`${container} py-4`}>
              <Link
                href="/mock"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft aria-hidden className="size-4" />
                Mock imtihonlar
              </Link>
            </div>
          </div>

          <div className={`${container} pb-20 pt-10`}>

            {/* Loading */}
            {loading && <DetailSkeleton />}

            {/* Error */}
            {!loading && error && !exam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
                role="alert"
              >
                <AlertCircle className="mx-auto size-10 text-red-400" aria-hidden />
                <h1 className="mt-4 text-xl font-semibold text-red-800">
                  Imtihon topilmadi
                </h1>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true)
                      setError("")
                      publicApi.mockExam(id).then(setExam).catch((e) => setError(e.message)).finally(() => setLoading(false))
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-red-300 bg-white px-5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw aria-hidden className="size-3.5" />
                    Qayta urinish
                  </button>
                  <Link
                    href="/mock"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-semibold text-background"
                  >
                    <ArrowLeft aria-hidden className="size-3.5" />
                    Mocklarga qaytish
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Content */}
            {!loading && exam && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start"
              >
                {/* ── Left: exam info ──────────────────────────────────────── */}
                <section>
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-foreground px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      {exam.cefr_level || "Mock"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Clock3 aria-hidden className="size-3" />
                      {exam.duration_minutes} daqiqa
                    </span>
                    {exam.sessions.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold text-primary">
                        <CalendarDays aria-hidden className="size-3" />
                        {exam.sessions.length} ta ochiq sana
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
                    {exam.title}
                  </h1>

                  {/* Description */}
                  <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                    {exam.description || "Mock imtihon barcha 4 skill bo'yicha o'tkaziladi. Haqiqiy imtihonga yaqin sharoitda o'zingizni sinab ko'ring."}
                  </p>

                  {/* Divider */}
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Sinov tarkibi
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Skills grid */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {SKILLS.map((s) => (
                      <SkillCard key={s.name} {...s} />
                    ))}
                  </div>

                  {/* Price — mobile only */}
                  <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-5 lg:hidden">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Imtihon narxi
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-[-0.03em]">
                        {exam.price > 0 ? `${money.format(exam.price)} UZS` : "Bepul"}
                      </p>
                    </div>
                    {exam.sessions.length > 0 && (

                      <a href="#sessions"
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-semibold text-background"
                      >
                        Sana tanlash
                        <ArrowRight aria-hidden className="size-3.5" />
                      </a>
                    )}
                  </div>
                </section>

                {/* ── Right: sticky sidebar ────────────────────────────────── */}
                <aside id="sessions" className="lg:sticky lg:top-6">
                  <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_8px_32px_rgba(21,21,21,0.06)]">

                    {/* Sidebar header */}
                    <div className="relative overflow-hidden border-b border-border bg-muted px-6 pb-5 pt-6">
                      <div
                        aria-hidden
                        className="absolute right-[-40px] top-[-40px] size-32 rounded-full bg-primary/20 blur-[60px]"
                      />
                      <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Imtihon narxi
                      </p>
                      <p className="relative mt-1 text-3xl font-bold tracking-[-0.04em]">
                        {exam.price > 0 ? `${money.format(exam.price)} UZS` : "Bepul"}
                      </p>
                      <p className="relative mt-1.5 text-xs text-muted-foreground">
                        Barcha 4 skill • {exam.duration_minutes} daqiqa
                      </p>
                    </div>

                    {/* Sessions list */}
                    <div className="p-4">
                      <p className="mb-3 px-1 text-sm font-semibold">Sana tanlang</p>

                      {exam.sessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                          <CalendarDays aria-hidden className="mx-auto size-8 text-muted-foreground/50" />
                          <p className="mt-3 text-sm font-medium">Hozircha ochiq sana yo&apos;q</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Yangi sanalar qo&apos;shilganda shu yerda ko&apos;rinadi.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {exam.sessions.map((s) => (
                            <SessionCard key={s.id} session={s} examId={exam.id} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer note */}
                    <div className="border-t border-border px-5 py-4">
                      <p className="text-center text-[11px] leading-5 text-muted-foreground">
                        Ro&apos;yxatdan o&apos;tgach, tasdiqlash SMS orqali yuboriladi.
                      </p>
                    </div>
                  </div>
                </aside>
              </motion.div>
            )}
          </div>
        </main>
      </div >
    </MotionConfig >
  )
}
