'use client'

import { useEffect, useState, type CSSProperties, type ReactElement } from 'react'
import Link from 'next/link'
import { ArrowUpRight, RefreshCw, Lightbulb, Plus } from 'lucide-react'
import { useAuth } from '@/shared/providers/auth-context'
import { useApi } from '@/shared/api/use-api'
import type { BillingLimits, OnboardingState } from '@/shared/api/types'
import { PlanCalendarWidget } from '@/features/dashboard/components/plan-calendar-widget'
import { AiReminder } from '@/features/dashboard/components/ai-reminder'
import { PromoBanner, type PromoData } from '@/features/dashboard/components/promo-banner'
import { Gauge, StatCard } from '@/shared/ui/dashboard-kit'
import { ReadingIcon, ListeningIcon, WritingIcon, SpeakingIcon } from '@/shared/ui/icons/skill-icons'

/* ───────────── Yashil palitra ─────────────
   G_DARK  — asosiy to‘q yashil (tugma, matn urg‘usi)
   G_MID   — o‘rta yashil (progress, ikonka)
   G_LIGHT — och yashil
   G_GLOW  — to‘q fondagi yorqin urg‘u */

const G_DARK = '#0F3D26'
const G_MID = '#1F7A4D'
const G_LIGHT = '#5DBB8A'
const G_GLOW = '#9BE3BC'

const HATCH = 'repeating-linear-gradient(135deg, rgba(15,61,38,0.26) 0 2px, transparent 2px 8px)'
const HATCH_WHITE = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 8px)'

type IconProps = { className?: string }

const PRACTICE_SKILLS: {
  href: string
  label: string
  description: string
  Icon: (p: IconProps) => ReactElement
}[] = [
    { href: '/dashboard/reading', label: 'Reading', description: 'Matn o‘qing, savollarga javob bering', Icon: ReadingIcon },
    { href: '/dashboard/listening', label: 'Listening', description: 'Audio tinglang, tushunishingizni sinang', Icon: ListeningIcon },
    { href: '/dashboard/writing', label: 'Writing', description: 'Yozma topshiriqlarni bajaring', Icon: WritingIcon },
    { href: '/dashboard/speaking', label: 'Speaking', description: 'Gapiring, talaffuzingizni yaxshilang', Icon: SpeakingIcon },
  ]

/* Reklama bo‘lmaganda hero'ning o‘ng yarmida turadigan pill ustunlar.
   Balandliklar 20 px ga kattaroq: ustunlar hero'ning pastki chetidan 20 px pastga chiqarib qo‘yilgan,
   shuning uchun yuqoriga-pastga suzganda pastida bo‘shliq ko‘rinmaydi. */
const HERO_PILLS: { Icon: (p: IconProps) => ReactElement; className: string; style: CSSProperties }[] = [
  { Icon: ReadingIcon, className: 'h-[12.25rem]', style: { background: G_MID } },
  { Icon: ListeningIcon, className: 'h-[16.25rem]', style: { background: HATCH, boxShadow: 'inset 0 0 0 1px rgba(15,61,38,0.10)' } },
  { Icon: WritingIcon, className: 'h-[14.25rem]', style: { background: G_DARK } },
  { Icon: SpeakingIcon, className: 'h-[17.25rem]', style: { background: G_LIGHT } },
]

/* Animatsiyalar: bo‘limlar pastdan yuqoriga ketma-ket chiqadi, hero pillari yuqoriga-pastga suzadi.
   `backwards` ishlatilgan: animatsiya tugagach transform qolmaydi (ichidagi fixed elementlar buzilmaydi).
   prefers-reduced-motion bo‘lsa animatsiya o‘chadi. */
