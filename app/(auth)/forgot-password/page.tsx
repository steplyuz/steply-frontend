"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, KeyRound, Loader2, Lock } from "lucide-react"

import { Uz, useAlphabet } from "@/shared/providers/alphabet-provider"
import {
  AuthError,
  AuthShell,
  PHONE_DIGITS,
  PHONE_PREFIX,
  PhoneField,
  fieldClass,
  formatLocal,
  primaryButtonClass,
  shake,
} from "@/features/auth/components/auth-shared"
import { authApi } from "@/shared/api"
import { ApiRequestError } from "@/shared/api/client"

/* Parolni tiklash: login/register bilan bir xil qobiq (AuthShell), +998 o‘zgarmas telefon maydoni,
   barcha matnlar t()/<Uz> orqali tanlangan til va alifboga o‘tadi. Lime ranglar va eski logo olib tashlangan. */

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
      {([1, 2] as const).map((s) => (
        <span
          key={s}
          className={[
            "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
            s === current ? "w-6 bg-primary" : "w-1.5 bg-border-strong",
          ].join(" ")}
        />
      ))}
    </div>
  )
}

// ─── Success banner ───────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-4 flex items-start gap-2.5 rounded-2xl border border-brand-soft bg-secondary p-3.5 text-sm font-medium text-primary-strong"
    >
      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      {message}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function ForgotForm() {
  const { t } = useAlphabet()
  const [step, setStep] = useState<1 | 2>(1)
  // Faqat 9 ta mahalliy raqam saqlanadi; "+998" o‘zgarmas prefiks
  const [phoneDigits, setPhoneDigits] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const shakeRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const phone = `${PHONE_PREFIX}${phoneDigits}`
  const phoneDisplay = `${PHONE_PREFIX} ${formatLocal(phoneDigits)}`

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) phoneRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === 2) codeRef.current?.focus()
  }, [step])

  /* Server va o‘zimizning xabarlar ham tanlangan til/alifboga o‘tadi */
  function fail(msg: string) {
    setError(t(msg))
    setBusy(false)
    shake(shakeRef.current)
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setShowSuccess(false)

    if (phoneDigits.length !== PHONE_DIGITS) {
      fail("Telefon raqam to'liq kiritilmagan")
      return
    }

    setBusy(true)
    try {
      await authApi.forgotPassword(phone)
      setStep(2)
      setShowSuccess(true)
      setBusy(false)
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Xatolik yuz berdi")
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setShowSuccess(false)
    setBusy(true)
    try {
      await authApi.resetPassword({ phone, code: code.trim(), new_password: password })
      setDone(true)
      setBusy(false)
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Kod noto'g'ri yoki muddati o'tgan")
    }
  }

  // ── Done state ──
  if (done) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-brand-soft">
          <Check className="size-7 text-primary" aria-hidden />
        </div>
        <p className="text-[15px] font-semibold text-foreground">
          <Uz>Parol yangilandi!</Uz>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          <Uz>Endi yangi parolingiz bilan tizimga kirishingiz mumkin.</Uz>
        </p>
        <Link href="/login" className={`${primaryButtonClass} no-underline`}>
          <Uz>Tizimga kirish</Uz>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
        </Link>
      </div>
    )
  }

  // ── Step 1: phone ──
  if (step === 1) {
    return (
      <form onSubmit={onSend} noValidate className="w-full">
        <StepDots current={1} />
        <p className="mb-5 text-sm text-muted-foreground">
          <Uz>Telefon raqamingizni kiriting — tasdiqlash kodini SMS orqali yuboramiz.</Uz>
        </p>

        <div ref={shakeRef}>
          <PhoneField
            id="fp-phone"
            value={phoneDigits}
            onChange={(d) => {
              setPhoneDigits(d)
              if (error) setError("")
            }}
            disabled={busy}
            inputRef={phoneRef}
          />
        </div>

        <AuthError id="fp-error" message={error} />

        <button type="submit" disabled={busy} aria-busy={busy} className={primaryButtonClass}>
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
              {t("Yuborilmoqda…")}
            </>
          ) : (
            <>
              <span>{t("Kod yuborish")}</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
            </>
          )}
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t("Esladingizmi?")}{" "}
          <Link href="/login" className="font-semibold text-primary-strong hover:underline">
            {t("Kirish")}
          </Link>
        </p>
      </form>
    )
  }

  // ── Step 2: code + new password ──
  return (
    <form onSubmit={onReset} noValidate className="w-full">
      <StepDots current={2} />

      {showSuccess && <SuccessBanner message={t("Tasdiqlash kodi yuborildi.")} />}

      <p className="mb-5 mt-4 text-sm text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">{phoneDisplay}</span>{" "}
        {t("raqamiga yuborilgan kodni va yangi parolni kiriting.")}
      </p>

      <div ref={shakeRef} className="space-y-3.5">
        {/* Code */}
        <div>
          <label htmlFor="fp-code" className="sr-only">
            {t("Tasdiqlash kodi")}
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              ref={codeRef}
              id="fp-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                if (error) setError("")
              }}
              required
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("6 xonali kod")}
              disabled={busy}
              aria-invalid={!!error}
              aria-describedby={error ? "fp-error" : undefined}
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>

        {/* New password */}
        <div>
          <label htmlFor="fp-password" className="sr-only">
            {t("Yangi parol")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              id="fp-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
              required
              minLength={6}
              placeholder={t("Kamida 6 ta belgi")}
              disabled={busy}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <AuthError id="fp-error" message={error} />

      <button type="submit" disabled={busy || code.length < 6 || password.length < 6} aria-busy={busy} className={primaryButtonClass}>
        {busy ? (
          <>
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
            {t("Saqlanmoqda…")}
          </>
        ) : (
          <>
            <span>{t("Parolni yangilash")}</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setError("")
          setShowSuccess(false)
          setStep(1)
        }}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("Raqamni o'zgartirish")}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  return (
    <AuthShell headlineTop="Parolni unutdingizmi?" headlineAccent="Xavotir olmang!" title="Parolni tiklash">
      <ForgotForm />
    </AuthShell>
  )
}