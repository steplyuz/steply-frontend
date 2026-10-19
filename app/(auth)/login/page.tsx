"use client"

import { Suspense, useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Phone } from "lucide-react"

import { authApi } from "@/lib/api"
import { ApiRequestError } from "@/lib/api/client"
import { homeUrlForRole } from "@/lib/auth/auth-context"
import { useTelegramLogin } from "@/lib/auth/telegram-login"
import { useGoogleLogin } from "@/lib/auth/google-login"

const LIME = "#E4F70A"
const LIME_TEXT = "#7A9A00"

function useEntrance<T extends HTMLElement>(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return
    el.animate(keyframes, { fill: "backwards", easing: "cubic-bezier(0.16, 1, 0.3, 1)", ...options })
  }, [])
  return ref
}

const S_PATH = "M23 48L12 66L12 68L8 75L4 87L3 95L2 96L2 101L1 102L1 113L0 114L1 131L2 132L2 137L7 155L17 176L22 184L34 198L47 209L61 218L65 219L70 222L87 227L92 227L93 228L316 228L317 229L324 229L330 232L339 242L341 248L341 261L337 270L329 278L324 280L58 280L57 281L45 282L32 287L20 295L13 302L6 312L6 314L1 325L1 330L0 331L0 361L4 366L6 367L300 367L301 368L308 368L309 367L316 367L317 368L324 368L325 367L346 367L347 366L352 366L353 365L357 365L364 363L385 353L399 343L412 330L420 320L421 317L425 312L434 293L439 275L439 270L441 263L441 239L440 238L440 232L439 231L438 222L430 200L428 198L428 196L420 183L407 168L399 161L386 152L376 147L362 142L354 141L353 140L346 140L345 139L115 139L107 135L101 128L97 118L97 109L98 108L98 105L103 96L108 91L114 88L375 88L376 87L386 87L387 86L394 85L402 81L404 81L415 74L426 63L433 51L437 38L437 6L434 2L430 0L108 0L107 1L100 1L99 2L87 4L73 10L71 10L61 15L41 29Z"
const S_VIEWBOX = "0 0 442 369"

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: { w: 80, h: 28 }, md: { w: 110, h: 38 }, lg: { w: 140, h: 48 } }
  const { w, h } = sizes[size]
  return (
    <Image src="/logo.png" alt="Steply.uz" width={w} height={h} priority style={{ height: h, width: "auto", maxWidth: w }} className="object-contain" />
  )
}

function BackgroundS() {
  const gid = useId()
  const ref = useEntrance<HTMLDivElement>([
    { opacity: 0, transform: "translate3d(-40px, 40px, 0)" },
    { opacity: 1, transform: "translate3d(0, 0, 0)" },
  ], { duration: 1400, delay: 50 })
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute -bottom-[16vw] -left-[6vw] w-[84vw] lg:-bottom-[8vw] lg:-left-[2vw] lg:w-[58vw]">
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  const [phone, setPhone] = useState("+998")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) phoneRef.current?.focus()
  }, [])

  function fail(message: string) {
    setError(message)
    setLoading(false)
    if (!(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      fieldRef.current?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "translateX(0)" }],
        { duration: 380, easing: "ease-out" },
      )
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await authApi.phoneLogin(phone.trim(), password)
      if (res.status === "need_registration") {
        router.push(`/register?phone=${encodeURIComponent(phone.trim())}`)
        return
      }
      if (res.status !== "success") {
        fail(res.message || "Kirishda xatolik yuz berdi")
        return
      }
      const next = searchParams.get("next")
      if (next) {
        router.push(next)
        return
      }
      const me = await authApi.me().catch(() => null)
      router.push(homeUrlForRole(me?.global_role))
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Kirishda xatolik yuz berdi")
    }
  }

  const telegram = useTelegramLogin({
    onSuccess: (me) => router.push(searchParams.get("next") || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  const google = useGoogleLogin({
    onSuccess: (me) => router.push(searchParams.get("next") || homeUrlForRole(me.global_role)),
    onError: fail,
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div ref={fieldRef} className="space-y-3.5">
        <div className="relative">
          <Phone className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden="true" />
          <input
            ref={phoneRef}
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); if (error) setError(""); }}
            placeholder="+998901234567"
            required
            disabled={loading}
            className="h-[52px] w-full rounded-xl border border-border-strong bg-white pl-14 pr-4 text-[15px] font-medium text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-[#B0B1B9] focus:border-foreground focus:ring-4 focus:ring-[#E4F70A]/60 disabled:opacity-60"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
            required
            minLength={6}
            disabled={loading}
            className="h-[52px] w-full rounded-xl border border-border-strong bg-white pl-14 pr-12 text-[15px] font-medium text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-[#B0B1B9] focus:border-foreground focus:ring-4 focus:ring-[#E4F70A]/60 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8A8C94] transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Link href="/forgot-password" className="text-xs font-semibold text-[#8A8C94] hover:text-foreground">Parolni unutdingizmi?</Link>
      </div>
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4F53C] px-5 text-[15px] font-semibold text-foreground transition-all hover:bg-[#CAF02A] hover:shadow-[0_8px_28px_rgba(180,226,0,0.38)] active:scale-[0.99] disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Tekshirilmoqda…
          </>
        ) : (
          <>
            Kirish
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border-strong"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-[#8A8C94]">yoki</span></div>
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
          className="group relative flex h-[40px] w-full items-center justify-center rounded-[4px] border border-border-strong bg-white px-3 text-[14px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] active:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#229ED9]/50 disabled:cursor-not-allowed disabled:opacity-60"
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
              <span>Telegram orqali kirish</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-[#8A8C94]">
        Hisobingiz yo'qmi? <Link href="/register" className="font-semibold text-foreground hover:underline">Ro'yxatdan o'ting</Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  const headlineRef = useEntrance<HTMLDivElement>([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 150 })
  const cardRef = useEntrance<HTMLDivElement>([{ opacity: 0, transform: "translateY(24px) scale(0.98)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 300 })

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#FBFCF6] text-foreground" style={{ backgroundImage: `radial-gradient(ellipse 40% 45% at 0% 0%, rgba(228,246,10,0.28), transparent 70%), radial-gradient(ellipse 35% 40% at 100% 100%, rgba(228,246,10,0.45), transparent 70%)` }}>
      <BackgroundS />
      <div className="relative grid min-h-svh w-full items-center gap-10 px-5 py-8 sm:px-10 lg:grid-cols-[1fr_minmax(0,50%)] lg:gap-0 lg:px-0 lg:py-0">
        <div ref={headlineRef} className="hidden items-center self-stretch lg:flex lg:pl-[8vw] xl:pl-[10vw]">
          <h1 className="text-[clamp(2.4rem,3.6vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            O&lsquo;qishingizni<br /><span style={{ color: LIME_TEXT }}>bir joydan boshqaring</span>
          </h1>
        </div>
        <div ref={cardRef} className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white/92 px-6 py-10 shadow-[0_24px_64px_rgba(20,24,0,0.07)] ring-1 ring-black/[0.045] backdrop-blur-sm sm:px-12 sm:py-14 lg:mx-auto lg:max-w-[420px] lg:rounded-[32px] lg:px-[52px] lg:py-[68px]">
          <div className="flex justify-center"><Logo size="lg" /></div>
          <h2 className="mb-7 mt-7 text-2xl font-bold tracking-[-0.02em] sm:text-[26px]">Kirish</h2>
          <Suspense fallback={<div className="h-[220px]" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
