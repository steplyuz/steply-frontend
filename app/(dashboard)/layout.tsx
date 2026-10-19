import type { Metadata } from 'next'

// SiteHeader / dashboard sahifalari useAuth (Steply auth-context) orqali ishlaydi, u faqat
// mijoz tomonida mavjud bo'lgani uchun bu guruh build vaqtida statik emas, dinamik render qilinadi.
export const dynamic = 'force-dynamic'

// Shaxsiy kabinet — qidiruv tizimlariga indekslanmasin
export const metadata: Metadata = {
  title: 'Shaxsiy kabinet',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
