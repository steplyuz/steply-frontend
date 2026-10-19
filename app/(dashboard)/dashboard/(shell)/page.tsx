'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { BookOpen, Headphones, Mic, Pencil, ArrowUpRight, CreditCard, RefreshCw, Lightbulb, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useApi } from '@/lib/api/use-api'
import type { BillingLimits } from '@/lib/api/types'

/* ───────────── Palette ─────────────
   Asosiy: LIME (urg‘u) + foreground (to‘q) + oq/neytral.
   Ko‘nikmalar faqat ikonka rangi sifatida o‘z rangiga ega — sahifa "kamalak"ga aylanmaydi. */

const LIME = '#E4F70A'

const PRACTICE_SKILLS = [
  { href: '/dashboard/reading', label: 'Reading', description: 'Matn o‘qing, savollarga javob bering', icon: BookOpen, tint: '#E6EEFF', accent: '#2563EB' },
  { href: '/dashboard/listening', label: 'Listening', description: 'Audio tinglang, tushunishingizni sinang', icon: Headphones, tint: '#F3E8FF', accent: '#9333EA' },
  { href: '/dashboard/writing', label: 'Writing', description: 'Yozma topshiriqlarni bajaring', icon: Pencil, tint: '#FFEDD5', accent: '#EA580C' },
  { href: '/dashboard/speaking', label: 'Speaking', description: 'Gapiring, talaffuzingizni yaxshilang', icon: Mic, tint: '#FFE4E6', accent: '#E11D48' },
]

const TIPS = [
  'Reading: avval savollarni o‘qing, keyin matnda kalit so‘zlarni qidiring.',
  'Listening: audio boshlanishidan oldin savollarga ko‘z yugurtirib chiqing.',
  'Writing: yozishdan oldin 2 daqiqa reja tuzing — fikrlar tartibli chiqadi.',
  'Speaking: javobingizni "fikr + sabab + misol" tuzilmasida bering.',
  'Har kuni 15 daqiqa mashq qilish haftada bir marta 2 soat o‘tirishdan samaraliroq.',
  'Xatolaringizni yozib boring — takroriy xatolar eng tez o‘sish nuqtangiz.',
]

const card = 'relative overflow-hidden rounded-3xl'
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function barColor(ratio: number) {
  if (ratio >= 1) return '#FB7185'
  if (ratio >= 0.8) return '#FB923C'
  return LIME
}

