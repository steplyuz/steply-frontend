"use client"

import { FormEvent, useId, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    ArrowRight, BadgeCheck, CheckCircle2, ExternalLink,
    Loader2, QrCode, RefreshCw, ScanLine, ShieldCheck, AlertCircle,
} from "lucide-react"
import {
    motion, MotionConfig, useMotionTemplate, useMotionValue,
    useReducedMotion, useSpring, type Variants,
} from "framer-motion"

import { SiteHeader } from "@/components/layout/header"
import { publicApi } from "@/lib/api/endpoints"

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const cnt = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"
const ease = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}
const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
}
const viewportOnce = { once: true, margin: "-60px" }

const SKILLS = [
    { label: "Listening", key: "listening", short: "L" },
    { label: "Reading", key: "reading", short: "R" },
    { label: "Writing", key: "writing", short: "W" },
    { label: "Speaking", key: "speaking", short: "S" },
]

const HOW_STEPS = [
    { icon: ScanLine, title: "QR tokenni kiriting", body: "Natija qaydnomasidagi QR tokenni quyidagi maydonga kiriting." },
    { icon: ExternalLink, title: "Natija yuklanadi", body: "Bir zumda barcha 4 ko'nikma bo'yicha ballaringiz ko'rinadi." },
    { icon: BadgeCheck, title: "CEFR darajangiz", body: "Umumiy ball va CEFR darajangizni tasdiqlangan holda ko'ring." },
]

/* ─── Decorative QR ─────────────────────────────────────────────────────────── */

const QR_SIZE = 13

function useQrCells() {
    return useMemo(() => {
        const cells: { x: number; y: number }[] = []
        const inFinder = (r: number, c: number) =>
            (r < 5 && c < 5) || (r < 5 && c >= QR_SIZE - 5) || (r >= QR_SIZE - 5 && c < 5)
        const finderOn = (r: number, c: number) => {
            const rr = r >= QR_SIZE - 5 ? r - (QR_SIZE - 5) : r
            const cc = c >= QR_SIZE - 5 ? c - (QR_SIZE - 5) : c
            return rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr === 2 && cc === 2)
        }
        for (let r = 0; r < QR_SIZE; r++) {
            for (let c = 0; c < QR_SIZE; c++) {
                const gap =
                    (r === 5 && c < 6) || (c === 5 && r < 6) ||
                    (r === 5 && c >= QR_SIZE - 6) || (c === QR_SIZE - 6 && r < 6) ||
                    (r === QR_SIZE - 6 && c < 6) || (c === 5 && r >= QR_SIZE - 6)
                if (inFinder(r, c)) {
                    if (finderOn(r, c)) cells.push({ x: c, y: r })
                } else if (!gap && (r * 7 + c * 13 + r * c) % 5 < 2) {
                    cells.push({ x: c, y: r })
                }
            }
        }
        return cells
    }, [])
}

