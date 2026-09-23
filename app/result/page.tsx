"use client"

import { useId, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
} from "lucide-react"
import { motion, MotionConfig, useReducedMotion, type Variants } from "framer-motion"

import { SiteHeader } from "@/components/layout/header"
import { publicApi } from "@/lib/api/endpoints"
import type { VerifiedResult } from "@/lib/api/types"

type SkillKey =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"

type SkillItem = {
  label: string
  short: string
  key: SkillKey
}

const CONTAINER =
  "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"

const EASE = [0.22, 1, 0.36, 1] as const

const SKILLS: readonly SkillItem[] = [
  {
    label: "Listening",
    short: "L",
    key: "listening",
  },
  {
    label: "Reading",
    short: "R",
    key: "reading",
  },
  {
    label: "Writing",
    short: "W",
    key: "writing",
  },
  {
    label: "Speaking",
    short: "S",
    key: "speaking",
  },
]

const STEPS = [
  {
    icon: ScanLine,
    title: "QR tokenni kiriting",
    body: "Natija qaydnomasidagi QR tokenni kiriting.",
  },
  {
    icon: ExternalLink,
    title: "Natijani tekshiring",
    body: "Tizim tasdiqlangan natijani topadi.",
  },
  {
    icon: BadgeCheck,
    title: "CEFR darajangizni ko‘ring",
    body: "4 ta skill va umumiy ball ko‘rsatiladi.",
  },
]

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE,
    },
  },
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* DEMO QR */
/* ─────────────────────────────────────────────────────────────────────────── */

function useDemoQr() {
  return useMemo(() => {
    const size = 15
    const cells: Array<{
      x: number
      y: number
    }> = []

    const finder = (
      x: number,
      y: number,
      ox: number,
      oy: number
    ) => {
      const dx = x - ox
      const dy = y - oy

      if (
        dx < 0 ||
        dy < 0 ||
        dx > 6 ||
        dy > 6
      ) {
        return false
      }

      return (
        dx === 0 ||
        dx === 6 ||
        dy === 0 ||
        dy === 6 ||
        (
          dx >= 2 &&
          dx <= 4 &&
          dy >= 2 &&
          dy <= 4
        )
      )
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const inFinder =
          finder(x, y, 0, 0) ||
          finder(x, y, size - 7, 0) ||
          finder(x, y, 0, size - 7)

        if (inFinder) {
          cells.push({ x, y })
          continue
        }

        if ((x * 11 + y * 7 + x * y) % 5 < 2) {
          cells.push({ x, y })
        }
      }
    }

    return {
      size,
      cells,
    }
  }, [])
}

