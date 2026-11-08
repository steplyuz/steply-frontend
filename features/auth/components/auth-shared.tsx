"use client"

/* ─────────────────────────────────────────────────────────────────────────────
 * Login va Register sahifalari uchun umumiy qismlar (yashil uslub)
 * Joyi: components/auth/auth-shared.tsx
 * ──────────────────────────────────────────────────────────────────────────── */

import { useEffect, useId, useRef, type ReactNode, type Ref } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, Phone } from "lucide-react"

import { useAlphabet } from "@/shared/providers/alphabet-provider"
import { LanguageSwitch } from "@/shared/ui/language-switch"

/**
 * Google tugmasi: true — o'zimizning dizayn (Google'ning rasmiy tugmasi ko'rinmas holda ustiga qo'yiladi,
 * bosish baribir Google'ning o'z iframe'iga tushadi). false — rasmiy tugma ko'rinadi.
 */
export const CUSTOM_GOOGLE_BUTTON = true

// ─── Animatsiya ───────────────────────────────────────────────────────────────

export const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function useEntrance<T extends HTMLElement>(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const ref = useRef<T>(null)
    useEffect(() => {
        const el = ref.current
        if (!el || prefersReducedMotion()) return
        el.animate(keyframes, { fill: "backwards", easing: "cubic-bezier(0.16, 1, 0.3, 1)", ...options })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return ref
}

export function shake(el: HTMLElement | null) {
    if (!el || prefersReducedMotion()) return
    el.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(2px)" },
            { transform: "translateX(0)" },
        ],
        { duration: 380, easing: "ease-out" },
    )
}

// ─── Xavfsiz `next` yo'naltirish ──────────────────────────────────────────────

/** Faqat sayt ichidagi yo'l ("/dashboard/..."). "//evil.com" yoki "https://..." rad etiladi (open redirect). */
export function safeNextPath(raw: string | null): string | null {
    if (!raw) return null
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null
    return raw
}

// ─── Telefon (+998 o'zgarmas, foydalanuvchi faqat 9 ta raqam kiritadi) ───────

export const PHONE_PREFIX = "+998"
export const PHONE_DIGITS = 9

/** Faqat raqamlar, ko'pi bilan 9 ta. stripCountry — to'liq raqam joylashtirilganda (paste/URL) +998 ni olib tashlaydi */
export function toLocalDigits(raw: string, stripCountry = false) {
    let d = raw.replace(/\D/g, "")
    if (stripCountry && d.length > PHONE_DIGITS && d.startsWith("998")) d = d.slice(3)
    return d.slice(0, PHONE_DIGITS)
}

/** 901234567 → "90 123 45 67" */
export function formatLocal(d: string) {
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ")
}

// ─── Umumiy klasslar ──────────────────────────────────────────────────────────

export const fieldClass =
    "h-[52px] w-full rounded-2xl border border-border-strong bg-white pl-14 pr-4 text-[15px] font-medium text-foreground " +
    "outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 " +
    "focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:opacity-60"

export const primaryButtonClass =
    "group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full " +
    "bg-gradient-to-br from-primary to-primary-strong px-5 text-[15px] font-semibold text-primary-foreground " +
    "shadow-[0_10px_28px_-12px_rgba(31,122,77,0.7)] transition-[transform,filter,box-shadow] " +
    "hover:brightness-110 hover:shadow-[0_14px_30px_-12px_rgba(31,122,77,0.65)] active:scale-[0.99] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 " +
    "disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"

/* Auth (Google / Telegram) tugmalari: bir xil o'lcham va shakl */
export const authVisualClass =
    "flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-border-strong bg-white px-5 " +
    "text-[15px] font-semibold text-foreground shadow-sm transition-[transform,background-color,border-color,box-shadow] " +
    "motion-reduce:transition-none"

export const authInteractiveClass =
    "hover:border-primary/40 hover:bg-secondary/50 hover:shadow-md active:scale-[0.99] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 " +
    "disabled:cursor-not-allowed disabled:opacity-60"

// ─── Brend ────────────────────────────────────────────────────────────────────