function QrScanner({ reduceMotion }: { reduceMotion: boolean }) {
    const cells = useQrCells()
    return (
        <div
            aria-hidden
            className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-background p-3 sm:mx-0 sm:size-40"
        >
            <svg
                viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
                className="size-full text-foreground"
                shapeRendering="crispEdges"
            >
                {cells.map(({ x, y }) => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="currentColor" />
                ))}
            </svg>

            {!reduceMotion && (
                <motion.span
                    className="absolute inset-x-1 h-0.5 rounded-full bg-primary shadow-[0_0_14px_4px_rgba(228,246,10,0.65)]"
                    initial={{ top: "8%" }}
                    animate={{ top: ["8%", "88%", "8%"] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            {["left-1 top-1 border-l-2 border-t-2", "right-1 top-1 border-r-2 border-t-2",
                "bottom-1 left-1 border-b-2 border-l-2", "bottom-1 right-1 border-b-2 border-r-2"].map((cls) => (
                    <span key={cls} className={`absolute size-3 rounded-[3px] border-foreground/70 ${cls}`} />
                ))}
        </div>
    )
}

/* ─── Hero demo card ─────────────────────────────────────────────────────────── */

function HeroDemoCard({ reduceMotion }: { reduceMotion: boolean }) {
    const rowVariants: Variants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } }

    const badgeVariants: Variants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 18 } } }

    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="relative mx-auto w-full max-w-lg lg:mx-0"
        >
            {/* Glow */}
            <div
                aria-hidden
                className="absolute -inset-3 rounded-[28px] bg-primary/12 blur-2xl sm:-inset-5"
            />

            <motion.div
                variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.13, delayChildren: 0.2 } },
                }}
                initial="hidden"
                animate="show"
                className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.3)] sm:rounded-3xl sm:p-7"
            >
                {/* Header badge */}
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3.5 sm:rounded-2xl">
                    <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        {!reduceMotion && (
                            <motion.span
                                aria-hidden
                                className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                                animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                            />
                        )}
                        <ShieldCheck aria-hidden className="relative size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold">Tekshirish namunasi</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Demo ma&apos;lumotlar</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Demo
                    </span>
                </div>

                {/* QR + rows */}
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                    <QrScanner reduceMotion={reduceMotion} />

                    <div className="min-w-0 flex-1">
                        {[
                            ["Talaba", "Alisher Karimov"],
                            ["Mock ID", "MK-290706526"],
                            ["CEFR daraja", "B2"],
                        ].map(([label, value]) => (
                            <motion.div
                                key={label}
                                variants={rowVariants}
                                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-0"
                            >
                                <span className="text-muted-foreground">{label}</span>
                                <span className="break-all text-right font-mono text-xs font-bold sm:text-sm">{value}</span>
                            </motion.div>
                        ))}

                        <motion.div
                            variants={rowVariants}
                            className="flex items-center justify-between gap-3 pt-3 text-sm"
                        >
                            <span className="text-muted-foreground">Holati</span>
                            <motion.span
                                variants={badgeVariants}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400"
                            >
                                <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
                                TASDIQLANGAN
                            </motion.span>
                        </motion.div>
                    </div>
                </div>

                {/* Skill scores strip */}
                <motion.div
                    variants={rowVariants}
                    className="mt-5 grid grid-cols-4 gap-2 border-t border-border pt-5"
                >
                    {[["L", 68], ["R", 71], ["W", 64], ["S", 69]].map(([s, n]) => (
                        <div key={s} className="rounded-xl border border-border/70 bg-muted/60 px-2 py-3 text-center">
                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground">{s}</p>
                            <p className="mt-1 text-base font-bold tabular-nums">{n}</p>
                        </div>
                    ))}
                </motion.div>

                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                    Bu blok faqat interfeys namunasi — haqiqiy natijani quyidagi forma orqali tekshiring.
                </p>
            </motion.div>
        </motion.div>
    )
}

/* ─── Search form ────────────────────────────────────────────────────────────── */

function SearchForm({ onResult }: { onResult: (r: Record<string, unknown> | null) => void }) {
    const id = useId()
    const [token, setToken] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function submit(e: FormEvent) {
        e.preventDefault()
        if (!token.trim()) return
        setLoading(true)
        setError("")
        onResult(null)
        try {
            const r = await publicApi.resultByQr(token.trim())
            onResult(r as Record<string, unknown>)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Natija topilmadi")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={submit} noValidate className="w-full">
            <label htmlFor={id} className="sr-only">QR token</label>
            <div className="relative">
                <ScanLine
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    id={id}
                    value={token}
                    onChange={(e) => { setToken(e.target.value); if (error) setError("") }}
                    placeholder="QR tokenni kiriting (masalan: MK-290706526)"
                    disabled={loading}
                    className="h-[54px] w-full rounded-2xl border border-border bg-card pl-12 pr-36 font-mono text-sm font-medium text-foreground outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={loading || !token.trim()}
                    aria-busy={loading}
                    className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? <Loader2 aria-hidden className="size-4 animate-spin" />
                        : <QrCode aria-hidden className="size-4" />}
                    <span className="hidden sm:inline">
                        {loading ? "Tekshirilmoqda…" : "Tekshirish"}
                    </span>
                </button>
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-red-500" />
                    {error}
                </motion.p>
            )}
        </form>
    )
}

