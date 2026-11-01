// Authenticated fayl yuklab olish (PDF, ZIP va h.k.).
//
// <a href="/api/..."> ba'zi brauzerlarda cross-site holatda cookie'ni to'liq yubormasligi mumkin.
// fetch() + credentials:'include' + Blob — apiRequest bilan bir xil auth mexanizmi.

import { extractError, getErrorMessage, withSessionRetry } from './client'

/** Blob'ni brauzerda fayl sifatida saqlaydi. Object URL setTimeout bilan bo'shatiladi (ba'zi brauzerlarda darhol revoke yuklashni buzadi). */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface DownloadOptions {
  filename: string
  onError?: (msg: string) => void
}

/** Cookie orqali authenticated fetch -> Blob -> avtomatik download. */
export async function authenticatedDownload(url: string, { filename, onError }: DownloadOptions): Promise<boolean> {
  try {
    const res = await withSessionRetry(() => fetch(url, { credentials: 'include' }), (r) => r.status)

    if (!res.ok) {
      const payload: unknown = await res.json().catch(() => null)
      const fallback = `Yuklab olishda xatolik: ${res.status}`
      onError?.(extractError(payload, res.status, fallback).message)
      return false
    }

    saveBlob(await res.blob(), filename)
    return true
  } catch (err) {
    onError?.(getErrorMessage(err, 'Yuklab olishda kutilmagan xatolik'))
    return false
  }
}


/** Cookie orqali authenticated fetch -> Blob (ZIP ichiga qo'yish kabi hollar uchun). Xatoda Error tashlaydi. */
export async function authenticatedBlob(url: string): Promise<Blob> {
  const res = await withSessionRetry(() => fetch(url, { credentials: 'include' }), (r) => r.status)
  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => null)
    throw new Error(extractError(payload, res.status, `Faylni olishda xatolik: ${res.status}`).message)
  }
  return res.blob()
}