const S_PATH = "M23 48L12 66L12 68L8 75L4 87L3 95L2 96L2 101L1 102L1 113L0 114L1 131L2 132L2 137L7 155L17 176L22 184L34 198L47 209L61 218L65 219L70 222L87 227L92 227L93 228L316 228L317 229L324 229L330 232L339 242L341 248L341 261L337 270L329 278L324 280L58 280L57 281L45 282L32 287L20 295L13 302L6 312L6 314L1 325L1 330L0 331L0 361L4 366L6 367L300 367L301 368L308 368L309 367L316 367L317 368L324 368L325 367L346 367L347 366L352 366L353 365L357 365L364 363L385 353L399 343L412 330L420 320L421 317L425 312L434 293L439 275L439 270L441 263L441 239L440 238L440 232L439 231L438 222L430 200L428 198L428 196L420 183L407 168L399 161L386 152L376 147L362 142L354 141L353 140L346 140L345 139L115 139L107 135L101 128L97 118L97 109L98 108L98 105L103 96L108 91L114 88L375 88L376 87L386 87L387 86L394 85L402 81L404 81L415 74L426 63L433 51L437 38L437 6L434 2L430 0L108 0L107 1L100 1L99 2L87 4L73 10L71 10L61 15L41 29Z"
const S_VIEWBOX = "0 0 442 369"

/** Logotip: gradient yashil nuqta + wordmark (sidebar va header bilan bir xil) */
export function AuthLogo() {
    return (
        <Link
            href="/"
            aria-label="Steply bosh sahifa"
            className="inline-flex items-center gap-2.5 rounded-md text-3xl font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            <span
                aria-hidden="true"
                className="size-4 rounded-full bg-gradient-to-br from-brand-glow via-primary to-primary-strong"
            />
            Steply
        </Link>
    )
}

