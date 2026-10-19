import Link from 'next/link'
import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Foydalanish shartlari | Steply',
  description: 'Steply practice, Mock Exam, obuna va to‘lovlardan foydalanish shartlari.',
}

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader variant="public" />
      <main className="container-shell mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Huquqiy ma’lumot</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Foydalanish shartlari</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Quyidagi matn amaldagi funksiyalarni tavsiflaydigan loyiha shartlaridir. Nashrdan oldin xizmat egasi, kuchga kirish sanasi, qaytarish siyosati va huquqiy talablar bo‘yicha tasdiq zarur.</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section><h2 className="text-lg font-bold">1. Hisob va xavfsizlik</h2><p className="mt-3 text-muted-foreground">Foydalanuvchi ro‘yxatdan o‘tishda to‘g‘ri ma’lumot berishi, kirish ma’lumotlarini himoya qilishi va akkauntdagi shubhali faollik haqida xabar berishi kerak. Boshqa foydalanuvchi akkauntiga ruxsatsiz kirish, limitlarni chetlab o‘tish yoki platforma ishiga xalaqit berish taqiqlanadi.</p></section>

          <section><h2 className="text-lg font-bold">2. Practice va test materiallari</h2><p className="mt-3 text-muted-foreground">Platformada Reading, Listening, Writing va Speaking mashqlari, mavjud tahlil materiallari hamda Mock Exam bo‘lishi mumkin. Test tarkibi, mavjudligi va kirish huquqi administrator sozlamalari, obuna darajasi va kvotalarga bog‘liq. Practice kvotasi to‘rtta skill uchun umumiy hisoblanishi mumkin; Analysis limiti alohida hisoblanadi.</p><p className="mt-3 text-muted-foreground">Platformadagi natijalar tayyorgarlik uchun mo‘ljallangan va rasmiy IELTS balli, sertifikati yoki imtihon tashkilotchisi qarorini kafolatlamaydi.</p></section>

          <section><h2 className="text-lg font-bold">3. Obuna va xaridlar</h2><p className="mt-3 text-muted-foreground">Mavjud obuna tariflari PLUS va PRO darajalarini o‘z ichiga olishi mumkin. Narx, amal qilish muddati, AI kreditlari va foydalanish limitlari xarid oynasida ko‘rsatiladi. Xaridni boshlashdan oldin tarif tavsifi va summasini tekshiring.</p><p className="mt-3 text-muted-foreground">Qo‘lda tekshiriladigan to‘lovlarda foydalanuvchi buyurtma yaratadi, to‘lovni amalga oshiradi va chek faylini yuboradi. Pullik kirish huquqi buyurtma admin tomonidan tasdiqlanib, holati “Tasdiqlangan” bo‘lgandan keyin faollashadi. Tasdiqlash vaqti avtomatik kafolatlanmaydi.</p></section>

          <section><h2 className="text-lg font-bold">4. Bekor qilish va qaytarish</h2><p className="mt-3 text-muted-foreground">Platformada chek yuborilmagan yoki rad etilgan buyurtmani bekor qilish imkoniyati mavjud. Faol obunani akkaunt ichidan bekor qilish mumkin. Pulni qaytarish shartlari va istisnolari loyiha egasi tomonidan alohida tasdiqlanishi lozim; ushbu matn tasdiqlanmagan refund va’dasini bermaydi.</p></section>

          <section><h2 className="text-lg font-bold">5. Kontent va foydalanish qoidalari</h2><p className="mt-3 text-muted-foreground">Test materiallarini, boshqa foydalanuvchilarning javoblarini yoki shaxsiy ma’lumotlarini ruxsatsiz tarqatmang. Platformadan qonuniy maqsadlarda va xizmatning odatiy ishlashiga zarar yetkazmaydigan tarzda foydalaning.</p></section>

          <section><h2 className="text-lg font-bold">6. Xizmat mavjudligi va yangilanishlar</h2><p className="mt-3 text-muted-foreground">Texnik ishlar, tarmoq yoki uchinchi tomon xizmatlaridagi uzilishlar ayrim funksiyalar mavjudligiga ta’sir qilishi mumkin. Shartlar o‘zgartirilsa, yangilangan matn ushbu sahifada e’lon qilinadi. Yakuniy kuchga kirish sanasi nashrdan oldin belgilanadi.</p></section>

          <section><h2 className="text-lg font-bold">7. Aloqa va maxfiylik</h2><p className="mt-3 text-muted-foreground">Savollar uchun <Link href="/contact" className="font-semibold underline underline-offset-4">Aloqa sahifasi</Link>ga, ma’lumotlarni qayta ishlash haqida esa <Link href="/privacy" className="font-semibold underline underline-offset-4">Maxfiylik siyosati</Link>ga qarang.</p></section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