const ANIMATION_CSS = `
@keyframes dash-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes dash-bob-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes dash-band-x { from { opacity: 0; transform: scaleX(.3); } to { opacity: 1; transform: scaleX(1); } }
@keyframes dash-band-y { from { opacity: 0; transform: scaleY(.3); } to { opacity: 1; transform: scaleY(1); } }
/* o‘rtadagi yumshoq xira "yo‘lak": ikki yarmni ajratadi. Ochilganda o‘rtadan kengayadi. */
.dash-band-x { transform-origin: center; animation: dash-band-x 1s cubic-bezier(.2,.7,.2,1) .3s backwards; }
.dash-band-y { transform-origin: center; animation: dash-band-y 1s cubic-bezier(.2,.7,.2,1) .3s backwards; }
@media (prefers-reduced-motion: reduce) {
  .dash-rise, .dash-stagger > *, .dash-band-x, .dash-band-y { animation: none; }
  /* globals.css dagi umumiy qoida (animation-duration: 0.01ms !important) pillarni to‘xtatib qo‘yadi.
     Klass selektori universal (*) dan kuchliroq, shuning uchun bu yerda o‘zimizning yumshoq variantni qaytaramiz. */
  .dash-pill {
    animation-name: dash-bob-soft !important;
    animation-duration: var(--bob-d) !important;
    animation-iteration-count: infinite !important;
  }
}
`

/* ───────────── Reklama ─────────────
   Hero'ning o‘ng yarmida turadi. Reklama dizayni rasmning ichida tayyor bo‘ladi (logotip, matn, tugma).
   • Rasm: 2:1, 1600×800 px, PNG yoki WebP (shaffof fon tavsiya etiladi), ~300 KB gacha
   • Fonli rasm bo‘lsa: fit: 'cover'
   • null qilsangiz — reklama o‘rniga animatsiyali pill ustunlar chiqadi
   platform: telegram | instagram | youtube | facebook | tiktok | website
   Keyinchalik backend'dan (masalan useApi('/promo')) olish mumkin. */
const PROMO = null as PromoData | null

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 11) return 'Xayrli tong'
  if (hour >= 11 && hour < 17) return 'Xayrli kun'
  if (hour >= 17 && hour < 23) return 'Xayrli kech'
  return 'Xayrli tun'
}

const TIPS = [
  'Reading: avval savollarni o‘qing, keyin matnda kalit so‘zlarni qidiring.',
  'Listening: audio boshlanishidan oldin savollarga ko‘z yugurtirib chiqing.',
  'Writing: yozishdan oldin 2 daqiqa reja tuzing — fikrlar tartibli chiqadi.',
  'Speaking: javobingizni "fikr + sabab + misol" tuzilmasida bering.',
  'Har kuni 15 daqiqa mashq qilish haftada bir marta 2 soat o‘tirishdan samaraliroq.',
  'Xatolaringizni yozib boring — takroriy xatolar eng tez o‘sish nuqtangiz.',
]

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

