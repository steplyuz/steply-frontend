// Umumiy formatlash yordamchilari: vaqt, sana, pul.
// Bir xil formatlash bu yerda bir marta yoziladi — komponentlar o'z nusxasini yozmasin.

/** Bir xonali sonni ikki xonali qiladi: 5 -> "05". */
export const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * Soniyani "mm:ss" ko'rinishiga keltiradi; 1 soatdan ko'p bo'lsa "h:mm:ss".
 * Manfiy yoki kasr qiymat: manfiy 0 deb olinadi, kasr pastga yaxlitlanadi.
 */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`
}

/** ISO sanani uz-UZ formatida qaytaradi. Qiymat yo'q bo'lsa '—'. */
export function formatDate(value?: string | null, opts?: { withTime?: boolean }): string {
  if (!value) return '—'
  const d = new Date(value)
  if (opts?.withTime) {
    return d.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return d.toLocaleDateString('uz-UZ')
}

/** Sana va soat (admin jadvallari uchun). */
export const formatDateTime = (value?: string | null): string => formatDate(value, { withTime: true })

/** Summani "1 234 so‘m" ko'rinishida. Qiymat yo'q bo'lsa '—'. */
export function formatMoney(amount?: number | null): string {
  if (amount == null) return '—'
  return `${amount.toLocaleString('uz-UZ')} so‘m`
}
