"use client"

import { Suspense, useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff, Loader2, Lock, Phone, User } from "lucide-react"

import { authApi } from "@/lib/api"
import { ApiRequestError } from "@/lib/api/client"
import { homeUrlForRole } from "@/lib/auth/auth-context"
import { useTelegramLogin } from "@/lib/auth/telegram-login"
import { useGoogleLogin } from "@/lib/auth/google-login"

type Step = "form" | "verify"

const LIME = "#E4F70A"
const LIME_TEXT = "#7A9A00"

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function useEntrance<T extends HTMLElement>(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    el.animate(keyframes, { fill: "backwards", easing: "cubic-bezier(0.16, 1, 0.3, 1)", ...options })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ref
}

// ─── Brand ───────────────────────────────────────────────────────────────────

const S_PATH = "M23 48L12 66L12 68L8 75L4 87L3 95L2 96L2 101L1 102L1 113L0 114L1 131L2 132L2 137L7 155L17 176L22 184L34 198L47 209L61 218L65 219L70 222L87 227L92 227L93 228L316 228L317 229L324 229L330 232L339 242L341 248L341 261L337 270L329 278L324 280L58 280L57 281L45 282L32 287L20 295L13 302L6 312L6 314L1 325L1 330L0 331L0 361L4 366L6 367L300 367L301 368L308 368L309 367L316 367L317 368L324 368L325 367L346 367L347 366L352 366L353 365L357 365L364 363L385 353L399 343L412 330L420 320L421 317L425 312L434 293L439 275L439 270L441 263L441 239L440 238L440 232L439 231L438 222L430 200L428 198L428 196L420 183L407 168L399 161L386 152L376 147L362 142L354 141L353 140L346 140L345 139L115 139L107 135L101 128L97 118L97 109L98 108L98 105L103 96L108 91L114 88L375 88L376 87L386 87L387 86L394 85L402 81L404 81L415 74L426 63L433 51L437 38L437 6L434 2L430 0L108 0L107 1L100 1L99 2L87 4L73 10L71 10L61 15L41 29Z"
const S_VIEWBOX = "0 0 442 369"

const LOGO_SIZES = {
  sm: { w: 80, h: 28 },
  md: { w: 110, h: 38 },
  lg: { w: 140, h: 48 },
} as const

function Logo({ size = "md" }: { size?: keyof typeof LOGO_SIZES }) {
  const { w, h } = LOGO_SIZES[size]
  return (
    <Image
      src="/logo.png"
      alt="Steply.uz"
      width={w}
      height={h}
      priority
      style={{ height: h, width: "auto", maxWidth: w }}
      className="object-contain"
    />
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
              <stop offset="0" stopColor={LIME} stopOpacity="0.85" />
              <stop offset="0.55" stopColor={LIME} stopOpacity="0.45" />
              <stop offset="1" stopColor={LIME} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={S_PATH} fill={`url(#${gid})`} />
        </svg>
      </div>
      <style>{`@keyframes steply-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -14px } }`}</style>
    </div>
  )
}

// ─── Shared field styling ─────────────────────────────────────────────────────

const fieldClass =
  "h-[52px] w-full rounded-xl border border-border-strong bg-white pl-14 pr-4 text-[15px] font-medium text-foreground " +
  "outline-none transition-[border-color,box-shadow] placeholder:text-[#B0B1B9] " +
  "focus:border-foreground focus:ring-4 focus:ring-[#E4F70A]/60 disabled:opacity-60"

const primaryButtonClass =
  "group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4F53C] px-5 " +
  "text-[15px] font-semibold text-foreground transition-[transform,background-color,box-shadow] " +
  "hover:bg-[#CAF02A] hover:shadow-[0_8px_28px_rgba(180,226,0,0.38)] active:scale-[0.99] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/15 " +
  "disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"

// ─── Custom Select ────────────────────────────────────────────────────────────

