// Steply API — umumiy sozlamalar va URL yordamchilari.
//
// Brauzer so'rovlari `next.config.mjs` dagi rewrite orqali backendga proksi qilinadi,
// shuning uchun NEXT_PUBLIC_API_URL odatda bo'sh (same-origin).

export const API_PREFIX = '/api/v1'

export const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

export type QueryValue = string | number | boolean | undefined | null
export type QueryParams = Record<string, QueryValue>

/** Path segmentini xavfsiz kodlash: `${BASE}/${enc(id)}` */
export const enc = (value: string | number): string => encodeURIComponent(String(value))

/** `{ a: 1, b: undefined, c: '' }` -> `?a=1` (bo'sh/undefined qiymatlar tashlab yuboriladi) */
export function buildQuery(query?: QueryParams): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** To'liq API manzili (PDF/ZIP yuklab olish, XHR upload va h.k. uchun). */
export function apiUrl(path: string, query?: QueryParams): string {
  return `${baseUrl}${API_PREFIX}${path}${buildQuery(query)}`
}

/**
 * Backend nisbiy fayl manzili ("/static/...") qaytarsa, <audio>/<img> uchun to'liq manzil yasaydi.
 * Frontend va backend bir originda bo'lsa (baseUrl bo'sh) manzil o'zgarmaydi.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}
