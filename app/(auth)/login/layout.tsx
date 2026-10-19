import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kirish',
  description: "Steply hisobingizga Telegram orqali kiring va practice mashqlaringizni davom ettiring.",
  alternates: { canonical: '/login' },
  openGraph: { type: 'website', locale: 'uz_UZ', siteName: 'Steply', url: '/login', title: 'Kirish | Steply' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
