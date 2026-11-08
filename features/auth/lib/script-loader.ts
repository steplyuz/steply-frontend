// Tashqi skriptni (Telegram / Google Identity) bir marta yuklash.
// Telegram va Google login hooklari shu yerdan foydalanadi — nusxa yozilmaydi.

const cache = new Map<string, Promise<void>>()

export interface LoginCallbacks<U> {
  onSuccess: (me: U) => void
  onError: (message: string) => void
}

/**
 * `src` skriptini bir marta yuklaydi. `isReady()` true bo'lsa darhol hal bo'ladi.
 * Xato bo'lsa keshdan o'chiriladi, keyingi chaqiruvda qayta urinish mumkin.
 */
export function loadScriptOnce(
  src: string,
  isReady: () => boolean,
  messages: { loadFailed: string; notReady: string },
): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (isReady()) return Promise.resolve()
  const cached = cache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => (isReady() ? resolve() : reject(new Error(messages.notReady)))
    el.onerror = () => reject(new Error(messages.loadFailed))
    document.head.appendChild(el)
  }).catch((err) => {
    cache.delete(src)
    throw err
  })

  cache.set(src, promise)
  return promise
}
