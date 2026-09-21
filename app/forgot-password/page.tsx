"use client"

import { useId, useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, ArrowLeft, ArrowRight, Check, KeyRound, Loader2, Lock, Phone } from "lucide-react"

import { authApi } from "@/lib/api/endpoints"
import { ApiRequestError } from "@/lib/api/client"

// ─── Constants ────────────────────────────────────────────────────────────────

const LIME = "#E4F60A"
const LIME_TEXT = "#7A9A00"
const S_PATH =
  "M23 48L12 66L12 68L8 75L4 87L3 95L2 96L2 101L1 102L1 113L0 114L1 131L2 132L2 137L7 155L17 176L22 184L34 198L47 209L61 218L65 219L70 222L87 227L92 227L93 228L316 228L317 229L324 229L330 232L339 242L341 248L341 261L337 270L329 278L324 280L58 280L57 281L45 282L32 287L20 295L13 302L6 312L6 314L1 325L1 330L0 331L0 361L4 366L6 367L300 367L301 368L308 368L309 367L316 367L317 368L324 368L325 367L346 367L347 366L352 366L353 365L357 365L364 363L385 353L399 343L412 330L420 320L421 317L425 312L434 293L439 275L439 270L441 263L441 239L440 238L440 232L439 231L438 222L430 200L428 198L428 196L420 183L407 168L399 161L386 152L376 147L362 142L354 141L353 140L346 140L345 139L115 139L107 135L101 128L97 118L97 109L98 108L98 105L103 96L108 91L114 88L375 88L376 87L386 87L387 86L394 85L402 81L404 81L415 74L426 63L433 51L437 38L437 6L434 2L430 0L108 0L107 1L100 1L99 2L87 4L73 10L71 10L61 15L41 29Z"
const S_VIEWBOX = "0 0 442 369"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Shared styles ────────────────────────────────────────────────────────────

const fieldClass =
  "h-[52px] w-full rounded-xl border border-[#DCDDE2] bg-white pl-14 pr-4 text-[15px] font-medium text-[#0B0B0B] " +
  "outline-none transition-[border-color,box-shadow] placeholder:text-[#B0B1B9] " +
  "focus:border-[#0B0B0B] focus:ring-4 focus:ring-[#E4F60A]/60 disabled:opacity-60"

const primaryButtonClass =
  "group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4F53C] px-5 " +
  "text-[15px] font-semibold text-[#0B0B0B] transition-[transform,background-color,box-shadow] " +
  "hover:bg-[#CAF02A] hover:shadow-[0_8px_28px_rgba(180,226,0,0.38)] active:scale-[0.99] " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B0B0B]/15 " +
  "disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Steply.uz"
      width={140}
      height={48}
      priority
      style={{ height: 48, width: "auto", maxWidth: 140 }}
      className="object-contain"
    />
  )
}

// ─── Background S ─────────────────────────────────────────────────────────────

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

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
      {([1, 2] as const).map((s) => (
        <span
          key={s}
          className={[
            "h-1.5 rounded-full transition-all duration-300",
            s === current ? "w-6 bg-[#0B0B0B]" : "w-1.5 bg-[#DCDDE2]",
          ].join(" ")}
        />
      ))}
    </div>
  )
}

