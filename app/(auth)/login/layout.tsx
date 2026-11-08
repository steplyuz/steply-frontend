/* app/login/layout.tsx */

import type { Metadata } from 'next'

const TITLE = 'Kirish'
const DESCRIPTION =
  "Steply hisobingizga telefon raqam, Google yoki Telegram orqali kiring va milliy sertifikat imtihoniga tayyorgarligingizni davom ettiring."

export const metadata: Metadata = {
  title: TITLE, // root layout'dagi template: "Kirish | Steply"
  description: DESCRIPTION,
  alternates: { canonical: '/login' },
  // Kirish sahifasi qidiruv natijalarida chiqishi shart emas, lekin havolalarni kuzatish mumkin
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Steply',
    url: '/login',
    title: `${TITLE} | Steply`,
    description: DESCRIPTION,
    // MUHIM: openGraph berilsa, root layout'dagi openGraph to'liq almashadi (rasm ham yo'qoladi),
    // shuning uchun rasm bu yerda qayta beriladi.
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Steply — Milliy sertifikat practice platformasi' }],
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}