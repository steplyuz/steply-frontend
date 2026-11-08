"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react"

import { useAlphabet } from "@/shared/providers/alphabet-provider"
import {
  AuthDivider,
  AuthError,
  AuthShell,
  PHONE_DIGITS,
  PHONE_PREFIX,
  PhoneField,
  SocialAuth,
  fieldClass,
  primaryButtonClass,
  safeNextPath,
  shake,
} from "@/features/auth/components/auth-shared"
import { authApi } from "@/shared/api"
import { ApiRequestError } from "@/shared/api/client"
import { homeUrlForRole } from "@/shared/providers/auth-context"
import { useTelegramLogin } from "@/features/auth/lib/telegram-login"
import { useGoogleLogin } from "@/features/auth/lib/google-login"

function LoginForm() {
  const { t } = useAlphabet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  // Faqat 9 ta mahalliy raqam saqlanadi; "+998" o'zgarmas prefiks
  const [phoneDigits, setPhoneDigits] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const next = safeNextPath(searchParams.get("next"))

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) phoneRef.current?.focus()
  }, [])

  function fail(message: string) {
    setError(message)
    setLoading(false)
    shake(fieldRef.current)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (phoneDigits.length !== PHONE_DIGITS) {
      fail(t("Telefon raqam to'liq kiritilmagan"))
      return
    }

    const phone = `${PHONE_PREFIX}${phoneDigits}`
    setLoading(true)
    try {
      const res = await authApi.phoneLogin(phone, password)
      if (res.status === "need_registration") {
        router.push(`/register?phone=${encodeURIComponent(phone)}`)
        return
      }
      if (res.status !== "success") {
        fail(res.message || t("Kirishda xatolik yuz berdi"))
        return
      }
      if (next) {
        router.push(next)
        return
      }
      const me = await authApi.me().catch(() => null)
      router.push(homeUrlForRole(me?.global_role))
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : t("Kirishda xatolik yuz berdi"))
    }
  }

  const telegram = useTelegramLogin({
    onSuccess: (me) => router.push(next || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  const google = useGoogleLogin({
    onSuccess: (me) => router.push(next || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div ref={fieldRef} className="space-y-3.5">
        <PhoneField
          value={phoneDigits}
          onChange={(d) => {
            setPhoneDigits(d)
            if (error) setError("")
          }}
          disabled={loading}
          inputRef={phoneRef}
        />

        <div>
          <label htmlFor="password" className="sr-only">
            {t("Parol")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
              placeholder={t("Parol")}
              required
              minLength={6}
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
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

      <div className="mt-3 flex justify-end">
        <Link
          href="/forgot-password"
          className="rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {t("Parolni unutdingizmi?")}
        </Link>
      </div>

      <AuthError id="login-error" message={error} />

      <button type="submit" disabled={loading} aria-busy={loading} className={primaryButtonClass}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {t("Tekshirilmoqda…")}
          </>
        ) : (
          <>
            {t("Kirish")}
            <ArrowRight
              className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      <AuthDivider label="yoki davom eting" />

      <SocialAuth
        google={google}
        telegram={telegram}
        googleLabel="Google orqali kirish"
        telegramLabel="Telegram orqali kirish"
        disabled={loading}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("Hisobingiz yo'qmi?")}{" "}
        <Link href="/register" className="font-semibold text-primary-strong hover:underline">
          {t("Ro'yxatdan o'ting")}
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthShell headlineTop="O‘qishingizni" headlineAccent="bir joydan boshqaring" title="Kirish">
      <Suspense fallback={<div className="h-[220px]" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}