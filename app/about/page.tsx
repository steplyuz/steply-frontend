import Link from 'next/link'
import { BookOpen, Headphones, Mic, Pencil, ShieldCheck, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Steply haqida',
  description: 'Steply — Reading, Listening, Writing va Speaking bo‘yicha tayyorgarlik va Mock Exam platformasi.',
}

const skills = [
  { title: 'Reading', description: 'Matnlarni o‘qish, savollarni yechish va javoblarni tahlil qilish.', icon: BookOpen },
  { title: 'Listening', description: 'Audio topshiriqlarni tinglash va tushunishni mashq qilish.', icon: Headphones },
  { title: 'Writing', description: 'Yozma topshiriqlarni bajarish va mavjud baholash imkoniyatlaridan foydalanish.', icon: Pencil },
  { title: 'Speaking', description: 'Og‘zaki javoblarni yozib olish va tegishli baholash jarayonidan o‘tish.', icon: Mic },
]

export default function AboutPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />
      <main className="container-shell mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        <section className="rounded-3xl bg-foreground px-6 py-10 text-white sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Sparkles className="size-3.5 text-[#E4F70A]" /> Steply platformasi</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Til imtihoniga tayyorgarlikni tartibli va o‘lchanadigan jarayonga aylantiring.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Steply Reading, Listening, Writing va Speaking mashqlari, mavjud tahlil materiallari, obuna limitlari va to‘liq Mock Exam xaridlarini bir platformada jamlaydi.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex min-h-11 items-center rounded-xl bg-[#E4F70A] px-5 py-3 text-sm font-bold text-foreground">Hisob yaratish</Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Aloqa</Link>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">To‘rtta ko‘nikma, bitta ish maydoni</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Mashqlar va mavjud testlar administrator tomonidan boshqariladi. Har bir xizmatning mavjudligi tarif, limit va test sozlamalariga bog‘liq bo‘lishi mumkin.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#E4F70A]/30 text-foreground"><Icon className="size-5" /></span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
          <article className="rounded-2xl border border-border p-6 sm:p-7">
            <ShieldCheck className="size-6 text-foreground" />
            <h2 className="mt-4 text-xl font-bold">Aniq limitlar va hisob-kitob</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Practice uchun umumiy kvota, Analysis uchun alohida kvota, obuna holati va buyurtmalar billing bo‘limida ko‘rsatiladi. Pullik buyurtma chek yuborish va admin tasdig‘idan keyin faollashadi.</p>
            <Link href="/terms" className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">Foydalanish shartlari</Link>
          </article>
          <article className="rounded-2xl border border-border p-6 sm:p-7">
            <BookOpen className="size-6 text-foreground" />
            <h2 className="mt-4 text-xl font-bold">Mock Exam va natijalar</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Mavjud Mock Exam katalogidan imtihon tanlash, to‘lov holatini kuzatish va xarid tasdiqlangach imtihonga kirish mumkin. Natijalar tayyorgarlik uchun mo‘ljallangan.</p>
            <Link href="/login" className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">Platformaga kirish</Link>
          </article>
        </section>

        <p className="mt-10 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">Steply mustaqil tayyorgarlik platformasidir. Platformadagi mashqlar va natijalar IELTS tashkilotchisi tomonidan berilgan rasmiy ball yoki sertifikat o‘rnini bosmaydi.</p>
      </main>
      <Footer />
    </div>
  )
}
