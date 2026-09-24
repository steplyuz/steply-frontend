// Steply Backend API — asosiy so'rov qatlami.
//
// AUTH MODELI: faqat httpOnly cookie (access_token / refresh_token).
// Frontend tokenlarni localStorage'da saqlamaydi. Har bir so'rov `credentials: 'include'`
// bilan yuboriladi, brauzer cookie'ni o'zi biriktiradi.
//
// 401 kelsa: bitta marta /auth/refresh chaqiriladi, so'ng asl so'rov qayta yuboriladi.
// Xuddi shu mexanizm upload.ts (XHR) va download.ts (fetch) da ham ishlatiladi.

import { API_PREFIX, baseUrl, buildQuery, type QueryParams } from './config'

export { baseUrl }

// ---------------------------------------------------------------------------
// Xatoliklar
// ---------------------------------------------------------------------------

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> | null }

export class ApiRequestError extends Error {
  /** Backend'ning barqaror kodi, masalan "LOGIN__401". Status raqami emas. */
  code: string
  status: number
  /** Faqat 422 validatsiya xatolarida to'ladi: { maydon_nomi: [sabablar] } */
  fields?: Record<string, string[]> | null
  constructor(error: ApiError, status: number) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.code = error.code
    this.status = status
    this.fields = error.fields ?? null
  }
}

export const DEFAULT_ERROR_MESSAGE = "Nimadir xato ketdi. Iltimos, qaytadan urinib ko'ring."

type ErrorPayload = {
  error?: { code?: unknown; message?: unknown; fields?: Record<string, string[]> | null }
  detail?: unknown
  message?: unknown
}

/**
 * Backend xato javobini bitta shaklga keltiradi.
 * Asosiy shakl: `{ error: { status_code, code, message, fields } }` (app/core/errors.py).
 * Eski shakllar (`detail`, `message`) bilan ham moslik saqlangan.
 */
export function extractError(payload: unknown, status: number, fallback = DEFAULT_ERROR_MESSAGE): ApiError {
  const p = (payload ?? {}) as ErrorPayload
  const err = p.error
  if (err && typeof err === 'object') {
    return {
      code: typeof err.code === 'string' ? err.code : String(status),
      message: typeof err.message === 'string' ? err.message : fallback,
      fields: err.fields ?? null,
    }
  }
  if (typeof p.detail === 'string') return { code: String(status), message: p.detail }
  if (Array.isArray(p.detail)) {
    const message = p.detail
      .map((d: { msg?: string }) => d?.msg ?? JSON.stringify(d))
      .join('; ')
    return { code: String(status), message }
  }
  return { code: String(status), message: typeof p.message === 'string' && p.message ? p.message : fallback }
}

/** Backend javobidan tayyor `ApiRequestError` yasaydi (fetch, upload va download uchun umumiy). */
export function apiErrorFrom(payload: unknown, status: number, fallback?: string): ApiRequestError {
  return new ApiRequestError(extractError(payload, status, fallback), status)
}

/** `catch (e)` ichida: har qanday xatodan foydalanuvchiga ko'rsatiladigan matn olish. */
export function getErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  return error instanceof Error && error.message ? error.message : fallback
}

/** Backend javobi `{ data: ... }` ga o'ralgan bo'lsa ochib beradi. */
export function unwrap<T>(payload: unknown): T {
  const p = payload as { data?: unknown } | null
  return (p?.data ?? payload) as T
}

// ---------------------------------------------------------------------------
// Auth holati
// ---------------------------------------------------------------------------

export const AUTH_CHANGED_EVENT = 'steply:auth-changed'

/** Auth holati o'zgarganda (login/logout/refresh muvaffaqiyatsiz) hodisa chiqaradi. */
export function notifyAuthChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

let refreshPromise: Promise<boolean> | null = null

/** Sessiyani yangilaydi. Bir vaqtning o'zida faqat bitta refresh so'rovi yuboriladi. */
export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${baseUrl}${API_PREFIX}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        return res.ok
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

/**
 * Umumiy "401 -> sessiyani yangila -> bir marta qayta yubor" mexanizmi.
 * apiRequest (fetch), upload (XHR) va download shu funksiyani ishlatadi.
 */
export async function withSessionRetry<R>(send: () => Promise<R>, statusOf: (res: R) => number): Promise<R> {
  let res = await send()
  if (statusOf(res) === 401) {
    if (await refreshSession()) res = await send()
    else notifyAuthChanged()
  }
  return res
}

// ---------------------------------------------------------------------------
// So'rovlar
// ---------------------------------------------------------------------------

export interface RequestOptions extends RequestInit {
  /** login/register/otp kabi sessiyasiz so'rovlar uchun — 401 da refresh urinilmaydi */
  anonymous?: boolean
  /** avto-refresh-and-retry oqimini o'chirish (masalan /auth/refresh'ning o'zi uchun) */
  skipAuthRetry?: boolean
  query?: QueryParams
  /** FormData yuborilganda Content-Type ni brauzer o'zi qo'yadi */
  isForm?: boolean
}

export async function apiRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { anonymous, skipAuthRetry, query, isForm, headers, ...rest } = init

  const doFetch = (): Promise<Response> =>
    fetch(`${baseUrl}${API_PREFIX}${path}${buildQuery(query)}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    })

  const response =
    anonymous || skipAuthRetry ? await doFetch() : await withSessionRetry(doFetch, (r) => r.status)

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !anonymous) notifyAuthChanged()
    throw apiErrorFrom(payload, response.status)
  }

  return unwrap<T>(payload)
}

// React Strict Mode dev'da effectlarni ikki marta ishga tushiradi. Bir xil GET so'rovlar
// uchun "uchib turgan" (in-flight) promise bo'lishiladi. Mutatsiyalar hech qachon dedupe qilinmaydi.
const getInFlight = new Map<string, Promise<unknown>>()

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const key = `${path}${buildQuery(options?.query)}`
  const existing = getInFlight.get(key)
  if (existing) return existing as Promise<T>

  const request = apiRequest<T>(path, { ...options, method: 'GET' }).finally(() => {
    if (getInFlight.get(key) === request) getInFlight.delete(key)
  })
  getInFlight.set(key, request)
  return request
}

const withBody = (body: unknown) => (body !== undefined ? JSON.stringify(body) : undefined)

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'POST', body: withBody(body) })
}
export function apiPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'PUT', body: withBody(body) })
}
export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body: withBody(body) })
}
export function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
// --- Fayl yuklash (multipart/form-data) ---

export type UploadValue = File | Blob | string | number | null | undefined
/** `{ maydon: fayl | fayl[] | matn }` — bo'sh (undefined/null/'') qiymatlar yuborilmaydi. */
export type UploadParts = Record<string, UploadValue | Array<File | Blob>>

export function buildForm(parts: UploadParts): FormData {
  const form = new FormData()
  for (const [field, value] of Object.entries(parts)) {
    const items = Array.isArray(value) ? value : [value]
    for (const item of items) {
      if (item === undefined || item === null || item === '') continue
      form.append(field, typeof item === 'number' ? String(item) : item)
    }
  }
  return form
}

/** Barcha fayl yuklashlar uchun yagona funksiya: apiUpload(path, { file }) yoki { images: [...], exam_id }. */
export function apiUpload<T>(path: string, parts: UploadParts, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'POST', body: buildForm(parts), isForm: true })
}
