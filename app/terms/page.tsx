// app/terms/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari | Steply',
  description:
    'Steply platformasidan foydalanish, testlar, obunalar, AI funksiyalari va to‘lovlarga oid shartlar.',
  alternates: {
    canonical: '/terms',
  },
}

const sections = [
  { id: 'account', title: 'Hisob va xavfsizlik', icon: LockKeyhole },
  { id: 'service', title: 'Platforma xizmatlari', icon: BookOpen },
  { id: 'subscription', title: 'Obuna va AI limitlari', icon: Sparkles },
  { id: 'payment', title: 'To‘lovlar va tasdiqlash', icon: CreditCard },
  { id: 'refund', title: 'Bekor qilish va qaytarish', icon: CheckCircle2 },
  { id: 'content', title: 'Kontentdan foydalanish', icon: ShieldCheck },
  { id: 'availability', title: 'Xizmat mavjudligi', icon: TriangleAlert },
  { id: 'privacy', title: 'Maxfiylik va aloqa', icon: FileText },
]

export default function TermsPage() {
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
                Huquqiy ma’lumot
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Foydalanish shartlari
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Ushbu shartlar Steply platformasidan foydalanish, testlarni
                bajarish, obunalarni xarid qilish va xizmatlardan foydalanish
                qoidalarini tushuntiradi.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                  <FileText className="size-4" />
                  Foydalanish qoidalari
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
                      <span className="flex-1">{section.title}</span>
                      <Icon className="size-4 opacity-60" />
                    </a>
                  )
                })}
              </nav>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <ShieldCheck className="size-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Savolingiz bormi?</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Shartlar yoki platformadan foydalanish bo‘yicha biz bilan
                bog‘laning.
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
              <h2 className="text-base font-bold">Boshlashdan oldin</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Steply xizmatidan foydalanishdan oldin ushbu shartlarni
                o‘qib chiqing. Platformadan foydalanishingiz shartlarga
                rioya qilishingizni anglatadi. Agar shartlarga rozi
                bo‘lmasangiz, xizmatdan foydalanishni davom ettirmang.
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Eslatma: ushbu sahifa loyihaga moslashtirilgan shartlar
                loyihasidir. Xizmat egasining yuridik ma’lumotlari, amaldagi
                qonunchilik talablari, kuchga kirish sanasi va qaytarish
                siyosati nashrdan oldin tasdiqlanishi kerak.
              </p>
            </div>

            <div className="space-y-5">
              <section
                id="account"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="01" title="Hisob va xavfsizlik" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Platformaning ayrim funksiyalaridan foydalanish uchun
                    hisob yaratish talab qilinishi mumkin. Foydalanuvchi
                    ro‘yxatdan o‘tishda to‘g‘ri ma’lumot taqdim etishi va
                    hisob ma’lumotlarining maxfiyligini saqlashi kerak.
                  </p>
                  <p>
                    Hisobingiz orqali amalga oshirilgan harakatlarni kuzatib
                    boring. Ruxsatsiz kirish yoki xavfsizlik bilan bog‘liq
                    shubha paydo bo‘lsa, imkon qadar tezroq Steply
                    ma’muriyatiga xabar bering.
                  </p>
                  <p>
                    Boshqa foydalanuvchining hisobiga ruxsatsiz kirish,
                    xavfsizlik choralarini chetlab o‘tish, tizimga zarar
                    yetkazish yoki xizmat faoliyatini izdan chiqarishga
                    urinish taqiqlanadi.
                  </p>
                </div>
              </section>

              <section
                id="service"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="02" title="Platforma xizmatlari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Steply ingliz tilini o‘rganish va imtihonga tayyorlanish
                    uchun mo‘ljallangan raqamli platformadir. Mavjud
                    funksiyalarga Reading, Listening, Writing va Speaking
                    mashqlari, tahlil vositalari hamda Mock Exam kirishi
                    mumkin.
                  </p>
                  <p>
                    Funksiyalarning mavjudligi foydalanuvchi hisobiga,
                    tanlangan tarifga, belgilangan limitlarga va
                    administrator sozlamalariga bog‘liq bo‘lishi mumkin.
                    Barcha funksiyalar har bir tarifda mavjud bo‘lishi
                    kafolatlanmaydi.
                  </p>
                  <p>
                    Platformadagi testlar va avtomatik tahlillar
                    tayyorgarlik uchun xizmat qiladi. Ular rasmiy IELTS
                    natijasi, sertifikati yoki imtihon tashkilotchisining
                    qarori hisoblanmaydi va muayyan ball olishni
                    kafolatlamaydi.
                  </p>
                </div>
              </section>

              <section
                id="subscription"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="03" title="Obuna va AI limitlari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Platformada bepul foydalanish imkoniyatlari hamda
                    PLUS va PRO kabi pullik tariflar taklif qilinishi
                    mumkin. Tariflarning nomi, narxi, amal qilish muddati
                    va tarkibi xarid vaqtida ko‘rsatilgan ma’lumotlar bilan
                    belgilanadi.
                  </p>
                  <p>
                    AI orqali javoblarni tekshirish, tahlil olish yoki
                    boshqa AI funksiyalaridan foydalanish tarifga
                    biriktirilgan limitlar bilan cheklanishi mumkin.
                    Limitlar bir-biridan alohida yoki umumiy hisoblanishi
                    tarif tavsifida ko‘rsatiladi.
                  </p>
                  <p>
                    Limit tugaganida tegishli funksiya vaqtincha
                    cheklanishi yoki qo‘shimcha xarid talab qilishi
                    mumkin. Qo‘shimcha xizmatning narxi va shartlari
                    xaridni tasdiqlashdan oldin ko‘rsatilishi kerak.
                  </p>
                  <p>
                    Tarifga kiritilgan funksiyalar, limitlar va chegirmalar
                    xarid vaqtida foydalanuvchiga ko‘rsatilgan shartlar
                    asosida taqdim etiladi.
                  </p>
                </div>
              </section>

              <section
                id="payment"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="04" title="To‘lovlar va tasdiqlash" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Pullik tarif yoki xizmatni xarid qilishdan oldin
                    narxni, amal qilish muddatini va xarid tarkibini
                    tekshiring. To‘lov faqat platformada ko‘rsatilgan
                    rasmiy tartibda amalga oshirilishi kerak.
                  </p>
                  <p>
                    Agar to‘lovni qo‘lda tasdiqlash tartibi qo‘llansa,
                    foydalanuvchi buyurtma yaratadi, ko‘rsatilgan usul
                    orqali to‘lovni amalga oshiradi va talab qilingan
                    to‘lov tasdig‘ini yuboradi.
                  </p>
                  <p>
                    Bunday holatda buyurtma ma’muriyat tomonidan
                    tekshiriladi. Pullik xizmat yoki obuna buyurtma
                    muvaffaqiyatli tasdiqlanib, hisobda faollashtirilgandan
                    keyin foydalanish uchun ochiladi. Chek yuborishning
                    o‘zi to‘lov tasdiqlanganini anglatmaydi.
                  </p>
                  <p>
                    To‘lovni tasdiqlash muddati to‘lov usuli va tekshiruv
                    jarayoniga bog‘liq bo‘lishi mumkin. To‘lov bilan
                    bog‘liq muammo yuzaga kelsa, buyurtma ma’lumotlari va
                    mavjud tasdiq hujjatlari bilan aloqa sahifasi orqali
                    murojaat qiling.
                  </p>
                </div>
              </section>

              <section
                id="refund"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="05" title="Bekor qilish va pulni qaytarish" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Buyurtmani bekor qilish imkoniyati uning holatiga
                    bog‘liq. Masalan, hali to‘lanmagan yoki tekshiruvdan
                    o‘tmagan buyurtmalar uchun alohida bekor qilish
                    tartibi qo‘llanishi mumkin.
                  </p>
                  <p>
                    Xizmatdan foydalanishni to‘xtatish, obunani bekor
                    qilish va to‘langan mablag‘ni qaytarish turli
                    jarayonlardir. Birining bajarilishi boshqasining
                    avtomatik bajarilishini anglatmaydi.
                  </p>
                  <p>
                    Pulni qaytarish bo‘yicha so‘rovlar to‘lov holati,
                    xizmatdan foydalanish holati va amaldagi qonunchilik
                    asosida ko‘rib chiqiladi. Qaytarish tartibi,
                    muddatlari va istisnolari xizmat egasi tomonidan
                    tasdiqlangan siyosatda aniq ko‘rsatilishi lozim.
                  </p>
                  <p>
                    Ushbu sahifa o‘z-o‘zidan har qanday to‘lovni
                    qaytarish kafolatini bermaydi. Muayyan buyurtma
                    bo‘yicha yordam olish uchun Steply ma’muriyatiga
                    murojaat qiling.
                  </p>
                </div>
              </section>

              <section
                id="content"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="06" title="Kontent va foydalanish qoidalari" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Platformadagi testlar, matnlar, dizayn elementlari,
                    dasturiy ta’minot va boshqa materiallardan faqat
                    qonuniy hamda ruxsat etilgan maqsadlarda foydalaning.
                  </p>
                  <p>
                    Materiallarni ruxsatsiz ommaviy tarqatish, sotish,
                    nusxalash yoki platformaning texnik himoyasini
                    chetlab o‘tish taqiqlanishi mumkin. Uchinchi
                    shaxslarga tegishli materiallardan foydalanishda
                    tegishli huquqlar va litsenziyalar hisobga olinadi.
                  </p>
                  <p>
                    Boshqa foydalanuvchilarning javoblari, hisob
                    ma’lumotlari va shaxsiy ma’lumotlarini ularning
                    roziligisiz tarqatmang.
                  </p>
                </div>
              </section>

              <section
                id="availability"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="07" title="Xizmat mavjudligi va o‘zgarishlar" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Texnik xizmat ko‘rsatish, internetdagi uzilishlar,
                    uchinchi tomon xizmatlari yoki kutilmagan texnik
                    muammolar ayrim funksiyalarning vaqtincha
                    ishlamasligiga olib kelishi mumkin.
                  </p>
                  <p>
                    Steply xizmatlarni yaxshilash, xatolarni tuzatish
                    va xavfsizlikni ta’minlash uchun platforma
                    funksiyalarini yangilashi mumkin. Pullik xizmatlarga
                    ta’sir qiladigan o‘zgarishlar tegishli shartlar va
                    amaldagi qonunchilikka muvofiq amalga oshirilishi
                    kerak.
                  </p>
                  <p>
                    Shartlarga kiritilgan o‘zgarishlar ushbu sahifada
                    e’lon qilinadi. Muhim o‘zgarishlar uchun, zarur
                    bo‘lganda, foydalanuvchilarga alohida xabar beriladi.
                  </p>
                </div>
              </section>

              <section
                id="privacy"
                className="scroll-mt-8 rounded-2xl border bg-card p-5 sm:p-7"
              >
                <SectionHeading number="08" title="Maxfiylik va aloqa" />
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    Shaxsiy ma’lumotlarni yig‘ish, qayta ishlash, saqlash
                    va himoya qilish tartibi Steply maxfiylik siyosatida
                    bayon etiladi. Platformadan foydalanishdan oldin
                    ushbu hujjat bilan ham tanishib chiqing.
                  </p>
                  <p>
                    Shartlar, hisob, obuna yoki to‘lovlar bo‘yicha
                    savollaringiz bo‘lsa, aloqa sahifasi orqali murojaat
                    yuborishingiz mumkin.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/privacy"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                  >
                    <LockKeyhole className="size-4" />
                    Maxfiylik siyosati
                    <ArrowRight className="size-4" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Biz bilan bog‘lanish
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <h2 className="text-sm font-bold">Nashrdan oldingi tekshiruv</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sahifani ommaga chiqarishdan oldin xizmat egasining
                    yuridik nomi va aloqa ma’lumotlari, shartlarning
                    kuchga kirish sanasi, obunani bekor qilish tartibi
                    va pulni qaytarish siyosatini tasdiqlang.
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
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      </div>
    </div>
  )
}