type SelectOption = { label: string; value: number | string }

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  center = false,
}: {
  value: number | string
  onChange: (val: number | string) => void
  options: SelectOption[]
  placeholder: string
  disabled?: boolean
  ariaLabel?: string
  center?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector("[aria-selected='true']")
      if (el) el.scrollIntoView({ block: "nearest" })
    }
  }, [open])

  // 0 yoki "" bo'lsa tanlanmagan
  const hasValue = value !== 0 && value !== ""
  const selected = options.find((o) => Number(o.value) === Number(value))

  return (
    <div ref={containerRef} className="relative" aria-label={ariaLabel}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex h-[52px] w-full items-center rounded-xl border px-3.5 text-[14px] font-medium",
          "outline-none transition-[border-color,box-shadow] disabled:opacity-60",
          center ? "justify-center gap-1.5" : "justify-between",
          open
            ? "border-foreground bg-white ring-4 ring-[#E4F70A]/60"
            : "border-border-strong bg-white hover:border-[#B0B1B9]",
          hasValue ? "text-foreground" : "text-[#B0B1B9]",
        ].join(" ")}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={["size-4 shrink-0 text-[#8A8C94] transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-52 overflow-auto rounded-xl border border-border-strong bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
        >
          {options.map((opt) => {
            // Faqat string comparison — ikkalasi ham string ga aylantiriladi
            const isSelected = hasValue && String(opt.value) === String(value)
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={[
                  "flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-[14px] font-medium transition-colors",
                  isSelected ? "bg-[#E4F70A]/20 text-foreground" : "text-foreground hover:bg-[#F4F5F0]",
                ].join(" ")}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-[#7A9A00]" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Birth Date Field ─────────────────────────────────────────────────────────

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
]

function daysInMonth(month: number, year: number) {
  if (!month) return 31
  return new Date(year || 2000, month, 0).getDate()
}

function BirthDateField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (iso: string) => void
  disabled?: boolean
}) {
  const [y, m, d] = value ? value.split("-").map(Number) : [0, 0, 0]

  const [localDay, setLocalDay] = useState(d)
  const [localMonth, setLocalMonth] = useState(m)
  const [localYear, setLocalYear] = useState(y)

  // value tashqaridan reset bo'lsa sync qil
  useEffect(() => {
    const [ey, em, ed] = value ? value.split("-").map(Number) : [0, 0, 0]
    setLocalDay(ed)
    setLocalMonth(em)
    setLocalYear(ey)
  }, [value])

  function emit(day: number, month: number, year: number) {
    if (day && month && year) {
      onChange(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
    } else {
      onChange("")
    }
  }

  const dayCount = daysInMonth(localMonth, localYear)
  const currentYear = new Date().getFullYear()

  const dayOptions: SelectOption[] = Array.from({ length: dayCount }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }))
  const monthOptions: SelectOption[] = MONTHS.map((label, i) => ({
    label,
    value: i + 1,
  }))
  const yearOptions: SelectOption[] = Array.from({ length: 80 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  }))

  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomSelect
        ariaLabel="Kun"
        value={localDay}
        onChange={(v) => {
          const day = Number(v)
          setLocalDay(day)
          emit(day, localMonth, localYear)
        }}
        options={dayOptions}
        placeholder="Kun"
        disabled={disabled}
        center
      />
      <CustomSelect
        ariaLabel="Oy"
        value={localMonth}
        onChange={(v) => {
          const month = Number(v)
          const clampedDay = localDay ? Math.min(localDay, daysInMonth(month, localYear)) : 0
          setLocalMonth(month)
          setLocalDay(clampedDay)
          emit(clampedDay, month, localYear)
        }}
        options={monthOptions}
        placeholder="Oy"
        disabled={disabled}
      />
      <CustomSelect
        ariaLabel="Yil"
        value={localYear}
        onChange={(v) => {
          const year = Number(v)
          const clampedDay = localDay ? Math.min(localDay, daysInMonth(localMonth, year)) : 0
          setLocalYear(year)
          setLocalDay(clampedDay)
          emit(clampedDay, localMonth, year)
        }}
        options={yearOptions}
        placeholder="Yil"
        disabled={disabled}
        center
      />
    </div>
  )
}

