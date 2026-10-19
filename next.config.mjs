/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000'

// 'use client' layout'lar metadata eksport qila olmaydi,
// shuning uchun ularni HTTP header orqali indekslashdan yopamiz.
const noindexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]

// Dev rejimida saytni ngrok orqali ochish uchun ruxsat berilgan originlar (.env: NEXT_DEV_ORIGINS=host1,host2)
const devOrigins = (process.env.NEXT_DEV_ORIGINS || "unbend-unfilled-overlaid.ngrok-free.dev")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const nextConfig = {
  allowedDevOrigins: devOrigins,
  experimental: {
    // /api/v1/* backendga proxy orqali o'tadi. Default 10 MB — listening audio (lib/api/modules/listening.ts:
    // MAX_AUDIO_MB = 100) yuklanmaydi. Limit audio limitidan biroz katta; katta so'rovlar xotirada buferlanadi.
    proxyClientMaxBodySize: '110mb',
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
      { source: '/static/:path*', destination: `${backendUrl}/static/:path*` },
      { source: '/auth/telegram/callback', destination: '/telegram/callback' },
      { source: '/health', destination: `${backendUrl}/health` },
    ]
  },
  async headers() {
    return [
      { source: '/admin/:path*', headers: noindexHeaders },
      { source: '/dashboard/:path*', headers: noindexHeaders },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
