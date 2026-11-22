// Xabarnomalar: kanal/holat/kategoriya nomlari va yordamchi funksiyalar (user va admin uchun umumiy).
import type { NotificationCategory, NotificationChannel, NotificationMessageStatus } from '@/shared/api/types'

export const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  sms: 'SMS',
  telegram: 'Telegram',
  email: 'Email',
  in_app: 'Ilova ichida',
}

export const CHANNEL_ORDER: NotificationChannel[] = ['in_app', 'sms', 'telegram', 'email']

export const STATUS_LABEL: Record<NotificationMessageStatus, string> = {
  queued: 'Navbatda',
  sent: 'Yuborilgan',
  failed: 'Xato',
  cancelled: 'Bekor qilingan',
}

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  transactional: 'Tranzaksion',
  marketing: 'Reklama',
}

/** Shablon va xabar matnidagi {{nom}} o'zgaruvchilari (takrorlanmas, tartibda). */
export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>()
  const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) found.add(m[1])
  return Array.from(found)
}

/** Matn ro'yxatini ajratadi: yangi qator, vergul, nuqtali vergul yoki bo'shliq bo'yicha. */
export function splitList(text: string): string[] {
  return text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
}

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('uz-UZ') : '—'

/** Xabar ichidagi havola xavfsizmi: faqat ichki yo'l (/...) yoki https. */
export function isSafeLink(link: string | null | undefined): boolean {
  if (!link) return false
  return link.startsWith('/') && !link.startsWith('//') || link.startsWith('https://')
}
