import Link from 'next/link'
import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Maxfiylik siyosati | Steply',
  description: 'Steply akkauntlari, testlar, billing va xavfsizlik ma’lumotlari qanday ishlatilishi haqida.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />
      <main className="container-shell mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Huquqiy ma’lumot</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Maxfiylik siyosati</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Ushbu matn platformaning amaldagi funksiyalariga mos loyiha siyosatidir. Nashrdan oldin ma’lumotlar uchun mas’ul yuridik shaxs, saqlash muddatlari va amaldagi qonunchilikka muvofiqligi loyiha egasi tomonidan tasdiqlanishi kerak.</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section><h2 className="text-lg font-bold">1. Qanday ma’lumotlar qayta ishlanishi mumkin?</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground"><li>Akkaunt va profil ma’lumotlari, jumladan ism, telefon raqami, til va vaqt zonasi.</li><li>Google yoki Telegram orqali kirilganda autentifikatsiya uchun zarur bo‘lgan provayder identifikatorlari va tegishli profil ma’lumotlari.</li><li>Practice va Mock Exam javoblari, urinishlar, natijalar, Writing javoblari va Speaking audio yozuvlari.</li><li>Billing buyurtmalari, to‘lov holati va foydalanuvchi yuborgan to‘lov cheki fayllari.</li><li>Hisob xavfsizligi uchun seans identifikatorlari, qurilma brauzeri haqidagi ma’lumotlar va IP manzili.</li></ul></section>

          <section><h2 className="text-lg font-bold">2. Ma’lumotlardan foydalanish maqsadi</h2><p className="mt-3 text-muted-foreground">Ma’lumotlar akkauntni yaratish va himoyalash, testlarni taqdim etish, javob va natijalarni saqlash, Writing/Speaking baholash jarayonlarini yuritish, buyurtma va to‘lovni tekshirish, limitlarni hisoblash hamda texnik muammolarni aniqlash uchun ishlatiladi.</p></section>

          <section><h2 className="text-lg font-bold">3. Cookie va seanslar</h2><p className="mt-3 text-muted-foreground">Kirish holatini saqlash uchun brauzer cookie’laridan foydalaniladi. Seanslarni boshqarish imkoniyati Sozlamalar bo‘limida mavjud. Brauzer cookie’larini bloklash autentifikatsiya yoki ayrim funksiyalar ishlashiga ta’sir qilishi mumkin.</p></section>

          <section><h2 className="text-lg font-bold">4. Uchinchi tomon xizmatlari</h2><p className="mt-3 text-muted-foreground">Google va Telegram kirish xizmatlari, shuningdek Writing AI tekshiruvi kabi funksiyalar ishlatilganda, so‘rovni bajarish uchun zarur ma’lumotlar tegishli provayderga uzatilishi mumkin. Aniq provayderlar ro‘yxati, hududlar va shartnomaviy asoslar nashrdan oldin platforma egasi tomonidan tasdiqlanishi kerak.</p></section>

          <section><h2 className="text-lg font-bold">5. To‘lov ma’lumotlari</h2><p className="mt-3 text-muted-foreground">Steply billing jarayonida buyurtma summasi, holati va foydalanuvchi yuborgan chek faylini saqlaydi. Ushbu loyihadagi odatiy to‘lov oqimi chekni yuborish va admin tasdig‘iga asoslanadi; karta rekvizitlari to‘lovni qabul qiluvchi tomon tomonidan sozlanadi.</p></section>

          <section><h2 className="text-lg font-bold">6. Saqlash, himoya va foydalanuvchi so‘rovlari</h2><p className="mt-3 text-muted-foreground">Ma’lumotlarga kirish xizmatni taqdim etish va xavfsizlik uchun zarur rollar bilan cheklanadi. Aniq saqlash muddatlari, o‘chirish jadvali va ma’lumotlarni eksport qilish tartibi alohida tasdiqlanishi lozim. Profil va seans sozlamalarini boshqarish uchun <Link href="/login" className="font-semibold underline underline-offset-4">akkauntingizga kiring</Link>.</p></section>

          <section><h2 className="text-lg font-bold">7. Murojaat</h2><p className="mt-3 text-muted-foreground">Maxfiylik bo‘yicha savol yoki so‘rov uchun <Link href="/contact" className="font-semibold underline underline-offset-4">Aloqa sahifasi</Link>dan foydalaning. Rasmiy kontakt ma’lumotlari sozlanmagan bo‘lsa, siyosat e’lon qilinishidan oldin ular qo‘shilishi kerak.</p></section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
