"use client"

import { Suspense, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff, Loader2, Lock, MessageSquare, User } from "lucide-react"

import { useAlphabet } from "@/shared/providers/alphabet-provider"
import {
  AuthDivider,
  AuthError,
  AuthShell,
  PHONE_DIGITS,
  PHONE_PREFIX,
  PhoneField,
  SocialAuth,
  TelegramIcon,
  authInteractiveClass,
  authVisualClass,
  fieldClass,
  formatLocal,
  primaryButtonClass,
  safeNextPath,
  shake,
  toLocalDigits,
} from "@/features/auth/components/auth-shared"
import { authApi } from "@/shared/api"
import { ApiRequestError } from "@/shared/api/client"
import { homeUrlForRole } from "@/shared/providers/auth-context"
import { useTelegramLogin } from "@/features/auth/lib/telegram-login"
import { useGoogleLogin } from "@/features/auth/lib/google-login"

type Step = "form" | "verify"

// ─── Custom Select (kun / oy / yil) ───────────────────────────────────────────

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
  // String bilan solishtiriladi: raqamli (kun/oy/yil) va matnli qiymatlar uchun ham ishlaydi
  const selected = hasValue ? options.find((o) => String(o.value) === String(value)) : undefined

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex h-[52px] w-full items-center rounded-xl border px-3.5 text-[14px] font-medium",
          "outline-none transition-[border-color,box-shadow] disabled:opacity-60",
          center ? "justify-center gap-1.5" : "justify-between",
          open
            ? "border-primary bg-white ring-4 ring-primary/20"
            : "border-border-strong bg-white hover:border-muted-foreground/40",
          selected ? "text-foreground" : "text-muted-foreground/70",
        ].join(" ")}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={["size-4 shrink-0 text-muted-foreground transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-52 overflow-auto rounded-xl border border-border-strong bg-white py-1 shadow-[0_8px_24px_rgba(15,61,38,0.12)]"
        >
          {options.map((opt) => {
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
                  isSelected ? "bg-secondary text-secondary-foreground" : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Segmented choice (jins: Erkak / Ayol) ────────────────────────────────────

function SegmentedChoice<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { label: string; value: T }[]
  disabled?: boolean
}) {
  const labelId = useId()

  function onKeyDown(e: React.KeyboardEvent) {
    const idx = options.findIndex((o) => o.value === value)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      onChange(options[(idx + 1) % options.length].value)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      onChange(options[(idx - 1 + options.length) % options.length].value)
    }
  }

  return (
    <div>
      <span id={labelId} className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown} className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={[
                "flex h-[52px] items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold outline-none",
                "transition-[border-color,background-color,box-shadow,color] focus-visible:ring-4 focus-visible:ring-primary/20",
                "disabled:opacity-60 motion-reduce:transition-none",
                active
                  ? "border-primary bg-secondary text-primary-strong ring-4 ring-primary/15"
                  : "border-border-strong bg-white text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
              ].join(" ")}
            >
              {active && <Check className="size-4 text-primary" aria-hidden />}
              {opt.label}
            </button>
          )
        })}
      </div>
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
  const { t } = useAlphabet()
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
    label: t(label),
    value: i + 1,
  }))
  const yearOptions: SelectOption[] = Array.from({ length: 80 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  }))

  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomSelect
        ariaLabel={t("Kun")}
        value={localDay}
        onChange={(v) => {
          const day = Number(v)
          setLocalDay(day)
          emit(day, localMonth, localYear)
        }}
        options={dayOptions}
        placeholder={t("Kun")}
        disabled={disabled}
        center
      />
      <CustomSelect
        ariaLabel={t("Oy")}
        value={localMonth}
        onChange={(v) => {
          const month = Number(v)
          const clampedDay = localDay ? Math.min(localDay, daysInMonth(month, localYear)) : 0
          setLocalMonth(month)
          setLocalDay(clampedDay)
          emit(clampedDay, month, localYear)
        }}
        options={monthOptions}
        placeholder={t("Oy")}
        disabled={disabled}
      />
      <CustomSelect
        ariaLabel={t("Yil")}
        value={localYear}
        onChange={(v) => {
          const year = Number(v)
          const clampedDay = localDay ? Math.min(localDay, daysInMonth(localMonth, year)) : 0
          setLocalYear(year)
          setLocalDay(clampedDay)
          emit(clampedDay, localMonth, year)
        }}
        options={yearOptions}
        placeholder={t("Yil")}
        disabled={disabled}
        center
      />
    </div>
  )
}