/** Dekorativ halqa — faqat bezak, ekran o‘quvchilardan yashirilgan */
function Circle({ color, width = 18, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}

function Ring({ used, limit }: { used: number; limit: number }) {
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0
  const left = Math.max(limit - used, 0)
  return (
    <div
      className="relative size-28 shrink-0 sm:size-36"
      role="img"
      aria-label={`Bu hafta ${left} ta mashq qoldi, jami ${limit} ta`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={barColor(ratio)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none tabular-nums sm:text-4xl">{left}</span>
        <span className="mt-1 text-[11px] font-medium text-white/60">qoldi</span>
      </div>
    </div>
  )
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const ratio = limit && limit > 0 ? Math.min(used / limit, 1) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-white/75">{label}</span>
        <span className="text-sm tabular-nums text-white/55">
          <b className="text-base font-bold text-white">{used}</b> / {limit ?? '∞'}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${ratio * 100}%`, background: barColor(ratio) }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const limits = useApi<BillingLimits>('/billing/me/limits')
  const name = user?.profile?.full_name || ''
  const firstName = name.replace(/[^\p{L}\p{N}\s'‘’-]/gu, '').trim().split(/\s+/)[0]

  const practice = limits.data?.practice
  const weeklyLimit = num(practice?.weekly_limit)
  const weeklyUsed = num(practice?.used_this_week) ?? 0
  const monthlyLimit = num(practice?.monthly_limit)
  const monthlyUsed = num(practice?.used_this_month) ?? 0

  const hasLimits = !!practice && weeklyLimit !== null
  const weeklyLeft = hasLimits ? Math.max((weeklyLimit as number) - weeklyUsed, 0) : 0
  const weeklyRatio = hasLimits && (weeklyLimit as number) > 0 ? weeklyUsed / (weeklyLimit as number) : 0

  // Hydration muammosi bo‘lmasligi uchun sana klientda hisoblanadi
  const [tipIndex, setTipIndex] = useState(0)
  useEffect(() => {
    setTipIndex(Math.floor(Date.now() / 86_400_000) % TIPS.length)
  }, [])

  return (
    <div className="space-y-5 pb-8 sm:space-y-8">
      {/* ───── Hero + limit ───── */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className={`${card} flex flex-col justify-between p-6 text-foreground sm:p-10 lg:col-span-3 lg:min-h-80`} style={{ background: LIME }}>
          <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />

          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Mashq paneli
            </span>
            <h1 className="mt-4 break-words text-[2.5rem] font-black leading-none tracking-tighter sm:mt-5 sm:text-6xl sm:leading-[0.98]">
              {firstName ? (
                <>
                  Salom,
                  <br className="hidden sm:block" /> {firstName}!
                </>
              ) : (
                <>
                  Xush
                  <br className="hidden sm:block" /> kelibsiz!
                </>
              )}
            </h1>
            <p className="mt-3 max-w-md text-[15px] font-medium leading-6 text-foreground/70 sm:text-base">
              Bugun qaysi ko‘nikmani mashq qilamiz?
            </p>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-8">
            <Link
              href="/dashboard/reading"
              className={`group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 active:scale-[0.98] motion-reduce:transition-none min-[420px]:w-fit min-[420px]:justify-start ${focusRing}`}
            >
              Mashqni boshlash
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
            {hasLimits ? (
              <span className="text-sm font-semibold text-foreground/75">
                Bu hafta <b className="tabular-nums text-foreground">{weeklyLeft}</b> ta mashq qoldi
              </span>
            ) : null}
          </div>
        </div>

        <div className={`${card} bg-foreground p-5 text-white sm:p-8 lg:col-span-2`} aria-live="polite">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-bottom-16 -left-16 size-40 sm:size-52" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold sm:text-lg">Limit sarfi</h2>
                <p className="mt-0.5 text-xs text-white/55">Haftalik va oylik mashqlar</p>
              </div>
              <button
                type="button"
                onClick={limits.reload}
                disabled={limits.loading}
                aria-label="Yangilash"
                className="-mr-1 -mt-1 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <RefreshCw className={`size-4 ${limits.loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>
            </div>

            {limits.loading && !limits.data ? (
              <div className="mt-6 flex items-center gap-4" aria-busy="true">
                <div className="size-28 shrink-0 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none sm:size-36" />
                <div className="w-full space-y-4">
                  <div className="h-3 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                  <div className="h-3 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                </div>
              </div>
            ) : limits.error ? (
              <div role="alert" className="mt-6">
                <p className="text-sm font-semibold">Limitlarni yuklab bo‘lmadi</p>
                <p className="mt-1 text-sm text-white/60">{limits.error.message}</p>
                <button
                  type="button"
                  onClick={limits.reload}
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
                >
                  Qayta urinish
                </button>
              </div>
            ) : practice && weeklyLimit !== null ? (
              <div className="mt-6 flex items-center gap-5 sm:gap-6 lg:flex-col xl:flex-row">
                <Ring used={weeklyUsed} limit={weeklyLimit} />
                <div className="w-full min-w-0 space-y-4 sm:space-y-5">
                  <UsageBar label="Haftalik" used={weeklyUsed} limit={weeklyLimit} />
                  <UsageBar label="Oylik" used={monthlyUsed} limit={monthlyLimit} />
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-white/60">
                Limit ma’lumotlari topilmadi. Birinchi mashqni boshlang — sarf shu yerda ko‘rinadi.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ───── Limit ogohlantirishi ───── */}
      {hasLimits && weeklyRatio >= 0.8 ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-[#FFF1E6] p-3 ring-1 ring-[#F97316]/40 sm:rounded-3xl sm:p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-white">
            <Zap aria-hidden="true" className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
            {weeklyLeft > 0
              ? `Haftalik limit tugab bormoqda — ${weeklyLeft} ta mashq qoldi.`
              : 'Haftalik limit tugadi. Davom etish uchun tarifni almashtiring.'}
          </p>
          <Link
            href="/dashboard/billing"
            className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-4 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-95 sm:px-5 ${focusRing}`}
          >
            Tariflar
          </Link>
        </div>
      ) : null}

      {/* ───── Ko‘nikmalar ───── */}
      <section aria-labelledby="practice-skills">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div>
            <h2 id="practice-skills" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">
              Mashq bo‘limlari
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Bo‘limni tanlang va mashqni boshlang</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PRACTICE_SKILLS.map(({ href, label, description, icon: Icon, tint, accent }) => (
            <Link
              key={href}
              href={href}
              style={{ '--accent': accent, background: `linear-gradient(160deg, ${tint} 0%, #ffffff 65%)` } as CSSProperties}
              className={`group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-4 text-foreground ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:ring-[var(--accent)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-56 sm:p-6 ${focusRing}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex size-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 sm:size-14 sm:rounded-2xl"
                  style={{ color: accent }}
                >
                  <Icon aria-hidden="true" className="size-5 sm:size-7" strokeWidth={1.75} />
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-white text-foreground/70 ring-1 ring-black/5 transition duration-300 group-hover:rotate-45 group-hover:bg-[var(--accent)] group-hover:text-white motion-reduce:transition-none sm:size-10"
                >
                  <ArrowUpRight className="size-4 sm:size-5" />
                </span>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-black tracking-tight sm:text-2xl">{label}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-foreground/65 sm:text-sm sm:leading-5">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Maslahat + Tarif ───── */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-[#16603A] p-5 text-white sm:rounded-[32px] sm:p-8">
          <Circle color="rgba(255,255,255,0.08)" width={18} className="-bottom-12 -right-12 size-36 sm:size-48" />
          <span className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-white/85">
            <Lightbulb aria-hidden="true" className="size-4" style={{ color: LIME }} />
            Bugungi maslahat
          </span>
          <p className="relative z-10 mt-2 max-w-[85%] text-base font-bold leading-snug sm:mt-4 sm:max-w-none sm:text-2xl">{TIPS[tipIndex]}</p>
        </div>

        <div className={`${card} flex flex-col justify-between gap-5 bg-white p-5 ring-1 ring-black/10 sm:gap-6 sm:p-8`}>
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
              <CreditCard aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-foreground sm:text-lg">Tarif va limitlar</h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                Obunani tekshiring yoki ko‘proq mashq uchun tarifni almashtiring.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-foreground px-6 py-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] sm:w-fit ${focusRing}`}
          >
            Tariflarni ko‘rish
          </Link>
        </div>
      </section>
    </div>
  )
}