// ─── Gender options ───────────────────────────────────────────────────────────

const GENDER_OPTIONS: SelectOption[] = [
  { label: "Erkak", value: "male" },
  { label: "Ayol", value: "female" },
]

// ─── Form ────────────────────────────────────────────────────────────────────

function RegisterForm({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nameRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState(searchParams.get("phone") || "+998")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [code, setCode] = useState("")
  const [botLink, setBotLink] = useState("")
  const [expiresIn, setExpiresIn] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === "verify") codeRef.current?.focus()
  }, [step])

  function fail(message: string) {
    setError(message)
    setLoading(false)
    if (!prefersReducedMotion()) {
      shakeRef.current?.animate(
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
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await authApi.register({
        phone: phone.trim(),
        password,
        full_name: fullName.trim(),
        birth_date: birthDate,
        gender,
      })
      setBotLink(res.bot_link || "")
      setExpiresIn(res.expires_in_seconds || 300)
      setLoading(false)
      setStep("verify")
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Ro'yxatdan o'tishda xatolik")
    }
  }

  const telegram = useTelegramLogin({
    onSuccess: (me) => router.push(homeUrlForRole(me.global_role)),
    onError: fail,
  })

  const google = useGoogleLogin({
    text: "signup_with",
    locale: "uz",
    onSuccess: (me) => router.push(homeUrlForRole(me.global_role)),
    onError: fail,
  })

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await authApi.registerVerify({ phone: phone.trim(), code: code.trim() })
      const next = searchParams.get("next")
      if (next) {
        router.push(next)
        return
      }
      const me = await authApi.me().catch(() => null)
      router.push(homeUrlForRole(me?.global_role))
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Kod tasdiqlanmadi")
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={onVerify} noValidate className="w-full">
        <div className="rounded-2xl border border-[#E4F70A]/70 bg-[#F8FBE7] p-4">
          <p className="text-sm font-semibold text-foreground">SMS kodini Telegram orqali oling</p>
          <p className="mt-1 text-xs leading-5 text-[#6F7078]">
            <span className="font-medium text-foreground">{phone}</span> raqamiga kod yuborildi.
            Quyidagi tugma orqali Steply botini oching, Start bosing va <b>SMS kodni olish</b> tugmasini bosing.
          </p>
          {botLink ? (
            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-white transition hover:bg-[#202126]"
            >
              Telegram botini ochish
            </a>
          ) : null}
          <p className="mt-2 text-[11px] text-[#8A8C94]">
            Havola {Math.max(0, Math.ceil(expiresIn / 60))} daqiqa amal qiladi.
          </p>
        </div>

        <div ref={shakeRef} className="mt-4">
          <label htmlFor="code" className="sr-only">Tasdiqlash kodi</label>
          <input
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => { setCode(e.target.value); if (error) setError("") }}
            required
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
            className="h-[52px] w-full rounded-xl border border-border-strong bg-white text-center text-lg font-semibold tracking-[0.5em] text-foreground
                       outline-none transition-[border-color,box-shadow] placeholder:tracking-[0.5em] placeholder:text-[#B0B1B9]
                       focus:border-foreground focus:ring-4 focus:ring-[#E4F70A]/60 disabled:opacity-60"
          />
        </div>

        {error && (
          <p id="register-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} aria-busy={loading} className={primaryButtonClass}>
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Tasdiqlanmoqda…
            </>
          ) : (
            <>
              Tasdiqlash
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setError(""); setStep("form") }}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[#8A8C94] transition-colors hover:text-foreground disabled:opacity-60"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Orqaga qaytish
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={onRegister} noValidate className="w-full">
      <div ref={shakeRef} className="space-y-3.5">

        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="sr-only">To'liq ism</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden="true" />
            <input
              ref={nameRef}
              id="fullName"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); if (error) setError("") }}
              required
              minLength={2}
              placeholder="Ali Valiyev"
              disabled={loading}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="sr-only">Telefon raqam</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden="true" />
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (error) setError("") }}
              required
              placeholder="+998901234567"
              disabled={loading}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Birth date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#8A8C94]">Tug'ilgan sana</label>
          <BirthDateField value={birthDate} onChange={setBirthDate} disabled={loading} />
        </div>

        {/* Gender */}
        <CustomSelect
          ariaLabel="Jins"
          value={gender}
          onChange={(v) => setGender(v as "male" | "female")}
          options={GENDER_OPTIONS}
          placeholder="Jins"
          disabled={loading}
        />

        {/* Password */}
        <div>
          <label htmlFor="password" className="sr-only">Parol</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError("") }}
              required
              minLength={6}
              placeholder="Kamida 6 ta belgi"
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "register-error" : undefined}
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8A8C94] transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p id="register-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} aria-busy={loading} className={primaryButtonClass}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Yuborilmoqda…
          </>
        ) : (
          <>
            Davom etish
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-strong"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-[#8A8C94]">yoki</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="relative h-[40px] w-full flex items-center justify-center">
          {(!google.ready || google.busy) && (
            <div
              className="absolute inset-0 z-10 flex h-[40px] w-full items-center justify-center rounded-[4px] border border-border-strong bg-white px-3 text-[14px] font-medium text-[#3c4043]"
            >
              <Loader2 className="mr-2 size-4 animate-spin text-[#4285F4]" />
              <span>Google yuklanmoqda…</span>
            </div>
          )}
          <div
            ref={google.buttonRef}
            className="w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full"
          />
        </div>

        <button
          type="button"
          onClick={telegram.start}
          disabled={loading || telegram.busy || !telegram.ready}
          className="group relative flex h-[40px] w-full items-center justify-center rounded-[4px] border border-border-strong bg-white px-3
                     text-[14px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] active:bg-[#f1f3f4]
                     focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#229ED9]/50
                     disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {telegram.busy ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#229ED9]" />
              <span>Telegram tasdiqlanmoqda…</span>
            </div>
          ) : (
            <>
              <span className="absolute left-3 flex size-5 items-center justify-center">
                <svg
                  className="size-[18px] transition-transform duration-200 group-hover:scale-105"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
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
              </span>
              <span>Telegram orqali ro'yxatdan o'tish</span>
            </>
          )}
        </button>
      </div>


      <p className="mt-5 text-center text-sm text-[#8A8C94]">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form")

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
      className="relative isolate min-h-svh overflow-hidden bg-[#FBFCF6] text-foreground"
      style={{
        backgroundImage: `radial-gradient(ellipse 40% 45% at 0% 0%, rgba(228,246,10,0.28), transparent 70%),
                          radial-gradient(ellipse 35% 40% at 100% 100%, rgba(228,246,10,0.45), transparent 70%)`,
      }}
    >
      <BackgroundS />

      <div
        className="relative grid min-h-svh w-full items-center gap-10 px-5 py-8
                   sm:px-10 lg:grid-cols-[1fr_minmax(0,50%)] lg:gap-0 lg:px-0 lg:py-0"
      >
        <div ref={headlineRef} className="hidden items-center self-stretch lg:flex lg:pl-[8vw] xl:pl-[10vw]">
          <h1 className="text-[clamp(2.4rem,3.6vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Bugun boshlang,
            <br />
            <span style={{ color: LIME_TEXT }}>ertaga natija ko&lsquo;ring</span>
          </h1>
        </div>

        <div
          ref={cardRef}
          className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white/92 px-6 py-10 shadow-[0_24px_64px_rgba(20,24,0,0.07)]
                     ring-1 ring-black/[0.045] backdrop-blur-sm sm:px-12 sm:py-14
                     lg:mx-auto lg:max-w-[420px] lg:rounded-[32px] lg:px-[52px] lg:py-[68px]"
        >
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <h2 className="mb-7 mt-7 text-2xl font-bold tracking-[-0.02em] sm:text-[26px]">
            {step === "form" ? "Yangi hisob yarating" : "Telefon raqamni tasdiqlang"}
          </h2>

          <Suspense fallback={<div className="h-[420px]" aria-hidden="true" />}>
            <RegisterForm step={step} setStep={setStep} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}