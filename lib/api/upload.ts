// Progress bilan fayl yuklash (XHR). fetch upload-progressni bermaydi, shuning uchun XHR.
//
// Auth cookie orqali ishlaydi (withCredentials). 401 da client.ts dagi `withSessionRetry` ishlaydi.

import { apiUrl } from './config'
import { apiErrorFrom, buildForm, unwrap, withSessionRetry } from './client'

export interface UploadOptions {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
  /** Maydon nomi (backend `file` kutadi) */
  fieldName?: string
}

interface RawResponse {
  status: number
  body: unknown
}

function sendOnce(path: string, form: FormData, { onProgress, signal }: UploadOptions): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', apiUrl(path))
    xhr.withCredentials = true
    // Content-Type ni QO'LDA qo'ymang: brauzer multipart boundary bilan o'zi qo'yadi.

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      let body: unknown = null
      try { body = JSON.parse(xhr.responseText) } catch { /* JSON emas */ }
      resolve({ status: xhr.status, body })
    }
    xhr.onerror = () => reject(new Error('Tarmoq xatosi: server bilan aloqa uzildi.'))
    xhr.ontimeout = () => reject(new Error('Yuklash vaqti tugadi.'))
    xhr.onabort = () => reject(new DOMException('Yuklash bekor qilindi.', 'AbortError'))

    if (signal) {
      if (signal.aborted) return reject(new DOMException('Yuklash bekor qilindi.', 'AbortError'))
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(form)
  })
}

/** `path` — `/api/v1` dan keyingi yo'l, masalan '/admin/listening-tests/audio/upload'. */
export async function uploadWithProgress<T>(path: string, file: File | Blob, options: UploadOptions = {}): Promise<T> {
  const form = buildForm({ [options.fieldName ?? 'file']: file })

  const res = await withSessionRetry(() => sendOnce(path, form, options), (r) => r.status)

  if (res.status < 200 || res.status >= 300) {
    throw apiErrorFrom(res.body, res.status, `Yuklash xatosi (${res.status})`)
  }
  return unwrap<T>(res.body)
}
