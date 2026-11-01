// Eski komponentlar uchun ingichka yo'l. Barcha so'rovlar lib/api/client.ts orqali o'tadi:
// cookie auth, 401'da bitta marta refresh, yagona xatolik formati (ApiRequestError).
// Yangi kod to'g'ridan-to'g'ri `@/lib/api` dan import qilsin.
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload, getErrorMessage } from './client'

export { ApiRequestError as ApiError } from './client'

export const get = <T>(p: string) => apiGet<T>(p)
export const post = <T>(p: string, body?: unknown) => apiPost<T>(p, body)
export const put = <T>(p: string, body: unknown) => apiPut<T>(p, body)
export const patch = <T>(p: string) => apiPatch<T>(p)
export const del = <T>(p: string) => apiDelete<T>(p)
export const upload = <T>(p: string, file: File) => apiUpload<T>(p, { file })

/** Xatolikdan foydalanuvchiga ko'rsatiladigan matn. `fallback` — xabar bo'lmaganda zaxira matn. */
export const errMsg = (e: unknown, fallback = 'Xatolik yuz berdi') => getErrorMessage(e, fallback)
