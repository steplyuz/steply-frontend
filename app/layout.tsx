import { Inter, Manrope } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
// import './imthon/design-system.css'
import { AuthProvider } from '@/shared/providers/auth-context'
import TelegramScript from '@/features/auth/components/telegram-script'
import { AlphabetProvider } from '@/shared/providers/alphabet-provider'

/* Shriftlar (variable nomlari globals.css dagi --font-sans / --font-display bilan bog'langan).
   MUHIM: next/font qiymatlari to'g'ridan-to'g'ri yozilgan literal bo'lishi shart —
   `subsets` ni o'zgaruvchiga chiqarib bo'lmaydi (build xatosi beradi).
   'latin-ext' — o'zbekcha belgilar (oʻ, gʻ, shuningdek o', Ğ, Ş, Ç) uchun, 'cyrillic' — kirill matn uchun. */

// Matn (paragraf, tugma, forma)
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

// Sarlavha va katta raqamlar
const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://steply.uz'
).replace(/\/+$/, '')

const SITE_NAME = 'Steply'
const TITLE = 'Steply — Milliy sertifikat practice platformasi'

const DESCRIPTION =
  'Steply — milliy sertifikat imtihonlariga tayyorgarlik platformasi. Barcha yo‘nalishlar bo‘yicha mock imtihonlar, mashqlar hamda AI yordamidagi baholash orqali natijangizni oshiring.'

const LOGO_URL = `${SITE_URL}/logo.png`
const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
const TWITTER_IMAGE_URL = `${SITE_URL}/twitter-image.png`

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
    'milliy sertifikat',
    'milliy sertifikat imtihoni',
    'mock imtihon',
    'DTM',
    'onlayn test',
    'imtihonga tayyorgarlik',
    'o‘zbekiston',
  ],

  authors: [
    {
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  referrer: 'origin-when-cross-origin',

  alternates: {
    canonical: '/',
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },

  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Steply — Milliy sertifikat practice platformasi',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: TWITTER_IMAGE_URL,
        alt: 'Steply — Milliy sertifikat practice platformasi',
      },
    ],
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

  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex:
      process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },

  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  // Mobil brauzer manzil paneli rangi: globals.css dagi --background (#f1f5f2) bilan bir xil
  themeColor: '#F1F5F2',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
      description: DESCRIPTION,
      areaServed: {
        '@type': 'Country',
        name: 'Uzbekistan',
      },
      knowsLanguage: ['uz', 'en'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: 'uz',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="uz"
      // Shrift o'zgaruvchisi <html> da: butun hujjat (body, portal, modal) shriftni oladi
      className={`bg-background ${inter.variable} ${manrope.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />

        <TelegramScript />

        <AuthProvider>
          {/* o'zbek alifbosi (eski/yangi) tanlovi: useAlphabet() / <Uz> */}
          <AlphabetProvider>{children}</AlphabetProvider>
        </AuthProvider>
      </body>
    </html>
  )
}