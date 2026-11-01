/**
 * Backend qaytargan media yo'lini (masalan nomzod rasmi `photo_url`) <img src> uchun
 * yaroqli URL'ga aylantiradi. Qoida umumiy resolveAssetUrl'da (api/config.ts).
 */
import { resolveAssetUrl } from './api/config'

export function resolveMediaUrl(url?: string | null): string | null {
  const v = url?.trim()
  if (!v) return null
  return resolveAssetUrl(v)
}
