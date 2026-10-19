import Link from 'next/link'
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Aloqa | Steply',
  description: 'Steply akkaunti, testlar va billing bo‘yicha aloqa ma’lumotlari.',
}

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  const supportTelegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM?.trim()

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />
      <main className="container-shell mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Yordam markazi</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Steply bilan bog‘lanish</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Akkaunt, test ishlashi, to‘lov yoki xarid tasdig‘i bo‘yicha murojaat qilishdan oldin buyurtma raqami va muammoning qisqa tavsifini tayyorlab qo‘ying. Parol yoki tasdiqlash kodini yubormang.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`} className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40">
              <Mail className="size-6" />
              <h2 className="mt-4 font-bold">Email orqali</h2>
              <p className="mt-2 break-all text-sm text-muted-foreground">{supportEmail}</p>
              <span className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">Xat yozish</span>
            </a>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6">
              <Mail className="size-6 text-muted-foreground" />
              <h2 className="mt-4 font-bold">Email orqali</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Rasmiy yordam emaili sozlanmagan. Uni `NEXT_PUBLIC_SUPPORT_EMAIL` muhit o‘zgaruvchisida belgilang.</p>
            </div>
          )}
          {supportTelegram ? (
            <a href={supportTelegram.startsWith('http') ? supportTelegram : `https://t.me/${supportTelegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40">
              <MessageCircle className="size-6" />
              <h2 className="mt-4 font-bold">Telegram orqali</h2>
              <p className="mt-2 text-sm text-muted-foreground">{supportTelegram}</p>
              <span className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">Telegramni ochish</span>
            </a>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6">
              <MessageCircle className="size-6 text-muted-foreground" />
              <h2 className="mt-4 font-bold">Telegram orqali</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Rasmiy yordam akkaunti sozlanmagan. Uni `NEXT_PUBLIC_SUPPORT_TELEGRAM` muhit o‘zgaruvchisida belgilang.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Hisob xavfsizligi</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Support xodimiga parol, kirish kodi, refresh token yoki bank kartangizning maxfiy ma’lumotlarini yubormang. Billing masalalari uchun buyurtma ID yetarli bo‘lishi mumkin.</p>
            <p className="mt-3 text-sm"><Link href="/privacy" className="font-semibold underline underline-offset-4">Maxfiylik siyosati</Link><span className="mx-2 text-muted-foreground">·</span><Link href="/terms" className="font-semibold underline underline-offset-4">Foydalanish shartlari</Link></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