// ─── Success banner ───────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#C8EF4A] bg-[#F3FDD0] p-3.5 text-sm font-medium text-[#4A6300]">
      <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function ForgotForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("+998")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const shakeRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) phoneRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === 2) codeRef.current?.focus()
  }, [step])

  function fail(msg: string) {
    setError(msg)
    setBusy(false)
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

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setBusy(true)
    try {
      await authApi.forgotPassword(phone.trim())
      setStep(2)
      setSuccess("Tasdiqlash kodi yuborildi.")
      setBusy(false)
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Xatolik yuz berdi")
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setBusy(true)
    try {
      await authApi.resetPassword({ phone: phone.trim(), code: code.trim(), new_password: password })
      setDone(true)
      setSuccess("Parol muvaffaqiyatli yangilandi!")
      setBusy(false)
    } catch (err) {
      fail(err instanceof ApiRequestError ? err.message : "Kod noto'g'ri yoki muddati o'tgan")
    }
  }

  // ── Done state ──
  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#E4F60A]/30">
          <Check className="size-7 text-[#7A9A00]" aria-hidden />
        </div>
        <p className="text-[15px] font-medium text-[#0B0B0B]">Parol yangilandi!</p>
        <p className="mt-1.5 text-sm text-[#8A8C94]">Endi yangi parolingiz bilan tizimga kirishingiz mumkin.</p>
        <Link href="/login" className={`${primaryButtonClass} mt-6 no-underline`}>
          Tizimga kirish
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
        <p className="mb-5 text-sm text-[#8A8C94]">
          Telefon raqamingizni kiriting — tasdiqlash kodini SMS orqali yuboramiz.
        </p>

        <div ref={shakeRef}>
          <label htmlFor="fp-phone" className="sr-only">Telefon raqam</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden />
            <input
              ref={phoneRef}
              id="fp-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (error) setError("") }}
              required
              placeholder="+998901234567"
              disabled={busy}
              aria-invalid={!!error}
              aria-describedby={error ? "fp-error" : undefined}
              className={fieldClass}
            />
          </div>
        </div>

        {error && (
          <p id="fp-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} aria-busy={busy} className={primaryButtonClass}>
          {busy ? (
            <><Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />Yuborilmoqda…</>
          ) : (
            <><span>Kod yuborish</span><ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden /></>
          )}
        </button>

        <p className="mt-5 text-center text-sm text-[#8A8C94]">
          Esladingizmi?{" "}
          <Link href="/login" className="font-semibold text-[#0B0B0B] hover:underline">
            Kirish
          </Link>
        </p>
      </form>
    )
  }

  // ── Step 2: code + new password ──
  return (
    <form onSubmit={onReset} noValidate className="w-full">
      <StepDots current={2} />

      {success && <SuccessBanner message={success} />}

      <p className="mb-5 mt-4 text-sm text-[#8A8C94]">
        <span className="font-medium text-[#0B0B0B]">{phone}</span> ga yuborilgan kodni va yangi parolni kiriting.
      </p>

      <div ref={shakeRef} className="space-y-3.5">
        {/* Code */}
        <div>
          <label htmlFor="fp-code" className="sr-only">Tasdiqlash kodi</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden />
            <input
              ref={codeRef}
              id="fp-code"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (error) setError("") }}
              required
              maxLength={6}
              inputMode="numeric"
              placeholder="6 xonali kod"
              disabled={busy}
              aria-invalid={!!error}
              aria-describedby={error ? "fp-error" : undefined}
              className={fieldClass}
            />
          </div>
        </div>

        {/* New password */}
        <div>
          <label htmlFor="fp-password" className="sr-only">Yangi parol</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]" aria-hidden />
            <input
              id="fp-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError("") }}
              required
              minLength={6}
              placeholder="Kamida 6 ta belgi"
              disabled={busy}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <p id="fp-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} aria-busy={busy} className={primaryButtonClass}>
        {busy ? (
          <><Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />Saqlanmoqda…</>
        ) : (
          <><span>Parolni yangilash</span><ArrowRight className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden /></>
        )}
      </button>

      <button
        type="button"
        onClick={() => { setError(""); setSuccess(""); setStep(1) }}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[#8A8C94] transition-colors hover:text-[#0B0B0B] disabled:opacity-60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Raqamni o'zgartirish
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
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
      className="relative isolate min-h-svh overflow-hidden bg-[#FBFCF6] text-[#0B0B0B]"
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
        {/* Left headline (desktop only) */}
        <div ref={headlineRef} className="hidden items-center self-stretch lg:flex lg:pl-[8vw] xl:pl-[10vw]">
          <h1 className="text-[clamp(2.4rem,3.6vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Parolni unutdingizmi?
            <br />
            <span style={{ color: LIME_TEXT }}>Xavotir olmang!</span>
          </h1>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white/92 px-6 py-10 shadow-[0_24px_64px_rgba(20,24,0,0.07)]
                     ring-1 ring-black/[0.045] backdrop-blur-sm sm:px-12 sm:py-14
                     lg:mx-auto lg:max-w-[420px] lg:rounded-[32px] lg:px-[52px] lg:py-[68px]"
        >
          <div className="flex justify-center">
            <Logo />
          </div>

          <h2 className="mb-7 mt-7 text-2xl font-bold tracking-[-0.02em] sm:text-[26px]">
            Parolni tiklash
          </h2>

          <ForgotForm />
        </div>
      </div>
    </main>
  )
}