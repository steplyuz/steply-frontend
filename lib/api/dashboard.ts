// Minimal fetch klient (cookie sessiya). Loyihangizda tayyor klient bo‘lsa, faqat `req` ni almashtiring.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  const res = await fetch(`${BASE}/api/v1${path}`, {
    credentials: 'include',
    ...init,
    headers: isForm ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    let msg = res.statusText || 'Xatolik'
    try {
      const j = await res.json()
      if (typeof j?.error?.message === 'string') msg = j.error.message
      else if (typeof j?.detail === 'string') msg = j.detail
      else if (typeof j?.message === 'string') msg = j.message
    } catch {}
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json().catch(() => undefined)) as T
}

export const get = <T>(p: string) => req<T>(p)
export const post = <T>(p: string, body?: unknown) =>
  req<T>(p, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
export const put = <T>(p: string, body: unknown) => req<T>(p, { method: 'PUT', body: JSON.stringify(body) })
export const patch = <T>(p: string) => req<T>(p, { method: 'PATCH' })
export const del = <T>(p: string) => req<T>(p, { method: 'DELETE' })
export const upload = <T>(p: string, file: File) => {
  const f = new FormData()
  f.append('file', file)
  return req<T>(p, { method: 'POST', body: f })
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Xatolik yuz berdi')
