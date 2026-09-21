// SiteHeader / dashboard sahifalari useAuth (Steply auth-context) orqali ishlaydi, u faqat
// mijoz tomonida mavjud bo'lgani uchun bu guruh build vaqtida statik emas, dinamik render qilinadi.
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
