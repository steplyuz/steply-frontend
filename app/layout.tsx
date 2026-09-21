import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/auth-context'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Steply — Mock imtihon platformasi',
  description: "Steply — CEFR Multilevel imtihoniga onlayn tayyorgarlik va mock-test markazi.",
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#FFFFFF' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-background">
      <body className={inter.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