const ink = 'text-[#0F2A1C]'
const muted = 'text-[#0F2A1C]/60'
const cardBase = 'relative overflow-hidden rounded-3xl p-5 sm:p-6'
const whiteCard = `${cardBase} bg-white ring-1 ring-[#0F3D26]/[0.06]`

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const limits = useApi<BillingLimits>('/billing/me/limits')
  const onboarding = useApi<OnboardingState>('/onboarding')
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
  const monthlyLeft = monthlyLimit !== null ? Math.max(monthlyLimit - monthlyUsed, 0) : null
  const monthlyRatio = monthlyLimit && monthlyLimit > 0 ? Math.min(monthlyUsed / monthlyLimit, 1) : 0

  const isLoading = limits.loading && !limits.data
  const dash = '—'

  // Hydration muammosi bo‘lmasligi uchun sana klientda hisoblanadi
  const [tipIndex, setTipIndex] = useState(0)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setTipIndex(Math.floor(Date.now() / 86_400_000) % TIPS.length)
    setNow(new Date())
  }, [])

  const greeting = now ? greetingFor(now.getHours()) : 'Salom'
  const today = now ? `${WEEKDAYS[now.getDay()]}, ${now.getDate()}-${MONTHS[now.getMonth()]}` : null
  const subtitle = hasLimits
    ? weeklyLeft > 0
      ? `Bu hafta yana ${weeklyLeft} ta mashq qilishingiz mumkin. Qaysi ko‘nikmadan boshlaymiz?`
      : 'Haftalik limit tugadi. Davom etish uchun tarifni almashtiring.'
    : 'Bugun qaysi ko‘nikmani mashq qilamiz?'

  return (
    <div>
      <style>{ANIMATION_CSS}</style>

      {/* ───── Hero: chapda salomlashuv, o‘ngda reklama (yoki pill ustunlar) ───── */}
      <header
        className="dash-rise relative mb-3 overflow-hidden rounded-3xl ring-1 ring-[#0F3D26]/[0.06] sm:mb-4"
        style={{ background: 'linear-gradient(110deg, #FFFFFF 0%, #EEF7F1 45%, #CFE9DA 100%)' }}
      >
        <div className="relative grid lg:grid-cols-2">
          {/* o‘rtadagi yumshoq xira vertikal yo‘lak (lg+) */}
          <span
            aria-hidden="true"
            className="dash-band-x pointer-events-none absolute -inset-y-6 left-[39%] z-[5] hidden w-[22%] lg:block"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgba(31,122,77,0.30) 32%, rgba(31,122,77,0.30) 68%, transparent 100%)',
              filter: 'blur(12px)',
            }}
          />


          {/* Chap yarim */}
          <div className="relative z-10 flex flex-col justify-center gap-6 p-6 sm:p-8 lg:p-10">
            <div className="min-w-0">
              <div className="mb-4 h-7">
                {today ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E4F1E9] px-3 py-1 text-xs font-medium text-[#0F3D26]">
                    <span className="size-1.5 rounded-full bg-[#1F7A4D]" aria-hidden="true" />
                    {today}
                  </span>
                ) : null}
              </div>
              <h1 className={`break-words text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl ${ink}`}>
                {greeting}
                {firstName ? ',' : ''}
                {firstName ? (
                  <>
                    <br />
                    <span className="relative isolate inline-block">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.3em] rounded-sm bg-[#CDEBDA]"
                      />
                      {firstName}
                    </span>
                  </>
                ) : null}
              </h1>
              <p className={`mt-4 max-w-md text-sm leading-6 sm:text-base ${muted}`}>{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard/reading"
                className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98] motion-reduce:transition-none sm:flex-none ${focusRing}`}
                style={{ background: `linear-gradient(135deg, ${G_MID}, ${G_DARK})` }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Mashqni boshlash
              </Link>
              <Link
                href="/dashboard/billing"
                className={`inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-[#0F3D26] ring-1 ring-[#0F3D26]/70 transition hover:bg-white active:scale-[0.98] motion-reduce:transition-none sm:flex-none ${focusRing}`}
              >
                Tariflar
              </Link>
              <button
                type="button"
                onClick={limits.reload}
                disabled={limits.loading}
                aria-label="Yangilash"
                className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#0F3D26] ring-1 ring-[#0F3D26]/15 transition hover:bg-[#E4F1E9] active:scale-95 disabled:opacity-60 ${focusRing}`}
              >
                <RefreshCw
                  className={`size-4 ${limits.loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Yarmlar orasidagi gorizontal yo‘lak (lg dan kichik ekranlarda) */}
          <span
            aria-hidden="true"
            className="dash-band-y pointer-events-none relative -my-2 h-12 lg:hidden"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(31,122,77,0.30) 32%, rgba(31,122,77,0.30) 68%, transparent 100%)',
              filter: 'blur(8px)',
            }}
          />

          {/* o‘ng yarim: reklama rasmi yoki (reklama yo‘q bo‘lsa) yuqoriga-pastga suzuvchi pill ustunlar */}
          {PROMO ? (
            <div className="px-3 pb-3 sm:px-4 sm:pb-4 lg:flex lg:p-0">
              <PromoBanner {...PROMO} />
            </div>
          ) : (
            <div aria-hidden="true" className="pointer-events-none relative hidden min-h-72 lg:block">
              <div className="absolute -bottom-5 right-10 flex items-end gap-3 xl:right-16">
                {HERO_PILLS.map(({ Icon, className, style }, i) => (
                  <div
                    key={i}
                    className={`dash-pill flex w-16 flex-col items-center rounded-full p-2 ${className}`}
                    style={
                      {
                        ...style,
                        '--bob-d': `${3.4 + i * 0.6}s`,
                        // har bir ustun o‘z tezligi va kechikishida yuqoriga-pastga suzadi
                        animation: `dash-bob var(--bob-d) ease-in-out ${i * 0.45}s infinite`,
                      } as CSSProperties
                    }
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm">
                      <Icon className="size-5 text-[#0F3D26]" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="dash-stagger space-y-3 sm:space-y-4">
        {/* ───── Statistika ───── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-live="polite">
          {limits.error ? (
            <div role="alert" className={`${whiteCard} col-span-full`}>
              <p className={`text-sm font-semibold ${ink}`}>Limitlarni yuklab bo‘lmadi</p>
              <p className={`mt-1 text-sm ${muted}`}>{limits.error.message}</p>
              <button
                type="button"
                onClick={limits.reload}
                className={`mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 ${ink}`}
              >
                Qayta urinish
              </button>
            </div>
          ) : null}

          <StatCard
            href="/dashboard/billing"
            featured
            loading={isLoading}
            title="Haftalik qoldi"
            value={hasLimits ? String(weeklyLeft) : dash}
            note={hasLimits ? `Jami ${weeklyLimit} ta mashq` : isLoading ? 'Yuklanmoqda…' : 'Ma’lumot topilmadi'}
          />
          <StatCard
            href="/dashboard/billing"
            loading={isLoading}
            title="Haftalik sarf"
            value={practice ? String(weeklyUsed) : dash}
            note="Bu hafta bajarilgan"
          />
          <StatCard
            href="/dashboard/billing"
            loading={isLoading}
            title="Oylik sarf"
            value={practice ? String(monthlyUsed) : dash}
            note={practice ? `Limit: ${monthlyLimit ?? '∞'}` : 'Bu oy bajarilgan'}
          />
          <StatCard
            href="/dashboard/billing"
            loading={isLoading}
            title="Oylik qoldi"
            value={practice ? (monthlyLeft === null ? '∞' : String(monthlyLeft)) : dash}
            note="Bu oy uchun"
          />
        </div>

        {/* ───── Mashq bo‘limlari ───── */}
        <section aria-labelledby="practice-skills" className="pt-3 sm:pt-4">
          <div className="mb-3 flex items-baseline justify-between gap-3 px-1 sm:mb-4">
            <h2 id="practice-skills" className={`text-xl font-semibold tracking-tight sm:text-2xl ${ink}`}>
              Mashq bo‘limlari
            </h2>
            <span className={`text-sm ${muted}`}>Bo‘limni tanlang</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {PRACTICE_SKILLS.map(({ href, label, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-3xl bg-white p-4 ring-1 ring-[#0F3D26]/[0.06] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0F3D26]/15 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-60 sm:p-6 ${focusRing}`}
              >
                {/* Hover'da to‘q yashil fon */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                  style={{ background: `radial-gradient(120% 100% at 0% 0%, #2A9460 0%, ${G_MID} 45%, ${G_DARK} 100%)` }}
                />
                {/* Shtrixli bezak */}
                <span
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 size-28 rounded-full opacity-70 sm:size-36"
                  style={{ background: HATCH }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 size-28 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none sm:size-36"
                  style={{ background: HATCH_WHITE }}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <span className="flex size-14 items-center justify-center rounded-full bg-[#E4F1E9] text-[#1F7A4D] transition-colors duration-300 group-hover:bg-white group-hover:text-[#0F3D26] motion-reduce:transition-none sm:size-16">
                    <Icon className="size-7 sm:size-8" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-9 items-center justify-center rounded-full bg-white text-[#0F3D26] ring-1 ring-[#0F3D26]/20 transition duration-300 group-hover:rotate-45 group-hover:ring-transparent motion-reduce:transition-none sm:size-10"
                  >
                    <ArrowUpRight className="size-4 sm:size-5" />
                  </span>
                </div>

                <div className="relative z-10 mt-8">
                  <h3
                    className={`text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-white motion-reduce:transition-none sm:text-2xl ${ink}`}
                  >
                    {label}
                  </h3>
                  <p
                    className={`mt-1 line-clamp-2 text-xs leading-snug transition-colors duration-300 group-hover:text-white/75 motion-reduce:transition-none sm:text-sm sm:leading-5 ${muted}`}
                  >
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ───── Progress + maslahat ───── */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4">
          <section
            aria-labelledby="weekly-progress"
            className={`${whiteCard} flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:gap-8 lg:col-span-2`}
          >
            <div className="flex-1">
              <Gauge ratio={weeklyRatio} hasData={hasLimits} ariaLabel={`Haftalik limitning ${Math.round(Math.min(Math.max(weeklyRatio, 0), 1) * 100)} foizi ishlatilgan`} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 id="weekly-progress" className={`text-[15px] font-medium ${ink}`}>
                Haftalik progress
              </h2>
              {hasLimits && weeklyRatio >= 0.8 ? (
                <p role="status" className="mt-1 text-xs font-medium text-[#C2410C]">
                  {weeklyLeft > 0 ? 'Limit tugab bormoqda' : 'Haftalik limit tugadi'}
                </p>
              ) : (
                <p className={`mt-1 text-xs ${muted}`}>Limitning qancha qismi ishlatilgan</p>
              )}

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className={`inline-flex items-center gap-2 ${muted}`}>
                    <span className="size-2.5 rounded-full" style={{ background: G_MID }} aria-hidden="true" />
                    Ishlatilgan
                  </dt>
                  <dd className={`font-semibold tabular-nums ${ink}`}>{hasLimits ? weeklyUsed : dash}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className={`inline-flex items-center gap-2 ${muted}`}>
                    <span
                      className="size-2.5 rounded-full ring-1 ring-[#0F3D26]/20"
                      style={{ background: HATCH }}
                      aria-hidden="true"
                    />
                    Qoldi
                  </dt>
                  <dd className={`font-semibold tabular-nums ${ink}`}>{hasLimits ? weeklyLeft : dash}</dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-[#0F3D26]/10 pt-4">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className={muted}>Oylik</span>
                  <span className={`tabular-nums ${muted}`}>
                    <span className={`font-semibold ${ink}`}>{monthlyUsed}</span> / {monthlyLimit ?? '∞'}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4F1E9]"
                  role="progressbar"
                  aria-label="Oylik limit"
                  aria-valuenow={monthlyUsed}
                  aria-valuemin={0}
                  aria-valuemax={monthlyLimit ?? undefined}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                    style={{ width: `${monthlyRatio * 100}%`, background: G_MID }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Bugungi maslahat — to‘q yashil, teksturali */}
          <section
            aria-labelledby="daily-tip"
            className={`${cardBase} flex min-h-56 flex-col justify-between gap-6 text-white lg:col-span-2`}
            style={{
              background: [
                'radial-gradient(80% 60% at 100% 0%, rgba(93,187,138,0.40), transparent 60%)',
                'radial-gradient(60% 50% at 0% 100%, rgba(31,122,77,0.55), transparent 60%)',
                'repeating-radial-gradient(circle at 120% -10%, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)',
                '#0B2E1D',
              ].join(', '),
            }}
          >
            <h2 id="daily-tip" className="inline-flex items-center gap-2 text-[15px] font-medium text-white/80">
              <Lightbulb aria-hidden="true" className="size-4" style={{ color: G_GLOW }} />
              Bugungi maslahat
            </h2>
            <p className="max-w-lg text-xl font-medium leading-snug tracking-tight sm:text-2xl">{TIPS[tipIndex]}</p>
            <Link
              href="/dashboard/reading"
              className="group inline-flex min-h-11 w-fit items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-semibold text-[#0F3D26] transition active:scale-[0.98] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Mashq qilish
              <span
                className="flex size-8 items-center justify-center rounded-full text-white transition-transform group-hover:rotate-45 motion-reduce:transition-none"
                style={{ background: G_DARK }}
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          </section>
        </div>

        {/* ───── Kalendar / AI reja ───── */}
        <PlanCalendarWidget
          plan={onboarding.data?.plan ?? null}
          startedAt={onboarding.data?.plan_generated_at ?? null}
          loading={onboarding.loading && !onboarding.data}
        />

        <AiReminder
          plan={onboarding.data?.plan ?? null}
          loading={onboarding.loading && !onboarding.data}
          hasOnboarding={!!onboarding.data}
        />
      </div>
    </div>
  )
}