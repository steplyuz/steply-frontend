import { Nunito_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './imthon/design-system.css'
import { AuthProvider } from '@/lib/auth/auth-context'
import TelegramScript from '@/components/TelegramScript'

const inter = Nunito_Sans({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' })

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://steply.uz').replace(/\/$/, '')
const SITE_NAME = 'Steply'
const TITLE = 'Steply — CEFR Practice platformasi'
const DESCRIPTION =
  "Steply — CEFR Multilevel uchun practice platformasi. Reading, Listening, Writing va Speaking ko‘nikmalarini mashqlar hamda AI yordamidagi baholash orqali rivojlantiring."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'Steply',
    'CEFR',
    'Multilevel',
    'CEFR Multilevel',
    'ingliz tili',
    'IELTS',
    'Reading',
    'Listening',
    'Writing',
    'Speaking',
    "onlayn test",
    "imtihonga tayyorgarlik",
    "O'zbekiston",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: '/',
  },
  // Telefon raqamlari, email va manzillar avtomatik havolaga aylanmasin
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    // images: app/opengraph-image.png faylidan avtomatik olinadi
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    // images: app/twitter-image.png faylidan avtomatik olinadi
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Google Search Console / Yandex Webmaster tasdiqlash kodlari (.env orqali)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  // icon.png, apple-icon.png, favicon.ico, manifest.ts — app/ ichidagi fayllardan avtomatik ulanadi
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#FFFFFF',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: DESCRIPTION,
      areaServed: 'UZ',
      knowsLanguage: ['uz', 'en'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: 'uz',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-background" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <TelegramScript />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}