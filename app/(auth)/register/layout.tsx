/* app/login/layout.tsx */

import type { Metadata } from 'next'

/* Metadata server tomonida ishlaydi (t() ishlamaydi), shuning uchun matn bevosita
   yangi alifboda yozilgan (Ö Ğ Ş Ç). Eski alifboga qaytish kerak bo‘lsa: TITLE = 'Kirish'. */
const SITE_NAME = 'Steply'
const TITLE = 'Kiriş'
const DESCRIPTION =
  'Steply hisobingizga telefon raqam, Google yoki Telegram orqali kiring va milliy sertifikat imtihoniga tayyorgarligingizni davom ettiring.'
const OG_ALT = 'Steply — Milliy sertifikat practice platformasi'

export const metadata: Metadata = {
  title: TITLE, // root layout'dagi template: "Kiriş | Steply"
  description: DESCRIPTION,
  alternates: { canonical: '/login' },
  // Kirish sahifasi qidiruv natijalarida chiqishi shart emas, lekin havolalarni kuzatish mumkin
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: SITE_NAME,
    url: '/login',
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    // MUHIM: bolada openGraph berilsa, root layout'dagi openGraph to'liq almashadi (rasm ham yo'qoladi),
    // shuning uchun rasm bu yerda qayta beriladi.
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    // Twitter ham openGraph kabi root'dagi qiymatni almashtiradi — shu yerda qayta beriladi
    card: 'summary_large_image',
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    images: [{ url: '/twitter-image.png', alt: OG_ALT }],
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}