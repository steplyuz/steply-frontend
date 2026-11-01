
/** @type {import('next').NextConfig} */

// Backend API manzili.
// Agar .env.local ichida BACKEND_API_URL bo'lsa, shu qiymat ishlatiladi.
const backendUrl =
  process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'

// 'use client' layout'lar metadata eksport qila olmaydi.
// Shu sababli admin va dashboard sahifalarini indekslashdan yopamiz.
const noindexHeaders = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow',
  },
]

// Dev rejimida ngrok orqali kirishga ruxsat berilgan originlar.
const devOrigins = (
  process.env.NEXT_DEV_ORIGINS ||
  'unbend-unfilled-overlaid.ngrok-free.dev'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const nextConfig = {
  allowedDevOrigins: devOrigins,

  experimental: {
    // Listening audio yuklash uchun so'rov hajmi limiti.
    proxyClientMaxBodySize: '110mb',
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${backendUrl}/static/:path*`,
      },
      {
        source: '/auth/telegram/callback',
        destination: '/telegram/callback',
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: noindexHeaders,
      },
      {
        source: '/dashboard/:path*',
        headers: noindexHeaders,
      },
    ]
  },

  images: {
    unoptimized: true,
  },
}

export default nextConfig
