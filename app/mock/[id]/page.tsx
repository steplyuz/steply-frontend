"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  ArrowRight, CalendarDays, Clock3, MapPin, RefreshCw,
  Users, Search, SlidersHorizontal, X, TrendingUp,
} from "lucide-react"
import { motion, MotionConfig, AnimatePresence, type Variants } from "framer-motion"

import { publicApi } from "@/lib/api/endpoints"
import type { MockExam } from "@/lib/api/types"
import { SiteHeader } from "@/components/layout/header"

/* ─── Constants ────────────────────────────────────────────────────────────── */

const money = new Intl.NumberFormat("uz-UZ")
const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ")
const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"
const ease = [0.22, 1, 0.36, 1] as const

const CEFR_LEVELS = ["Barchasi", "A1", "A2", "B1", "B2", "C1", "C2"]

const reveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function formatDate(value: string) {
  if (!value) return "Sana belgilanmagan"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return date.toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return value
  }
}

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "Bepul"
  return `${money.format(price)} UZS`
}

/* ─── Session info row ──────────────────────────────────────────────────────── */

function SessionInfo({ icon: Icon, children }: { icon: typeof CalendarDays; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
      <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

function MockSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="h-44 animate-pulse bg-muted" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-muted" />
        <div className="mt-5 space-y-2.5 border-t border-border pt-5">
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-5 flex justify-between">
          <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}

/* ─── Exam card ─────────────────────────────────────────────────────────────── */

function MockCard({ exam }: { exam: MockExam }) {
  const next = exam.sessions?.[0]
  const seatsLeft = next?.available_seats
  const isFull = seatsLeft === 0
  const isLow = seatsLeft != null && seatsLeft > 0 && seatsLeft <= 5

  return (
    <motion.article
      variants={reveal}
      layout
      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_60px_rgba(21,21,21,0.08)]"
    >
      {/* Card header */}
      <div className="relative overflow-hidden bg-muted px-6 pb-6 pt-5">
        {/* Glow */}
        <div
          aria-hidden
          className="absolute right-[-40px] top-[-40px] size-32 rounded-full bg-primary/25 blur-[60px] transition-transform duration-700 group-hover:scale-150"
        />
        {/* Second glow */}
        <div
          aria-hidden
          className="absolute -bottom-6 left-10 size-20 rounded-full bg-primary/10 blur-2xl"
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {exam.cefr_level || "Mock"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-card/80 px-3 py-1 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">
            <Clock3 aria-hidden className="size-3" />
            {exam.duration_minutes} daqiqa
          </span>
        </div>

        <div className="relative mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mock imtihon
          </p>
          <h3 className="mt-2 line-clamp-2 min-h-[54px] text-[18px] font-semibold leading-[1.35] tracking-[-0.03em]">
            {exam.title}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-6">
        <p className="line-clamp-2 min-h-[44px] text-sm leading-6 text-muted-foreground">
          {exam.description || "To'liq mock imtihon — barcha 4 skill."}
        </p>

        {/* Session info */}
        <div className="mt-5 space-y-2.5 border-t border-border pt-5">
          {next ? (
            <>
              <SessionInfo icon={CalendarDays}>{formatDate(next.exam_date)}</SessionInfo>
              <SessionInfo icon={MapPin}>
                {next.center_name || next.location_address || "Manzil ko'rsatilmagan"}
              </SessionInfo>
              <SessionInfo icon={Users}>
                {seatsLeft == null ? (
                  "Joylar cheklanmagan"
                ) : isFull ? (
                  <span className="font-semibold text-red-500">Joylar tugagan</span>
                ) : isLow ? (
                  <span className="font-semibold text-amber-600">
                    Faqat {seatsLeft} ta joy qoldi!
                  </span>
                ) : (
                  `${seatsLeft} ta joy mavjud`
                )}
              </SessionInfo>
            </>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Sessiya sanasi hali belgilanmagan
            </p>
          )}
        </div>

        {/* Seats progress bar */}
        {next && seatsLeft != null && next.capacity != null && next.capacity > 0 && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isFull ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, ((next.capacity - seatsLeft) / next.capacity) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div className="mt-5 flex items-end justify-between gap-4 pt-1">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Narxi
            </p>
            <p className="mt-0.5 text-[17px] font-bold tracking-[-0.02em]">
              {formatPrice(exam.price)}
            </p>
          </div>

          <Link
            href={`/mock/${exam.id}`}
            className={cn(
              "group/btn inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isFull
                ? "bg-muted text-muted-foreground"
                : "bg-foreground text-background hover:-translate-y-0.5 hover:bg-foreground/90"
            )}
          >
            {isFull ? "To'liq" : "Batafsil"}
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full transition-transform duration-300 group-hover/btn:translate-x-0.5",
                isFull ? "bg-muted-foreground/20 text-muted-foreground" : "bg-primary text-foreground"
              )}
            >
              <ArrowRight aria-hidden className="size-3" />
            </span>
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function MockCatalogPage() {
  const [exams, setExams] = useState<MockExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasMounted, setHasMounted] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [activeLevel, setActiveLevel] = useState("Barchasi")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await publicApi.mockExams()
      setExams(Array.isArray(response) ? response : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mock imtihonlarni yuklab bo'lmadi.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Filtered list
  const filtered = exams.filter((exam) => {
    const matchSearch =
      search === "" ||
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.description?.toLowerCase().includes(search.toLowerCase())
    const matchLevel =
      activeLevel === "Barchasi" || exam.cefr_level === activeLevel
    return matchSearch && matchLevel
  })

  const entranceInitial = hasMounted ? "hidden" : false
  const entranceAnimate = hasMounted ? "visible" : undefined

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader variant="public" />

        <main>
          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden pb-14 pt-28 sm:pb-16 sm:pt-36 lg:pb-24 lg:pt-44">
            {/* Atmosphere blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-[-120px] top-[60px] size-[500px] rounded-full bg-primary/[0.06] blur-[120px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[80px] bottom-0 size-[300px] rounded-full bg-primary/[0.04] blur-[100px]"
            />

            <div className={`${container} relative`}>
              <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
                <motion.div
                  variants={stagger}
                  initial={entranceInitial}
                  animate={entranceAnimate}
                >
                  {/* Eyebrow */}
                  <motion.div
                    variants={reveal}
                    className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase shadow-sm"
                  >
                    <TrendingUp aria-hidden className="size-3.5 text-primary" />
                    Mock Center
                  </motion.div>

                  {/* Heading */}
                  <motion.h1
                    variants={reveal}
                    className="mt-6 max-w-3xl text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.0] tracking-[-0.055em]"
                  >
                    Haqiqiy imtihon
                    <br />
                    <span className="relative inline-block">
                      formatida o&apos;zingizni{" "}
                      <span className="relative whitespace-nowrap">
                        sinang.
                        <span
                          aria-hidden
                          className="absolute -bottom-1.5 left-0 h-[6px] w-full rounded-full bg-primary sm:h-2"
                        />
                      </span>
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    variants={reveal}
                    className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8"
                  >
                    Qog&apos;ozdagi Reading, Listening, Writing va kompyuterdagi Speaking.
                    Ochiq sanani tanlang va mock imtihonga oldindan joy band qiling.
                  </motion.p>

                  {/* CTA pills */}
                  <motion.div variants={reveal} className="mt-8 flex flex-wrap items-center gap-3">

                    <a href="#catalog"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:bg-foreground/90"
                    >
                      Mock ko&apos;rish
                      <ArrowRight aria-hidden className="size-4" />
                    </a>

                    <a href="#how-it-works"
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-all hover:border-border-strong"
                    >
                      Qanday ishlaydi?
                    </a>
                  </motion.div>
                </motion.div>

                {/* Hero stats */}
                <motion.div
                  initial={hasMounted ? { opacity: 0, y: 15 } : false}
                  animate={hasMounted ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.6, delay: 0.25, ease }}
                  className="hidden lg:grid lg:grid-cols-2 lg:gap-px"
                >
                  {[
                    { value: loading ? "—" : String(exams.length), label: "ochiq mock" },
                    { value: "4", label: "skill sinovi" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center border border-border bg-card/60 px-8 py-6 backdrop-blur-sm first:rounded-l-2xl last:rounded-r-2xl"
                    >
                      <span className="text-4xl font-semibold tracking-[-0.05em]">
                        {stat.value}
                      </span>
                      <span className="mt-1 text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Catalog toolbar ─────────────────────────────────────────────── */}
          <section id="catalog" className="sticky top-0 z-20 border-y border-border bg-background/95 backdrop-blur-md">
            <div className={`${container} py-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">

                {/* Search */}
                <div className="relative flex-1">
                  <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Mock nomi yoki daraja bo'yicha qidirish…"
                    className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-border-strong focus:ring-2 focus:ring-primary/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X aria-hidden className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Level filter — desktop */}
                <div className="hidden items-center gap-1.5 sm:flex">
                  {CEFR_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActiveLevel(level)}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-xs font-semibold transition-all",
                        activeLevel === level
                          ? "bg-foreground text-background"
                          : "border border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* Filter toggle — mobile */}
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 self-start rounded-full border px-4 text-xs font-semibold transition-all sm:hidden",
                    showFilters
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground"
                  )}
                >
                  <SlidersHorizontal aria-hidden className="size-3.5" />
                  Daraja
                  {activeLevel !== "Barchasi" && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-foreground">
                      1
                    </span>
                  )}
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="group hidden h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground transition-all hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                >
                  <RefreshCw
                    aria-hidden
                    className={cn(
                      "size-3.5",
                      loading ? "animate-spin" : "transition-transform duration-300 group-hover:rotate-180"
                    )}
                  />
                  Yangilash
                </button>
              </div>

              {/* Mobile filter pills */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 pt-3 sm:hidden">
                      {CEFR_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => { setActiveLevel(level); setShowFilters(false) }}
                          className={cn(
                            "h-8 rounded-full px-3.5 text-xs font-semibold transition-all",
                            activeLevel === level
                              ? "bg-foreground text-background"
                              : "border border-border bg-card text-muted-foreground"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result count */}
              {!loading && !error && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filtered.length === 0
                      ? "Natija topilmadi"
                      : `${filtered.length} ta mock imtihon`}
                  </p>
                  {(search || activeLevel !== "Barchasi") && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setActiveLevel("Barchasi") }}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Filterni tozalash
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Catalog grid ────────────────────────────────────────────────── */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className={container}>

              {/* Error */}
              {error && (
                <motion.div
                  variants={fadeUp} initial="hidden" animate="visible"
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-6"
                >
                  <p className="font-semibold text-red-800">Yuklashda xatolik</p>
                  <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-red-800 px-4 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <RefreshCw aria-hidden className="size-3.5" />
                    Qayta urinish
                  </button>
                </motion.div>
              )}

              {/* Loading skeletons */}
              {loading && !error && (
                <div
                  className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                  aria-busy="true"
                  aria-label="Yuklanmoqda"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => <MockSkeleton key={i} />)}
                </div>
              )}

              {/* Empty */}
              {!loading && !error && filtered.length === 0 && (
                <motion.div
                  variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-[28px] border border-border bg-card px-6 py-20 text-center sm:px-10"
                >
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <CalendarDays aria-hidden className="size-6 text-muted-foreground" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em]">
                    {search || activeLevel !== "Barchasi"
                      ? "Qidiruv bo'yicha natija topilmadi"
                      : "Hozircha ochiq mock yo'q"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {search || activeLevel !== "Barchasi"
                      ? "Boshqa kalit so'z yoki daraja bilan urinib ko'ring."
                      : "Yangi mock imtihonlar ochilganda ular shu yerda ko'rinadi."}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    {(search || activeLevel !== "Barchasi") && (
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setActiveLevel("Barchasi") }}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-5 text-xs font-semibold text-foreground hover:border-border-strong"
                      >
                        <X aria-hidden className="size-3.5" />
                        Filterni tozalash
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void load()}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-semibold text-background"
                    >
                      <RefreshCw aria-hidden className="size-3.5" />
                      Yangilash
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Cards */}
              {!loading && !error && filtered.length > 0 && (
                <motion.div
                  variants={stagger}
                  initial={entranceInitial}
                  animate={entranceAnimate}
                  className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                >
                  {filtered.map((exam) => (
                    <MockCard key={exam.id} exam={exam} />
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          {/* ── How it works ────────────────────────────────────────────────── */}
          <section id="how-it-works" className="border-t border-border bg-card">
            <div className={`${container} py-14 sm:py-16`}>
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Jarayon
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                    Qanday ishlaydi?
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: "01",
                    title: "Mock tanlang",
                    desc: "Darajangizga mos mock imtihonni toping va batafsil ma'lumotni o'qing.",
                  },
                  {
                    step: "02",
                    title: "Joy band qiling",
                    desc: "Qulay sanani tanlang va to'lovni amalga oshiring.",
                  },
                  {
                    step: "03",
                    title: "Imtihon toping",
                    desc: "Belgilangan kunda markazga boring — 4 skill sinovidan o'ting.",
                  },
                  {
                    step: "04",
                    title: "Natijani oling",
                    desc: "Batafsil ball va tavsiyalar bilan keyingi qadamni belgilang.",
                  },
                ].map((item) => (
                  <div key={item.step} className="relative pl-5">
                    <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-primary" />
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                      {item.step}
                    </span>
                    <h3 className="mt-2 text-[15px] font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Skills strip */}
              <div className="mt-12 grid gap-4 rounded-2xl border border-border bg-background p-6 sm:grid-cols-4">
                {["Reading", "Listening", "Writing", "Speaking"].map((skill, i) => (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main >
      </div >
    </MotionConfig >
  )
}
