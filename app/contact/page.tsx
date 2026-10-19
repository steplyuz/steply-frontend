import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, LifeBuoy, Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FOCUS, LIME } from '@/lib/brand'

export const metadata = {
  title: 'Aloqa | Steply',
  description: 'Steply akkaunti, testlar va billing bo‘yicha aloqa ma’lumotlari.',
}

/** Dekorativ halqa — faqat bezak */
function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute z-0 rounded-full ${className}`} style={{ border: `${width}px solid ${color}` }} />
  )
}

const CHECKLIST = [
  'Buyurtma raqami (agar to‘lov bo‘yicha bo‘lsa)',
  'Muammoning qisqa tavsifi',
  'Xatolik chiqqan sahifa yoki test nomi',
]

type ChannelProps = {
  icon: React.ReactNode
  title: string
  value?: string
  href?: string
  action: string
  emptyText: string
  external?: boolean
}

function Channel({ icon, title, value, href, action, emptyText, external }: ChannelProps) {
  const head = (
    <div className="relative isolate flex min-h-24 items-start justify-between gap-3 overflow-hidden p-5 sm:p-6" style={{ background: 'rgba(228,247,10,0.22)' }}>
      <Circle color="rgba(228,247,10,0.35)" width={16} className="-right-10 -top-14 size-36" />
      <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">{icon}</span>
    </div>
  )

  if (!value || !href) {
    return (
      <article className="flex flex-col overflow-hidden rounded-3xl border border-dashed border-foreground/20 bg-white">
        {head}
        <div className="p-5 sm:p-6">
          <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/60">{emptyText}</p>
        </div>
      </article>
    )
  }

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCUS}`}
    >
      {head}
      <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 break-all text-sm font-medium text-foreground/60">{value}</p>
        </div>
        <span className="inline-flex min-h-12 w-full items-center justify-between rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-bold text-white">
          {action}
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover:rotate-45 motion-reduce:transition-none">
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
        </span>
      </div>
    </a>
  )
}

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  const supportTelegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM?.trim()
  const telegramHref = supportTelegram
    ? supportTelegram.startsWith('http') ? supportTelegram : `https://t.me/${supportTelegram.replace(/^@/, '')}`
    : undefined

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />
      <main className="container-shell mx-auto max-w-5xl space-y-5 px-4 py-8 sm:space-y-8 sm:px-8 sm:py-12">
        {/* Hero + tayyorgarlik */}
        <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
          <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 sm:p-8 lg:col-span-3 lg:min-h-72 lg:p-10" style={{ background: LIME }}>
            <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                <LifeBuoy aria-hidden="true" className="size-3.5" /> Yordam markazi
              </span>
              <h1 className="mt-4 text-4xl font-black leading-none tracking-tighter sm:text-6xl">Steply bilan bog‘lanish</h1>
              <p className="mt-3 max-w-lg text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
                Akkaunt, test ishlashi, to‘lov yoki xarid tasdig‘i bo‘yicha yozing. Quyidagi ma’lumotlarni oldindan tayyorlasangiz, javob tezroq keladi.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
            <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
            <div className="relative z-10 flex h-full flex-col gap-5">
              <div>
                <h2 className="text-base font-bold sm:text-lg">Murojaatdan oldin</h2>
                <p className="mt-0.5 text-xs text-white/55">Tayyorlab qo‘ying</p>
              </div>
              <ul className="grid flex-1 gap-3">
                {CHECKLIST.map(item => (
                  <li key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm font-medium text-white/85">
                    <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" style={{ color: LIME }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Aloqa kanallari */}
        <section aria-labelledby="contact-channels" className="space-y-4 sm:space-y-6">
          <h2 id="contact-channels" className="text-xl font-black tracking-tight sm:text-3xl">Aloqa kanallari</h2>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Channel
              icon={<Mail aria-hidden="true" className="size-6" strokeWidth={1.9} />}
              title="Email orqali"
              value={supportEmail}
              href={supportEmail ? `mailto:${supportEmail}` : undefined}
              action="Xat yozish"
              emptyText="Rasmiy yordam emaili hozircha ko‘rsatilmagan. Iltimos, boshqa kanaldan foydalaning."
            />
            <Channel
              icon={<MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.9} />}
              title="Telegram orqali"
              value={supportTelegram}
              href={telegramHref}
              action="Telegramni ochish"
              emptyText="Rasmiy yordam akkaunti hozircha ko‘rsatilmagan. Iltimos, boshqa kanaldan foydalaning."
              external
            />
          </div>
        </section>

        {/* Xavfsizlik */}
        <section aria-labelledby="contact-security" className="rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl sm:size-12" style={{ background: LIME }}>
              <ShieldCheck aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
            </span>
            <h2 id="contact-security" className="text-base font-extrabold sm:text-lg">Hisob xavfsizligi</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-foreground/65">
            Support xodimiga parol, tasdiqlash kodi, refresh token yoki bank kartangizning maxfiy ma’lumotlarini yubormang. Billing masalalari uchun buyurtma ID yetarli bo‘lishi mumkin.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/privacy" className={`inline-flex min-h-11 items-center rounded-full bg-foreground/5 px-5 text-sm font-bold transition hover:bg-foreground/10 motion-reduce:transition-none ${FOCUS}`}>Maxfiylik siyosati</Link>
            <Link href="/terms" className={`inline-flex min-h-11 items-center rounded-full bg-foreground/5 px-5 text-sm font-bold transition hover:bg-foreground/10 motion-reduce:transition-none ${FOCUS}`}>Foydalanish shartlari</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}