function BackgroundS() {
    const gid = useId()
    const ref = useEntrance<HTMLDivElement>(
        [
            { opacity: 0, transform: "translate3d(-40px, 40px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 1400, delay: 50 },
    )
    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[16vw] -left-[6vw] w-[84vw] lg:-bottom-[8vw] lg:-left-[2vw] lg:w-[58vw]"
        >
            <div className="origin-bottom-left -rotate-[13deg] scale-x-[1.45] animate-[steply-float_14s_ease-in-out_infinite] motion-reduce:animate-none">
                <svg viewBox={S_VIEWBOX} className="w-full">
                    <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#5DBB8A" stopOpacity="0.6" />
                            <stop offset="0.55" stopColor="#5DBB8A" stopOpacity="0.3" />
                            <stop offset="1" stopColor="#5DBB8A" stopOpacity="0.04" />
                        </linearGradient>
                    </defs>
                    <path d={S_PATH} fill={`url(#${gid})`} />
                </svg>
            </div>
            <style>{`@keyframes steply-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -14px } }`}</style>
        </div>
    )
}

/** Auth sahifalari qobig'i: yashil fon, chapda sarlavha, o'ngda karta (logo + sarlavha + children) */
export function AuthShell({
    headlineTop,
    headlineAccent,
    title,
    children,
}: {
    headlineTop: string
    headlineAccent: string
    title: string
    children: ReactNode
}) {
    const { t } = useAlphabet()

    const headlineRef = useEntrance<HTMLDivElement>(
        [
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 900, delay: 150 },
    )
    const cardRef = useEntrance<HTMLDivElement>(
        [
            { opacity: 0, transform: "translateY(24px) scale(0.98)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 900, delay: 300 },
    )

    return (
        <main
            className="relative isolate min-h-svh overflow-hidden bg-background text-foreground"
            style={{
                backgroundImage: `radial-gradient(ellipse 40% 45% at 0% 0%, rgba(93,187,138,0.28), transparent 70%),
                          radial-gradient(ellipse 35% 40% at 100% 100%, rgba(31,122,77,0.22), transparent 70%)`,
            }}
        >
            <BackgroundS />

            <LanguageSwitch className="absolute right-4 top-4 z-20 flex sm:right-8 sm:top-6" />

            <div
                className="relative grid min-h-svh w-full items-center gap-10 px-5 py-8
                   sm:px-10 lg:grid-cols-[1fr_minmax(0,50%)] lg:gap-0 lg:px-0 lg:py-0"
            >
                <div ref={headlineRef} className="hidden items-center self-stretch lg:flex lg:pl-[8vw] xl:pl-[10vw]">
                    <h1 className="text-[clamp(2.4rem,3.6vw,3.8rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                        {t(headlineTop)}
                        <br />
                        <span className="text-primary">{t(headlineAccent)}</span>
                    </h1>
                </div>

                <div
                    ref={cardRef}
                    className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white/92 px-6 py-10 shadow-[0_24px_64px_rgba(15,61,38,0.10)]
                     ring-1 ring-primary-strong/[0.06] backdrop-blur-sm sm:px-12 sm:py-14
                     lg:mx-auto lg:max-w-[420px] lg:rounded-[32px] lg:px-[52px] lg:py-[68px]"
                >
                    <div className="flex justify-center">
                        <AuthLogo />
                    </div>

                    <h2 className="mb-7 mt-7 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[26px]">{t(title)}</h2>

                    {children}
                </div>
            </div>
        </main>
    )
}

// ─── Telefon maydoni ──────────────────────────────────────────────────────────

/** "+998" o'zgarmas prefiks + 9 ta raqam (90 123 45 67). To'liq raqam joylashtirilsa prefiks olib tashlanadi. */
export function PhoneField({
    id = "phone",
    value,
    onChange,
    disabled,
    inputRef,
}: {
    id?: string
    /** 9 ta mahalliy raqam (prefikssiz) */
    value: string
    onChange: (digits: string) => void
    disabled?: boolean
    inputRef?: Ref<HTMLInputElement>
}) {
    const { t } = useAlphabet()

    return (
        <div>
            <label htmlFor={id} className="sr-only">
                {t("Telefon raqam")}
            </label>
            <div className="relative">
                <Phone
                    className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[3.25rem] top-1/2 -translate-y-1/2 select-none text-[15px] font-semibold text-foreground"
                >
                    {PHONE_PREFIX}
                </span>
                <input
                    ref={inputRef}
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatLocal(value)}
                    onChange={(e) => onChange(toLocalDigits(e.target.value))}
                    onPaste={(e) => {
                        // To'liq raqam (+998 90 123 45 67 / 998901234567) joylashtirilsa prefiks olib tashlanadi
                        e.preventDefault()
                        onChange(toLocalDigits(e.clipboardData.getData("text"), true))
                    }}
                    required
                    placeholder="90 123 45 67"
                    aria-describedby={`${id}-hint`}
                    disabled={disabled}
                    className={`${fieldClass} pl-[6.5rem] tabular-nums`}
                />
            </div>
            <p id={`${id}-hint`} className="sr-only">
                {t("Telefon raqam +998 bilan boshlanadi, 9 ta raqam kiriting")}
            </p>
        </div>
    )
}

// ─── Xato matni va ajratgich ──────────────────────────────────────────────────

export function AuthError({ id, message }: { id: string; message: string }) {
    if (!message) return null
    return (
        <p id={id} role="alert" className="mt-3 flex items-start gap-2 text-sm text-error">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message}
        </p>
    )
}

export function AuthDivider({ label }: { label: string }) {
    const { t } = useAlphabet()
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-strong" />
            </div>
            <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted-foreground">{t(label)}</span>
            </div>
        </div>
    )
}

// ─── Auth ikonkalari ──────────────────────────────────────────────────────────

