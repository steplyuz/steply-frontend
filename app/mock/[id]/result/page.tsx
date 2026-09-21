"use client"

import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
    ArrowLeft, ArrowRight, CalendarDays, CheckCircle2,
    MapPin, User, Lock, AlertCircle, Loader2, ChevronDown,
} from "lucide-react"
import { motion, MotionConfig } from "framer-motion"

import { SiteHeader } from "@/components/layout/header"
import { useAuth } from "@/lib/auth/auth-context"
import { mockCenterApi, publicApi } from "@/lib/api/endpoints"
import type { Gender, PublicExamDetail, PublicExamSession, Region } from "@/lib/api/types"

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10"
const ease = [0.22, 1, 0.36, 1] as const

const REGIONS: [Region, string][] = [
    ["tashkent_city", "Toshkent shahri"],
    ["tashkent_region", "Toshkent viloyati"],
    ["andijan", "Andijon"],
    ["bukhara", "Buxoro"],
    ["fergana", "Farg'ona"],
    ["jizzakh", "Jizzax"],
    ["kashkadarya", "Qashqadaryo"],
    ["navoiy", "Navoiy"],
    ["namangan", "Namangan"],
    ["samarkand", "Samarqand"],
    ["surkhandarya", "Surxondaryo"],
    ["syrdarya", "Sirdaryo"],
    ["khorezm", "Xorazm"],
    ["karakalpakstan", "Qoraqalpog'iston"],
]

function ageFromDate(date: string) {
    if (!date) return 0
    const d = new Date(date)
    const n = new Date()
    let a = n.getFullYear() - d.getFullYear()
    if (
        n.getMonth() < d.getMonth() ||
        (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())
    ) a--
    return a
}

function formatDate(value: string) {
    if (!value) return "—"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    try { return d.toLocaleString("uz-UZ", { dateStyle: "full", timeStyle: "short" }) }
    catch { return value }
}

/* ─── Shared field styles ────────────────────────────────────────────────────── */

const inputClass =
    "mt-1.5 h-[46px] w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground " +
    "outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground " +
    "focus:border-foreground focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-55 disabled:bg-muted"

const selectClass =
    "mt-1.5 h-[46px] w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm font-medium text-foreground " +
    "outline-none transition-[border-color,box-shadow] " +
    "focus:border-foreground focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-55"

/* ─── Field components ──────────────────────────────────────────────────────── */

function Field({
    label, value, onChange, type = "text", disabled = false, required = false, id,
}: {
    label: string; value: string; onChange?: (v: string) => void
    type?: string; disabled?: boolean; required?: boolean; id?: string
}) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </span>
            <input
                id={id}
                className={inputClass}
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                required={required}
            />
        </label>
    )
}

function SelectField({
    label, value, onChange, options, required = false,
}: {
    label: string; value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    required?: boolean
}) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </span>
            <div className="relative mt-1.5">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className={selectClass}
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
            </div>
        </label>
    )
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

function RegisterSkeleton() {
    return (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 rounded-[24px] border border-border bg-card p-8">
                <div className="h-5 w-40 animate-pulse rounded-lg bg-muted" />
                <div className="h-9 w-2/3 animate-pulse rounded-xl bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-[70px] animate-pulse rounded-xl bg-muted ${i === 5 ? "sm:col-span-2" : ""}`} />
                    ))}
                </div>
                <div className="mt-4 h-12 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-72 animate-pulse rounded-[24px] bg-muted" />
        </div>
    )
}

/* ─── Session summary sidebar ───────────────────────────────────────────────── */