function DemoQr({
  reduceMotion,
}: {
  reduceMotion: boolean
}) {
  const qr = useDemoQr()

  return (
    <div className="relative size-36 shrink-0 rounded-2xl border border-border bg-background p-3 sm:size-40">
      <svg
        aria-hidden
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        className="size-full text-foreground"
        shapeRendering="crispEdges"
      >
        {qr.cells.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill="currentColor"
          />
        ))}
      </svg>

      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="absolute inset-x-2 h-0.5 rounded-full bg-primary shadow-[0_0_14px_4px_rgba(228,246,10,0.65)]"
          animate={{
            top: ["8%", "90%", "8%"],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* DEMO CARD */
/* ─────────────────────────────────────────────────────────────────────────── */

function DemoCard({
  reduceMotion,
}: {
  reduceMotion: boolean
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative mx-auto w-full max-w-lg lg:mx-0"
    >
      <div
        aria-hidden
        className="absolute -inset-5 rounded-[34px] bg-primary/10 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.3)] sm:p-7">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3.5">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            {!reduceMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}

            <ShieldCheck
              aria-hidden
              className="relative size-5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold">
              Tekshirish namunasi
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Demo ma’lumotlar
            </p>
          </div>

          <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Demo
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <DemoQr
            reduceMotion={reduceMotion}
          />

          <div className="min-w-0 flex-1">
            {[
              ["Talaba", "Alisher Karimov"],
              ["Mock ID", "MK-290706526"],
              ["CEFR", "B2"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-0"
              >
                <span className="text-muted-foreground">
                  {label}
                </span>

                <span className="break-all text-right font-mono text-xs font-bold">
                  {value}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 pt-3 text-sm">
              <span className="text-muted-foreground">
                Holati
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-emerald-500"
                />

                TASDIQLANGAN
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 border-t border-border pt-5">
          {[
            ["L", 68],
            ["R", 71],
            ["W", 64],
            ["S", 69],
          ].map(([skill, score]) => (
            <div
              key={skill}
              className="rounded-xl border border-border/70 bg-muted/60 px-2 py-3 text-center"
            >
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground">
                {skill}
              </p>

              <p className="mt-1 text-base font-bold tabular-nums">
                {score}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SEARCH FORM */
/* ─────────────────────────────────────────────────────────────────────────── */

function SearchForm({
  onResult,
}: {
  onResult: (
    result: VerifiedResult | null
  ) => void
}) {
  const inputId = useId()

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    const clean = token.trim()

    if (!clean) {
      return
    }

    setLoading(true)
    setError("")
    onResult(null)

    try {
      const result =
        await publicApi.resultByQr(clean)

      onResult(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Natija topilmadi"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
    >
      <label
        htmlFor={inputId}
        className="sr-only"
      >
        QR token
      </label>

      <div className="relative">
        <ScanLine
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />

        <input
          id={inputId}
          value={token}
          onChange={(e) => {
            setToken(e.target.value)

            if (error) {
              setError("")
            }
          }}
          disabled={loading}
          placeholder="QR tokenni kiriting (masalan: MK-290706526)"
          className="h-[54px] w-full rounded-2xl border border-border bg-card pl-12 pr-32 font-mono text-sm font-medium outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={
            loading ||
            !token.trim()
          }
          aria-busy={loading}
          className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              aria-hidden
              className="size-4 animate-spin"
            />
          ) : (
            <QrCode
              aria-hidden
              className="size-4"
            />
          )}

          <span className="hidden sm:inline">
            {loading
              ? "Tekshirilmoqda…"
              : "Tekshirish"}
          </span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SCORE HELPERS */
/* ─────────────────────────────────────────────────────────────────────────── */

function skillScore(
  result: VerifiedResult,
  key: SkillKey
): number {
  switch (key) {
    case "listening":
      return Number(
        result.listening?.scaled_score ?? 0
      )

    case "reading":
      return Number(
        result.reading?.scaled_score ?? 0
      )

    case "writing":
      return Number(
        result.writing?.scaled_score ?? 0
      )

    case "speaking":
      return Number(
        result.speaking?.scaled_score ?? 0
      )

    default:
      return 0
  }
}

function scoreTone(score: number) {
  if (score >= 70) {
    return {
      text: "text-emerald-600",
      bar: "bg-emerald-500",
    }
  }

  if (score >= 55) {
    return {
      text: "text-amber-600",
      bar: "bg-amber-400",
    }
  }

  return {
    text: "text-red-500",
    bar: "bg-red-400",
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* RESULT CARD */
/* ─────────────────────────────────────────────────────────────────────────── */

function ResultCard({
  result,
  onReset,
}: {
  result: VerifiedResult
  onReset: () => void
}) {
  const overall = Number(
    result.overall_score ??
      result.overall ??
      0
  )

  const clampedOverall = Math.max(
    0,
    Math.min(90, overall)
  )

  const reduceMotion =
    useReducedMotion() ?? false

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        ease: EASE,
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-2 rounded-full bg-emerald-500"
          />

          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Natija topildi
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            aria-hidden
            className="size-3.5"
          />

          Yangi qidiruv
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_14px_45px_-22px_rgba(0,0,0,0.25)]">
        {/* Result header */}
        <div className="relative overflow-hidden bg-foreground px-6 pb-7 pt-6">
          <div
            aria-hidden
            className="absolute right-[-60px] top-[-60px] size-52 rounded-full bg-primary/20 blur-[80px]"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/60">
                Natija
              </p>

              <p className="mt-1 truncate text-xl font-semibold text-background">
                {result.full_name ||
                  "Abituriyent"}
              </p>

              <p className="mt-0.5 font-mono text-xs text-background/40">
                {result.student_id || "—"}
              </p>
            </div>

            <span className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-xl font-extrabold text-foreground">
              {result.cefr_level || "—"}
            </span>
          </div>

          <div className="relative mt-5 flex items-end gap-3">
            <p className="text-6xl font-bold tracking-[-0.06em] text-background">
              {overall.toFixed(1)}
            </p>

            <p className="mb-2 text-sm text-background/50">
              / 90.0
            </p>
          </div>

          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-background/15">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${
                  (clampedOverall / 90) *
                  100
                }%`,
              }}
              transition={{
                duration:
                  reduceMotion
                    ? 0
                    : 0.9,
                ease: EASE,
              }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>

        {/* Skill scores */}
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {SKILLS.map(
            ({
              label,
              short,
              key,
            }) => {
              const score =
                skillScore(
                  result,
                  key
                )

              const tone =
                scoreTone(score)

              const width = Math.max(
                0,
                Math.min(
                  100,
                  (score / 90) *
                    100
                )
              )

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-border bg-muted/50 p-4"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {short}
                    </span>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </div>

                  <p
                    className={`mt-2 text-2xl font-bold tabular-nums ${tone.text}`}
                  >
                    {score.toFixed(1)}
                  </p>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${width}%`,
                      }}
                      transition={{
                        duration:
                          reduceMotion
                            ? 0
                            : 0.7,
                        ease: EASE,
                      }}
                      className={`h-full rounded-full ${tone.bar}`}
                    />
                  </div>
                </div>
              )
            }
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2
              aria-hidden
              className="size-4 text-emerald-500"
            />

            <span className="text-muted-foreground">
              Holati:
            </span>

            <span className="font-semibold">
              {result.status ||
                "FINALIZED"}
            </span>
          </div>

          {result.result_id != null && (
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              #{String(
                result.result_id
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* PAGE */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function ResultPage() {
  const [result, setResult] =
    useState<VerifiedResult | null>(
      null
    )

  const reduceMotion =
    useReducedMotion() ?? false

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader variant="public" />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden pb-14 pt-28 sm:pb-16 sm:pt-36 lg:pb-24 lg:pt-44">
            <div
              aria-hidden
              className="pointer-events-none absolute right-[-120px] top-[60px] size-[500px] rounded-full bg-primary/[0.06] blur-[120px]"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute -left-[80px] bottom-0 size-[300px] rounded-full bg-primary/[0.04] blur-[100px]"
            />

            <div className={CONTAINER}>
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <motion.div
                  variants={{
                    hidden: {},
                    show: {
                      transition: {
                        staggerChildren:
                          0.08,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="min-w-0 text-center lg:text-left"
                >
                  {/* Eyebrow */}
                  <motion.p
                    variants={fadeUp}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-primary"
                    />

                    Natijani tekshirish
                  </motion.p>

                  {/* Heading */}
                  <motion.h1
                    variants={fadeUp}
                    className="mt-5 text-[clamp(2.1rem,4.8vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.05em]"
                  >
                    Natija ma’lumotlarini{" "}
                    <span className="relative inline-block whitespace-nowrap">
                      tekshiring.

                      <span
                        aria-hidden
                        className="absolute -bottom-1.5 left-0 h-1.5 w-full rounded-full bg-primary sm:h-2"
                      />
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    variants={fadeUp}
                    className="mx-auto mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8 lg:mx-0"
                  >
                    Natija qaydnomasidagi QR
                    tokenni kiriting. Listening,
                    Reading, Writing va Speaking
                    bo‘yicha natijangizni ko‘ring.
                  </motion.p>

                  {/* Steps */}
                  <motion.ol
                    variants={fadeUp}
                    className="mx-auto mt-7 max-w-md space-y-2.5 text-left lg:mx-0"
                  >
                    {STEPS.map(
                      ({
                        icon: Icon,
                        title,
                        body,
                      }, index) => (
                        <li
                          key={title}
                          className="flex items-start gap-3.5 rounded-2xl border border-transparent p-2.5 hover:border-border hover:bg-card/70"
                        >
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                            <Icon
                              aria-hidden
                              className="size-[18px]"
                            />

                            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                              {index + 1}
                            </span>
                          </span>

                          <span>
                            <span className="block text-sm font-bold">
                              {title}
                            </span>

                            <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">
                              {body}
                            </span>
                          </span>
                        </li>
                      )
                    )}
                  </motion.ol>

                  {/* Search */}
                  <motion.div
                    variants={fadeUp}
                    className="mt-7"
                  >
                    <SearchForm
                      onResult={setResult}
                    />
                  </motion.div>

                  {/* Login */}
                  <motion.p
                    variants={fadeUp}
                    className="mt-4 text-center text-xs text-muted-foreground lg:text-left"
                  >
                    Shaxsiy kabinet kerakmi?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-foreground hover:underline"
                    >
                      Kirish{" "}
                      <ArrowRight
                        aria-hidden
                        className="ml-0.5 inline size-3.5"
                      />
                    </Link>
                  </motion.p>
                </motion.div>

                {/* Right demo */}
                <DemoCard
                  reduceMotion={
                    reduceMotion
                  }
                />
              </div>
            </div>
          </section>

          {/* Result */}
          {result && (
            <section className="border-t border-border py-14 sm:py-16">
              <div className={CONTAINER}>
                <div className="mx-auto max-w-2xl">
                  <ResultCard
                    result={result}
                    onReset={() =>
                      setResult(null)
                    }
                  />
                </div>
              </div>
            </section>
          )}

          {/* Info */}
          <section className="border-t border-border bg-card">
            <div
              className={`${CONTAINER} py-10 sm:py-12`}
            >
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  [
                    "01",
                    "QR token nima?",
                    "Natija qaydnomasidagi noyob identifikator.",
                  ],
                  [
                    "02",
                    "Natija qayerdan olinadi?",
                    "Portal tasdiqlangan natijani backenddan yuklaydi.",
                  ],
                  [
                    "03",
                    "Qaysi skilllar?",
                    "Listening, Reading, Writing va Speaking.",
                  ],
                ].map(
                  ([num, title, body]) => (
                    <div
                      key={num}
                      className="flex gap-4 border-l-2 border-primary pl-4"
                    >
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                        {num}
                      </span>

                      <div>
                        <h2 className="text-sm font-semibold">
                          {title}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {body}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </MotionConfig>
  )
}
