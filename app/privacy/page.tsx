// app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Cookie,
  Database,
  FileText,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati | Steply',
  description:
    'Steply akkauntlari, test natijalari, AI funksiyalari, to‘lovlar va shaxsiy ma’lumotlarni himoya qilish tartibi.',
  alternates: {
    canonical: '/privacy',
  },
}

const sections = [
  { id: 'collected', title: 'Yig‘iladigan ma’lumotlar', icon: Database },
  { id: 'purpose', title: 'Foydalanish maqsadi', icon: Fingerprint },
  { id: 'cookies', title: 'Cookie va seanslar', icon: Cookie },
  { id: 'providers', title: 'Uchinchi tomon xizmatlari', icon: UserRound },
  { id: 'payments', title: 'To‘lov ma’lumotlari', icon: FileText },
  { id: 'security', title: 'Saqlash va himoya', icon: ShieldCheck },
  { id: 'rights', title: 'Foydalanuvchi huquqlari', icon: LockKeyhole },
  { id: 'contact', title: 'Murojaat', icon: Mail },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />

      <main>
        <section className="relative overflow-hidden border-b bg-muted/30">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="container-shell relative mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Bosh sahifa
            </Link>

            <div className="mt-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                <ShieldCheck className="size-4 text-primary" />
                Maxfiylik va xavfsizlik
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Maxfiylik siyosati
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Steply xizmatidan foydalanganingizda qanday ma’lumotlar
                qayta ishlanishi, ulardan nima maqsadda foydalanilishi va
                ma’lumotlaringizni boshqarish imkoniyatlari haqida.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                  <LockKeyhole className="size-4" />
                  Ma’lumotlarni himoya qilish
                </span>
                <span className="rounded-lg border bg-background px-3 py-2">
                  Til: O‘zbekcha
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="container-shell mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ushbu sahifada
              </p>

              <nav className="mt-3 space-y-1">
                {sections.map((section, index) => {
                  const Icon = section.icon

                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold group-hover:bg-background">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{section.title}</span>
                      <Icon className="size-4 shrink-0 opacity-60" />
                    </a>
                  )
                })}
              </nav>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <ShieldCheck className="size-5 text-primary" />
              <p className="mt-3 text-sm font-bold">
                Ma’lumotlaringiz muhim
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Hisobingiz va shaxsiy ma’lumotlaringizga oid savollar
                bo‘lsa, bizga murojaat qiling.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Aloqa sahifasi
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="mb-6 rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-base font-bold">Siyosat haqida</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Ushbu siyosat Steply platformasida qayta ishlanishi mumkin
                bo‘lgan ma’lumotlar va ulardan foydalanish maqsadlarini
                tushuntiradi. Amalda yig‘iladigan ma’lumotlar platformada
                yoqilgan funksiyalar va foydalanuvchi foydalanadigan
                xizmatlarga bog‘liq.
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Nashrdan oldin ma’lumotlar uchun mas’ul shaxs yoki tashkilot,
                saqlash muddatlari, uchinchi tomon provayderlari va
                foydalanuvchi so‘rovlarini bajarish tartibi tasdiqlanishi
                kerak.
              </p>
            </div>

            <div className="space-y-5">
              <section
                id="collected"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="01" title="Yig‘iladigan ma’lumotlar" />
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Xizmatni taqdim etish, hisobni boshqarish va xavfsizlikni
                  ta’minlash uchun quyidagi toifadagi ma’lumotlar qayta
                  ishlanishi mumkin:
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    icon={UserRound}
                    title="Hisob ma’lumotlari"
                    description="Ism, telefon raqami, profil sozlamalari, til va vaqt zonasi."
                  />
                  <InfoCard
                    icon={Fingerprint}
                    title="Kirish ma’lumotlari"
                    description="Google yoki Telegram orqali autentifikatsiya uchun zarur identifikatorlar."
                  />
                  <InfoCard
                    icon={FileText}
                    title="O‘quv faoliyati"
                    description="Test javoblari, urinishlar, natijalar, Writing javoblari va Speaking yozuvlari — tegishli funksiyalardan foydalanilganda."
                  />
                  <InfoCard
                    icon={Database}
                    title="Buyurtmalar"
                    description="Tarif, buyurtma summasi, to‘lov holati va taqdim etilgan to‘lov tasdig‘i."
                  />
                  <InfoCard
                    icon={Cookie}
                    title="Texnik ma’lumotlar"
                    description="Seans identifikatorlari, brauzer va qurilma ma’lumotlari, IP manzili — tizim sozlamalariga qarab."
                  />
                  <InfoCard
                    icon={ShieldCheck}
                    title="Xavfsizlik qaydlari"
                    description="Xatolar, tizim hodisalari va xizmatni himoyalash uchun zarur texnik qaydlar."
                  />
                </div>
              </section>

              <section
                id="purpose"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="02" title="Ma’lumotlardan foydalanish maqsadi" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Ma’lumotlardan hisob yaratish va boshqarish, foydalanuvchini
                    autentifikatsiya qilish, testlar va natijalarni saqlash
                    hamda platformaning asosiy funksiyalarini taqdim etish
                    uchun foydalanilishi mumkin.
                  </p>
                  <p>
                    Shuningdek, ma’lumotlar obuna va foydalanish limitlarini
                    hisoblash, to‘lovlarni tekshirish, texnik xatolarni
                    aniqlash, xavfsizlikni ta’minlash va foydalanuvchi
                    murojaatlarini ko‘rib chiqish uchun qayta ishlanishi
                    mumkin.
                  </p>
                  <p>
                    AI yordamida javoblarni tahlil qilish funksiyasi
                    ishlatilganda, tegishli javob yoki unga zarur kontekst
                    tahlilni bajaruvchi xizmatga uzatilishi mumkin.
                  </p>
                </div>
              </section>

              <section
                id="cookies"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="03" title="Cookie va seanslar" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Platforma foydalanuvchining kirish holatini saqlash,
                    seansni boshqarish va xavfsizlikni ta’minlash uchun
                    cookie yoki shunga o‘xshash texnologiyalardan
                    foydalanishi mumkin.
                  </p>
                  <p>
                    Cookie’larni brauzer sozlamalari orqali boshqarish
                    mumkin. Zarur cookie’larni bloklash hisobga kirish
                    yoki ayrim funksiyalarning ishlashiga xalaqit berishi
                    mumkin.
                  </p>
                  <p>
                    Faqat amalda ishlatiladigan cookie turlari, ularning
                    vazifalari va saqlanish muddati yakuniy siyosatda
                    aniq ko‘rsatilishi lozim.
                  </p>
                </div>
              </section>

              <section
                id="providers"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="04" title="Uchinchi tomon xizmatlari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Ayrim funksiyalar tashqi xizmatlar orqali ishlashi
                    mumkin. Masalan, Google yoki Telegram orqali kirish
                    va AI yordamida javoblarni tahlil qilish.
                  </p>
                  <p>
                    Bunday xizmat ishlatilganda, funksiyani bajarish
                    uchun zarur bo‘lgan ma’lumotlar tegishli provayderga
                    uzatilishi mumkin. Provayder ushbu ma’lumotlarni
                    o‘zining shartlari va maxfiylik siyosatiga muvofiq
                    qayta ishlashi mumkin.
                  </p>
                  <p>
                    Ma’lumot uzatiladigan provayderlar, ma’lumotlarning
                    qaysi mamlakatlarda qayta ishlanishi va tegishli
                    huquqiy asoslar platformaning haqiqiy texnik
                    konfiguratsiyasi bo‘yicha aniqlashtirilishi kerak.
                  </p>
                </div>
              </section>

              <section
                id="payments"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="05" title="To‘lov ma’lumotlari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Billing jarayonida buyurtma identifikatori, tarif,
                    summa, buyurtma holati va to‘lovni tekshirish uchun
                    yuborilgan chek yoki boshqa tasdiq hujjatlari qayta
                    ishlanishi mumkin.
                  </p>
                  <p>
                    Agar to‘lov chekni yuborish va administrator
                    tasdig‘i orqali amalga oshirilsa, ushbu hujjatlar
                    buyurtmani tekshirish va to‘lov holatini belgilash
                    uchun ishlatiladi.
                  </p>
                  <p>
                    Karta ma’lumotlari faqat amaldagi to‘lov integratsiyasi
                    bunday ma’lumotlarni qayta ishlasa va bu jarayon
                    tegishli hujjatlarda ko‘rsatilgan bo‘lsa, qayta
                    ishlanishi mumkin. Platformaning haqiqiy to‘lov
                    oqimi va karta ma’lumotlarini kim qayta ishlashi
                    nashrdan oldin tasdiqlanishi lozim.
                  </p>
                </div>
              </section>

              <section
                id="security"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="06" title="Ma’lumotlarni saqlash va himoya" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Ma’lumotlarga kirish xizmatni ko‘rsatish, texnik
                    qo‘llab-quvvatlash va xavfsizlik uchun zarur vakolatga
                    ega shaxslar bilan cheklanishi kerak.
                  </p>
                  <p>
                    Ma’lumotlarni himoya qilish uchun qo‘llaniladigan
                    texnik va tashkiliy choralar tizimning haqiqiy
                    konfiguratsiyasiga bog‘liq. Internet orqali uzatish
                    yoki elektron saqlashning hech bir usuli mutlaq
                    xavfsizlikni kafolatlamaydi.
                  </p>
                  <p>
                    Ma’lumotlar xizmatni taqdim etish, qonuniy
                    majburiyatlarni bajarish, nizolarni ko‘rib chiqish
                    yoki xavfsizlikni ta’minlash uchun zarur bo‘lgan
                    muddat davomida saqlanishi mumkin. Aniq muddatlar
                    va o‘chirish tartibi xizmat egasi tomonidan
                    belgilanishi lozim.
                  </p>
                </div>
              </section>

              <section
                id="rights"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="07" title="Foydalanuvchi huquqlari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Amaldagi qonunchilikka muvofiq, foydalanuvchi o‘z
                    ma’lumotlari haqida ma’lumot olish, noto‘g‘ri
                    ma’lumotlarni tuzatishni so‘rash yoki tegishli
                    holatlarda ularni o‘chirish bo‘yicha murojaat
                    qilish huquqiga ega bo‘lishi mumkin.
                  </p>
                  <p>
                    Ayrim ma’lumotlar qonuniy majburiyatlar, to‘lov
                    hisoboti, xavfsizlik yoki nizolarni ko‘rib chiqish
                    sababli muayyan muddat saqlanishi mumkin.
                  </p>
                  <p>
                    Hisob sozlamalarini boshqarish uchun platformaga
                    kirishingiz mumkin. Hisobingizga kira olmasangiz
                    yoki ma’lumotlar bo‘yicha so‘rovingiz bo‘lsa,
                    aloqa sahifasi orqali murojaat qiling.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  <UserRound className="size-4" />
                  Akkauntga kirish
                  <ArrowRight className="size-4" />
                </Link>
              </section>

              <section
                id="contact"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="08" title="Maxfiylik bo‘yicha murojaat" />
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Ma’lumotlaringizni qayta ishlash, ularni tuzatish yoki
                  o‘chirish bo‘yicha savol va so‘rovlar uchun Steply
                  ma’muriyatiga murojaat qilishingiz mumkin. Murojaatni
                  ko‘rib chiqish uchun hisobingizni tasdiqlash yoki
                  so‘rovingizni aniqlashtirish talab qilinishi mumkin.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Mail className="size-4" />
                    Aloqa sahifasi
                    <ArrowRight className="size-4" />
                  </Link>

                  <Link
                    href="/terms"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                  >
                    Foydalanish shartlari
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>
            </div>

            <div className="mt-8 rounded-2xl border bg-muted/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h2 className="text-sm font-bold">
                    Nashrdan oldin tekshiring
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Ma’lumotlar uchun mas’ul shaxs yoki tashkilot,
                    amalda ishlatiladigan provayderlar, cookie turlari,
                    saqlash muddatlari, foydalanuvchi so‘rovlarini
                    bajarish tartibi va amaldagi qonunchilikka muvofiqlik
                    tasdiqlanishi kerak.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function SectionHeading({
  number,
  title,
}: {
  number: string
  title: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
        {number}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
          {title}
        </h2>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <Icon className="size-5 text-primary" />
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}