export function GoogleIcon({ className = "size-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
}

export function TelegramIcon({ className = "size-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                fill="#229ED9"
            />
            <path
                d="M5.491 11.74C8.784 10.306 10.98 9.36 12.08 8.902C15.221 7.595 15.874 7.368 16.3 7.36C16.394 7.358 16.604 7.382 16.74 7.492C16.855 7.585 16.886 7.711 16.902 7.799C16.917 7.887 16.935 8.088 16.921 8.238C16.757 9.957 16.05 14.125 15.69 16.05C15.538 16.864 15.238 17.137 14.948 17.163C14.318 17.221 13.84 16.747 13.23 16.347C12.275 15.721 11.735 15.331 10.808 14.72C9.736 14.014 10.431 13.626 11.042 12.991C11.202 12.825 13.984 10.295 14.038 10.067C14.045 10.038 14.051 9.932 13.988 9.877C13.926 9.821 13.834 9.84 13.768 9.855C13.674 9.876 12.186 10.86 9.303 12.806C8.881 13.096 8.498 13.238 8.156 13.23C7.779 13.222 7.053 13.017 6.513 12.842C5.852 12.627 5.326 12.513 5.372 12.149C5.396 11.959 5.658 11.765 6.16 11.566L5.491 11.74Z"
                fill="white"
            />
        </svg>
    )
}

// ─── Google + Telegram tugmalari ──────────────────────────────────────────────

export function SocialAuth({
    google,
    telegram,
    googleLabel,
    telegramLabel,
    disabled,
}: {
    google: { ready: boolean; busy: boolean; buttonRef: Ref<HTMLDivElement> }
    telegram: { start: () => void; busy: boolean; ready: boolean }
    /** Matnlar amaldagi o'zbek alifbosida yoziladi, t() o'zi o'tkazadi */
    googleLabel: string
    telegramLabel: string
    disabled?: boolean
}) {
    const { t } = useAlphabet()

    return (
        <div className="space-y-2.5">
            {/* Google */}
            {CUSTOM_GOOGLE_BUTTON ? (
                <div className="group relative h-[52px] w-full">
                    {/* Ko'rinadigan qatlam (bosilmaydi) */}
                    <div
                        aria-hidden="true"
                        className={`${authVisualClass} pointer-events-none absolute inset-0 group-hover:border-primary/40 group-hover:bg-secondary/50 group-hover:shadow-md group-focus-within:ring-4 group-focus-within:ring-primary/20`}
                    >
                        {!google.ready || google.busy ? (
                            <>
                                <Loader2 className="size-5 animate-spin text-[#4285F4] motion-reduce:animate-none" />
                                <span>{google.busy ? t("Google tasdiqlanmoqda…") : t("Google yuklanmoqda…")}</span>
                            </>
                        ) : (
                            <>
                                <GoogleIcon />
                                <span>{t(googleLabel)}</span>
                            </>
                        )}
                    </div>
                    {/* Google'ning rasmiy tugmasi: ko'rinmas, lekin bosish shu yerga tushadi */}
                    <div
                        ref={google.buttonRef}
                        className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-full opacity-[0.01] [&>div]:!w-full [&>div]:scale-y-[1.3] [&_iframe]:!w-full ${google.busy ? "pointer-events-none" : ""
                            }`}
                    />
                </div>
            ) : (
                <div className="relative flex h-[40px] w-full items-center justify-center">
                    {(!google.ready || google.busy) && (
                        <div className="absolute inset-0 z-10 flex h-[40px] w-full items-center justify-center rounded-[4px] border border-border-strong bg-white px-3 text-[14px] font-medium text-[#3c4043]">
                            <Loader2 className="mr-2 size-4 animate-spin text-[#4285F4]" />
                            <span>{t("Google yuklanmoqda…")}</span>
                        </div>
                    )}
                    <div ref={google.buttonRef} className="flex w-full justify-center [&>div]:!w-full [&_iframe]:!w-full" />
                </div>
            )}

            {/* Telegram */}
            <button
                type="button"
                onClick={telegram.start}
                disabled={disabled || telegram.busy || !telegram.ready}
                className={`${authVisualClass} ${authInteractiveClass} group`}
            >
                {telegram.busy ? (
                    <>
                        <Loader2 className="size-5 animate-spin text-[#229ED9] motion-reduce:animate-none" aria-hidden="true" />
                        <span>{t("Telegram tasdiqlanmoqda…")}</span>
                    </>
                ) : (
                    <>
                        <TelegramIcon className="size-5 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none" />
                        <span>{t(telegramLabel)}</span>
                    </>
                )}
            </button>
        </div>
    )
}