// ─── Gender options ───────────────────────────────────────────────────────────

type Gender = "male" | "female"

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Erkak", value: "male" },
  { label: "Ayol", value: "female" },
]

/** 285 → "4:45" */
function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

// ─── Form ────────────────────────────────────────────────────────────────────

function RegisterForm({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const { t } = useAlphabet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nameRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState("")
  // Faqat 9 ta mahalliy raqam saqlanadi; "+998" o'zgarmas prefiks
  const [phoneDigits, setPhoneDigits] = useState(() => toLocalDigits(searchParams.get("phone") || "", true))
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState<Gender>("male")
  const [code, setCode] = useState("")
  const [botLink, setBotLink] = useState("")
  const [expiresIn, setExpiresIn] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const phone = `${PHONE_PREFIX}${phoneDigits}`
  const phoneDisplay = `${PHONE_PREFIX} ${formatLocal(phoneDigits)}`
  const next = safeNextPath(searchParams.get("next"))

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === "verify") codeRef.current?.focus()
  }, [step])

  // Tasdiqlash bosqichida kod/havola amal qilish muddati bo'yicha teskari sanoq
  useEffect(() => {
    if (step !== "verify" || expiresIn <= 0) return
    setSecondsLeft(expiresIn)
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [step, expiresIn])

  function fail(message: string) {
    setError(message)
    setLoading(false)
    shake(shakeRef.current)
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (phoneDigits.length !== PHONE_DIGITS) {
      fail(t("Telefon raqam to'liq kiritilmagan"))
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({
        phone,
        password,
        full_name: fullName.trim(),
        birth_date: birthDate,
        gender,
      })
      setBotLink(res.bot_link || "")
      setExpiresIn(res.expires_in_seconds || 300)
      setCode("")
      setLoading(false)
      setStep("verify")
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : t("Ro'yxatdan o'tishda xatolik"))
    }
  }

  const telegram = useTelegramLogin({
    onSuccess: (me) => router.push(next || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  const google = useGoogleLogin({
    text: "signup_with",
    locale: "uz",
    onSuccess: (me) => router.push(next || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await authApi.registerVerify({ phone, code: code.trim() })
      if (next) {
        router.push(next)
        return
      }
      const me = await authApi.me().catch(() => null)
      router.push(homeUrlForRole(me?.global_role))
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : t("Kod tasdiqlanmadi"))
    }
  }

  /* ─────────────── 2-bosqich: kodni tasdiqlash ─────────────── */

  if (step === "verify") {
    const expired = expiresIn > 0 && secondsLeft === 0

    return (
      <form onSubmit={onVerify} noValidate className="w-full">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/60 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary ring-1 ring-primary/15">
            <MessageSquare className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("Tasdiqlash kodini kiriting")}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">{phoneDisplay}</span>{" "}
              {t("raqamiga 6 xonali tasdiqlash kodi yuborildi.")}
            </p>
          </div>
        </div>

        <div ref={shakeRef} className="mt-4">
          <label htmlFor="code" className="sr-only">
            {t("Tasdiqlash kodi")}
          </label>
          <input
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              if (error) setError("")
            }}
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
            className="h-[52px] w-full rounded-xl border border-border-strong bg-white text-center text-lg font-semibold tracking-[0.5em] tabular-nums text-foreground
                       outline-none transition-[border-color,box-shadow] placeholder:tracking-[0.5em] placeholder:text-muted-foreground/50
                       focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>

        <AuthError id="register-error" message={error} />

        <button type="submit" disabled={loading || code.length < 6} aria-busy={loading} className={primaryButtonClass}>
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {t("Tasdiqlanmoqda…")}
            </>
          ) : (
            <>
              {t("Tasdiqlash")}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </>
          )}
        </button>

        {/* SMS kelmasa: kodni Telegram bot orqali olish */}
        <div className="mt-6 rounded-3xl border border-border-strong bg-white p-4">
          <p className="text-sm font-semibold text-foreground">{t("SMS kelmadimi?")}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("Kodni Telegram orqali oling: botni oching, Start bosing va")} <b className="text-foreground">{t("SMS kodni olish")}</b>{" "}
            {t("tugmasini bosing.")}
          </p>

          {botLink ? (
            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${authVisualClass} ${authInteractiveClass} group mt-3 !h-12`}
            >
              <TelegramIcon className="size-5 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none" />
              <span>{t("Telegram orqali kodni olish")}</span>
            </a>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">{t("Telegram havolasi hozircha mavjud emas.")}</p>
          )}

          {expiresIn > 0 && (
            <p className={`mt-2.5 text-[11px] ${expired ? "text-error" : "text-muted-foreground"}`} aria-live="polite">
              {expired ? (
                t("Muddat tugadi. Orqaga qaytib, qayta urinib ko'ring.")
              ) : (
                <>
                  {t("Kod amal qilish muddati:")} <span className="font-semibold tabular-nums">{formatCountdown(secondsLeft)}</span>
                </>
              )}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setError("")
            setStep("form")
          }}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("Orqaga qaytish")}
        </button>
      </form>
    )
  }

  /* ─────────────── 1-bosqich: ro'yxatdan o'tish formasi ─────────────── */

  return (
    <form onSubmit={onRegister} noValidate className="w-full">
      <div ref={shakeRef} className="space-y-3.5">

        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="sr-only">{t("To'liq ism")}</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={nameRef}
              id="fullName"
              autoComplete="name"
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

        {/* Phone: +998 o'zgarmas, faqat 9 ta raqam kiritiladi */}
        <PhoneField
          value={phoneDigits}
          onChange={(d) => {
            setPhoneDigits(d)
            if (error) setError("")
          }}
          disabled={loading}
        />

        {/* Birth date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t("Tug'ilgan sana")}</label>
          <BirthDateField value={birthDate} onChange={setBirthDate} disabled={loading} />
        </div>

        {/* Gender */}
        <SegmentedChoice
          label={t("Jins")}
          value={gender}
          onChange={setGender}
          options={GENDER_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
          disabled={loading}
        />

        {/* Password */}
        <div>
          <label htmlFor="password" className="sr-only">{t("Parol")}</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError("") }}
              required
              minLength={6}
              placeholder={t("Kamida 6 ta belgi")}
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "register-error" : undefined}
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("Parolni yashirish") : t("Parolni ko'rsatish")}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      <AuthError id="register-error" message={error} />

      <button type="submit" disabled={loading} aria-busy={loading} className={primaryButtonClass}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {t("Yuborilmoqda…")}
          </>
        ) : (
          <>
            {t("Davom etish")}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
          </>
        )}
      </button>

      <AuthDivider label="yoki davom eting" />

      <SocialAuth
        google={google}
        telegram={telegram}
        googleLabel="Google orqali davom etish"
        telegramLabel="Telegram orqali davom etish"
        disabled={loading}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("Hisobingiz bormi?")}{" "}
        <Link href="/login" className="font-semibold text-primary-strong hover:underline">
          {t("Kirish")}
        </Link>
      </p>
    </form>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form")

  return (
    <AuthShell
      headlineTop="Bugun boshlang,"
      headlineAccent="ertaga natija ko‘ring"
      title={step === "form" ? "Yangi hisob yarating" : "Telefon raqamni tasdiqlang"}
    >
      <Suspense fallback={<div className="h-[420px]" aria-hidden="true" />}>
        <RegisterForm step={step} setStep={setStep} />
      </Suspense>
    </AuthShell>
  )
}