/* ─── Result card ────────────────────────────────────────────────────────────── */

function ResultCard({ result, onReset }: {
    result: Record<string, unknown>
    onReset: () => void
}) {
    const overall = Number(result.overall || 0)
    const reduceMotion = useReducedMotion() ?? false

    const rowVariants: Variants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease } } }

    function scoreColor(s: number) {
        if (s >= 70) return { text: "text-emerald-600", bar: "bg-emerald-500" }
        if (s >= 55) return { text: "text-amber-600", bar: "bg-amber-400" }
        return { text: "text-red-500", bar: "bg-red-400" }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
        >
            {/* Section label */}
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-2 rounded-full bg-emerald-500" aria-hidden />
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Natija topildi
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-muted-foreground transition-all hover:border-border-strong hover:text-foreground"
                >
                    <RefreshCw aria-hidden className="size-3.5" />
                    Yangi qidiruv
                </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_40px_-20px_rgba(0,0,0,0.18)] sm:rounded-3xl">
                {/* Header */}
                <div className="relative overflow-hidden bg-foreground px-6 pb-7 pt-6">
                    <div aria-hidden className="absolute right-[-60px] top-[-60px] size-52 rounded-full bg-primary/20 blur-[80px]" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/60">
                                Natija
                            </p>
                            <p className="mt-1 truncate text-xl font-semibold text-background">
                                {String(result.full_name || "Abituriyent")}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-background/40">
                                {String(result.student_id || "—")}
                            </p>
                        </div>
                        <span className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-xl font-extrabold text-foreground">
                            {String(result.cefr_level || "—")}
                        </span>
                    </div>

                    <div className="relative mt-5 flex items-end gap-3">
                        <p className="text-6xl font-bold tracking-[-0.06em] text-background">
                            {overall.toFixed(1)}
                        </p>
                        <p className="mb-2 text-sm text-background/50">/ 90.0</p>
                    </div>

                    <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/15">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(overall / 90) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2, ease }}
                            className="h-full rounded-full bg-primary"
                        />
                    </div>
                </div>

                {/* Skill grid */}
                <motion.div
                    variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: 0.1 } } }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"
                >
                    {SKILLS.map(({ label, key, short }) => {
                        const score = Number(result[key] || 0)
                        const { text, bar } = scoreColor(score)
                        return (
                            <motion.div
                                key={key}
                                variants={rowVariants}
                                className="rounded-2xl border border-border bg-muted/50 p-4"
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                        {short}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                                </div>
                                <p className={`mt-2 text-2xl font-bold tabular-nums ${text}`}>
                                    {score.toFixed(1)}
                                </p>
                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(score / 90) * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.25, ease }}
                                        className={`h-full rounded-full ${bar}`}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-5 py-4">
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 aria-hidden className="size-4 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">Holati:</span>
                        <span className="font-semibold">{String(result.status || "FINALIZED")}</span>
                    </div>
                    {result.exam_date && (
                        <p className="text-sm text-muted-foreground">
                            {new Date(String(result.exam_date)).toLocaleDateString("uz-UZ", { dateStyle: "long" })}
                        </p>
                    )}
                    {result.mock_id && (
                        <div className="ml-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <QrCode aria-hidden className="size-3.5" />
                            {String(result.mock_id)}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ResultPage() {
    const [result, setResult] = useState<Record<string, unknown> | null>(null)
    const reduceMotion = useReducedMotion() ?? false

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-background text-foreground">
                <SiteHeader variant="public" />

                <main>
                    {/* ── Hero ─────────────────────────────────────────────────────── */}
                    <section className="relative overflow-hidden pb-14 pt-28 sm:pb-16 sm:pt-36 lg:pb-24 lg:pt-44">
                        <div aria-hidden className="pointer-events-none absolute right-[-120px] top-[60px] size-[500px] rounded-full bg-primary/[0.06] blur-[120px]" />
                        <div aria-hidden className="pointer-events-none absolute -left-[80px] bottom-0 size-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />

                        <div className={cnt}>
                            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

                                {/* Left */}
                                <motion.div
                                    variants={stagger}
                                    initial="hidden"
                                    animate="show"
                                    className="min-w-0 text-center lg:text-left"
                                >
                                    {/* Eyebrow */}
                                    <motion.p
                                        variants={fadeUp}
                                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                                    >
                                        <span aria-hidden className="size-2 rounded-full bg-primary" />
                                        Natijani tekshirish
                                    </motion.p>

                                    {/* Heading */}
                                    <motion.h1
                                        variants={fadeUp}
                                        className="mt-5 text-[clamp(2.1rem,4.8vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.05em]"
                                    >
                                        Natija ma&apos;lumotlarini{" "}
                                        <span className="relative inline-block whitespace-nowrap">
                                            tekshiring.
                                            <span
                                                aria-hidden
                                                className="absolute -bottom-1.5 left-0 h-[6px] w-full rounded-full bg-primary sm:h-2"
                                            />
                                        </span>
                                    </motion.h1>

                                    {/* Description */}
                                    <motion.p
                                        variants={fadeUp}
                                        className="mx-auto mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8 lg:mx-0"
                                    >
                                        Natija qaydnomasidagi QR tokenni kiriting.
                                        Listening, Reading, Writing va Speaking bo&apos;yicha
                                        batafsil natijangiz bir zumda ko&apos;rinadi.
                                    </motion.p>

                                    {/* Steps */}
                                    <motion.ol variants={stagger} className="mx-auto mt-7 max-w-md space-y-2.5 text-left lg:mx-0">
                                        {HOW_STEPS.map(({ icon: Icon, title, body }, i) => (
                                            <motion.li
                                                key={title}
                                                variants={fadeUp}
                                                className="group flex items-start gap-3.5 rounded-2xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-card/70"
                                            >
                                                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-foreground transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2">
                                                    <Icon aria-hidden className="size-[18px]" />
                                                    <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                                                        {i + 1}
                                                    </span>
                                                </span>
                                                <span>
                                                    <span className="block text-sm font-bold">{title}</span>
                                                    <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{body}</span>
                                                </span>
                                            </motion.li>
                                        ))}
                                    </motion.ol>

                                    {/* Search form */}
                                    <motion.div variants={fadeUp} className="mt-7">
                                        <SearchForm onResult={setResult} />
                                    </motion.div>

                                    <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-muted-foreground lg:text-left">
                                        Shaxsiy kabinet kerakmi?{" "}
                                        <Link href="/login" className="font-semibold text-foreground hover:underline">
                                            Kirish <ArrowRight aria-hidden className="ml-0.5 inline size-3.5" />
                                        </Link>
                                    </motion.p>
                                </motion.div>

                                {/* Right — demo card */}
                                <HeroDemoCard reduceMotion={reduceMotion} />
                            </div>
                        </div>
                    </section>

                    {/* ── Result ───────────────────────────────────────────────────── */}
                    {result && (
                        <section className="border-t border-border py-14 sm:py-16">
                            <div className={cnt}>
                                <div className="mx-auto max-w-2xl">
                                    <ResultCard result={result} onReset={() => setResult(null)} />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── Info strip ───────────────────────────────────────────────── */}
                    <section className="border-t border-border bg-card">
                        <div className={`${cnt} py-10 sm:py-12`}>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {[
                                    { n: "01", title: "QR token nima?", desc: "Har bir mock imtihon qaydnomasida berilgan noyob identifikator." },
                                    { n: "02", title: "Natijalar qachon?", desc: "Imtihon sanasidan 3–5 ish kuni ichida portal orqali e'lon qilinadi." },
                                    { n: "03", title: "Shaxsiy kabinet", desc: "Ro'yxatdan o'tgan foydalanuvchilar barcha natijalarini kabinetda ko'radi." },
                                ].map((item) => (
                                    <div key={item.n} className="flex gap-4 border-l-2 border-primary pl-4">
                                        <span className="font-mono text-[10px] font-semibold text-muted-foreground">{item.n}</span>
                                        <div>
                                            <h3 className="text-sm font-semibold">{item.title}</h3>
                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </MotionConfig>
    )
}