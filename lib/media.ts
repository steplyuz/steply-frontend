/**
 * Backend qaytargan media yo'lini (masalan nomzod rasmi `photo_url`) <img src> uchun
 * yaroqli URL'ga aylantiradi.
 *  - to'liq URL (https://..., data:, blob:) — o'zgarishsiz
 *  - nisbiy yo'l (/static/...) — same-origin; next.config.mjs rewrites backendga yo'naltiradi
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null
  const v = url.trim()
  if (!v) return null
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('blob:')) return v
  return v.startsWith('/') ? v : `/${v}`
}