function SessionSidebar({
    session, examTitle, price,
}: {
    session: PublicExamSession; examTitle: string; price: number
}) {
    const money = new Intl.NumberFormat("uz-UZ")

    return (
        <aside className="h-fit overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_8px_32px_rgba(21,21,21,0.06)]">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-border bg-muted px-6 pb-5 pt-6">
                <div
                    aria-hidden
                    className="absolute right-[-40px] top-[-40px] size-32 rounded-full bg-primary/20 blur-[60px]"
                />
                <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tanlangan sessiya
                </p>
                <p className="relative mt-2 text-[15px] font-semibold leading-snug">
                    {examTitle}
                </p>
            </div>

            {/* Session info */}
            <div className="space-y-4 p-5">
                <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <CalendarDays aria-hidden className="size-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Sana va vaqt
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">{formatDate(session.exam_date)}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <MapPin aria-hidden className="size-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Manzil
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                            {session.center_name || session.location_address || "Ko'rsatilmagan"}
                        </p>
                        {session.room_name && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{session.room_name}</p>
                        )}
                    </div>
                </div>

                {/* Required documents */}
                {session.required_documents?.length > 0 && (
                    <div className="rounded-xl border border-border bg-background p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Kerakli hujjatlar
                        </p>
                        <ul className="mt-3 space-y-2">
                            {session.required_documents.map((doc) => (
                                <li key={doc} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                                    {doc}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">To&apos;lov miqdori</p>
                    <p className="text-lg font-bold tracking-[-0.02em]">
                        {price > 0 ? `${money.format(price)} UZS` : "Bepul"}
                    </p>
                </div>
            </div>
        </aside>
    )
}

/* ─── Main form ─────────────────────────────────────────────────────────────── */

function RegisterMockForm() {
    const { id } = useParams<{ id: string }>()
    const q = useSearchParams()
    const router = useRouter()
    const { user, isLoading, isAuthenticated } = useAuth()

    const [exam, setExam] = useState<PublicExamDetail | null>(null)
    const [session, setSession] = useState<PublicExamSession | null>(null)
    const [gender, setGender] = useState<Gender>("male")
    const [dob, setDob] = useState(user?.profile.birth_date || "")
    const [region, setRegion] = useState<Region>("tashkent_city")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")

    /* Auth guard */
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(`/login?next=/mock/${id}/register?session=${q.get("session") || ""}`)
        }
    }, [isLoading, isAuthenticated, id, q, router])

    /* Load exam */
    useEffect(() => {
        publicApi.mockExam(id)
            .then((x) => {
                setExam(x)
                const sid = Number(q.get("session"))
                setSession(x.sessions.find((s) => s.id === sid) || x.sessions[0] || null)
            })
            .catch((e) => setError(e instanceof Error ? e.message : "Imtihon topilmadi"))
    }, [id, q])

    /* Sync dob from user */
    useEffect(() => {
        if (user?.profile.birth_date && !dob) setDob(user.profile.birth_date)
    }, [user, dob])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!session || !user) return
        setBusy(true)
        setError("")
        try {
            const reg = await mockCenterApi.registerForSession({
                session_id: session.id,
                full_name: user.profile.full_name,
                age: ageFromDate(dob),
                date_of_birth: dob || null,
                gender,
                region,
            })
            router.push(`/dashboard?registered=${reg.id}`)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ro'yxatdan o'tishda xatolik")
        } finally {
            setBusy(false)
        }
    }

    const isReady = !isLoading && isAuthenticated && user && exam && session

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-background text-foreground">
                <SiteHeader variant="public" />

                {/* Breadcrumb */}
                <div className="border-b border-border bg-card">
                    <div className={`${container} py-4`}>
                        <Link
                            href={`/mock/${id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft aria-hidden className="size-4" />
                            Imtihon sahifasiga qaytish
                        </Link>
                    </div>
                </div>

                <main className={`${container} pb-20 pt-10`}>
                    {!isReady ? (
                        <RegisterSkeleton />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease }}
                            className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start"
                        >
                            {/* ── Form ─────────────────────────────────────────────────── */}
                            <form
                                onSubmit={submit}
                                noValidate
                                className="overflow-hidden rounded-[24px] border border-border bg-card"
                            >
                                {/* Form header */}
                                <div className="relative overflow-hidden border-b border-border bg-muted px-6 pb-6 pt-7 sm:px-8">
                                    <div
                                        aria-hidden
                                        className="absolute right-[-60px] top-[-60px] size-48 rounded-full bg-primary/15 blur-[80px]"
                                    />
                                    <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Mock imtihon
                                    </p>
                                    <h1 className="relative mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                                        {exam.title}
                                    </h1>
                                    <p className="relative mt-2 text-sm text-muted-foreground">
                                        Profilingizdagi ma&apos;lumotlar avtomatik olinadi. Qolgan maydonlarni to&apos;ldiring.
                                    </p>
                                </div>

                                {/* Form fields */}
                                <div className="px-6 py-7 sm:px-8">

                                    {/* Auto-filled section */}
                                    <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <Lock aria-hidden className="size-3.5" />
                                            Profildan avtomatik olingan ma&apos;lumotlar
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                                                    F.I.Sh.
                                                </p>
                                                <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                                                    <User aria-hidden className="size-4 text-muted-foreground" />
                                                    {user.profile.full_name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                                                    Student ID
                                                </p>
                                                <p className="mt-1 text-sm font-semibold font-mono">
                                                    {user.profile.cefr_code || (
                                                        <span className="font-sans text-muted-foreground">Avtomatik yaratiladi</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable fields */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Tug'ilgan sana"
                                            type="date"
                                            value={dob}
                                            onChange={setDob}
                                            required
                                        />

                                        <SelectField
                                            label="Jins"
                                            value={gender}
                                            onChange={(v) => setGender(v as Gender)}
                                            options={[
                                                { value: "male", label: "Erkak" },
                                                { value: "female", label: "Ayol" },
                                            ]}
                                            required
                                        />

                                        <div className="sm:col-span-2">
                                            <SelectField
                                                label="Yashash hududi"
                                                value={region}
                                                onChange={(v) => setRegion(v as Region)}
                                                options={REGIONS.map(([v, l]) => ({ value: v, label: l }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                                            role="alert"
                                        >
                                            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-red-500" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </motion.div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={busy || ageFromDate(dob) < 1}
                                        aria-busy={busy}
                                        className="group mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground px-6 text-[15px] font-semibold text-background transition-all hover:bg-foreground/90 hover:shadow-[0_8px_24px_rgba(21,21,21,0.15)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {busy ? (
                                            <>
                                                <Loader2 aria-hidden className="size-5 animate-spin" />
                                                Yuborilmoqda…
                                            </>
                                        ) : (
                                            <>
                                                Ro&apos;yxatdan o&apos;tishni tasdiqlash
                                                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-foreground transition-transform duration-300 group-hover:translate-x-0.5">
                                                    <ArrowRight aria-hidden className="size-3.5" />
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    <p className="mt-4 text-center text-xs text-muted-foreground">
                                        Ro&apos;yxatdan o&apos;tgach tasdiqlash SMS yuboriladi
                                    </p>
                                </div>
                            </form>

                            {/* ── Sidebar ──────────────────────────────────────────────── */}
                            <SessionSidebar
                                session={session}
                                examTitle={exam.title}
                                price={exam.price}
                            />
                        </motion.div>
                    )}
                </main>
            </div>
        </MotionConfig>
    )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function RegisterMockPage() {
    return (
        <Suspense fallback={null}>
            <RegisterMockForm />
        </Suspense>
    )
}