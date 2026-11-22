// Referal kodi: ?ref=KOD havoladan olinadi va brauzerda saqlanadi.
// Google, Telegram va SMS ro'yxatdan o'tish paytida backendga yuboriladi.
// Backend kodni faqat YANGI akkauntga bog'laydi (mavjud userlar mukofot ololmaydi).

const STORAGE_KEY = 'steply:referral-code'
const TTL_MS = 30 * 24 * 60 * 60 * 1000
const CODE_RE = /^[A-Z0-9_-]{3,32}$/

interface Stored {
  code: string
  savedAt: number
}

/** Kodni katta harfga keltiradi va formatini tekshiradi. Noto'g'ri bo'lsa ''. */
export function normalizeReferralCode(raw: string | null | undefined): string {
  const value = (raw ?? '').trim().toUpperCase()
  return CODE_RE.test(value) ? value : ''
}

/** Joriy URL query'sidagi ?ref= ni saqlaydi. Kod bo'lmasa, avvalgi saqlangan kod o'zgarmaydi. */
export function captureReferralFromUrl(search: string): void {
  if (typeof window === 'undefined') return
  const code = normalizeReferralCode(new URLSearchParams(search).get('ref'))
  if (!code) return
  try {
    const stored: Stored = { code, savedAt: Date.now() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Maxfiy rejim yoki bloklangan storage: referal shunchaki saqlanmaydi.
  }
}

/** Saqlangan referal kodi (muddati o'tgan bo'lsa ''). */
export function getStoredReferralCode(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return ''
    const data = JSON.parse(raw) as Partial<Stored>
    const fresh = typeof data.savedAt === 'number' && Date.now() - data.savedAt <= TTL_MS
    if (!fresh || typeof data.code !== 'string') {
      window.localStorage.removeItem(STORAGE_KEY)
      return ''
    }
    return normalizeReferralCode(data.code)
  } catch {
    return ''
  }
}

/** Ro'yxatdan o'tish muvaffaqiyatli bo'lgach kodni o'chiradi (qayta ishlatilmasin). */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
