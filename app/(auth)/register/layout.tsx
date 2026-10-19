import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
  description: "Steply'da bepul ro'yxatdan o'ting va CEFR Multilevel ko‘nikmalarini practice orqali rivojlantirishni boshlang.",
  alternates: { canonical: '/register' },
  openGraph: { type: 'website', locale: 'uz_UZ', siteName: 'Steply', url: '/register', title: "Ro'yxatdan o'tish | Steply" },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
