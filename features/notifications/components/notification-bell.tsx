'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { notificationsInboxApi } from '@/shared/api'
import type { InboxItem } from '@/shared/api/types'
import { formatDateTime, isSafeLink } from '@/shared/lib/notification-labels'
import { useUnreadCount } from '@/features/notifications/lib/use-unread-count'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

/** Qo'ng'iroqcha: o'qilmaganlar soni badge'i va so'nggi bildirishnomalar ro'yxati. */
export function NotificationBell({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<InboxItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const { unread, setUnread, refresh } = useUnreadCount(true)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (!next) return
    setBusy(true)
    try {
      const page = await notificationsInboxApi.list({ limit: 6 })
      setItems(page.items)
      setUnread(page.unread)
    } catch {
      setItems([])
    } finally {
      setBusy(false)
    }
  }

  const openItem = async (item: InboxItem) => {
    setOpen(false)
    if (!item.is_read) {
      try {
        await notificationsInboxApi.markRead(item.id)
      } catch {
        // o'qilgan belgisi saqlanmadi: keyingi yangilanishda qayta urinadi
      }
      void refresh()
    }
    if (!isSafeLink(item.link)) return
    if (item.link!.startsWith('/')) router.push(item.link!)
    else window.open(item.link!, '_blank', 'noopener,noreferrer')
  }

  const markAll = async () => {
    try {
      await notificationsInboxApi.markAllRead()
      setItems((prev) => prev?.map((i) => ({ ...i, is_read: true })) ?? null)
      setUnread(0)
    } catch {
      // ignore: keyingi yangilanish holatni ko'rsatadi
    }
  }

  const badge = unread > 9 ? '9+' : String(unread)

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread > 0 ? `Bildirishnomalar, ${unread} ta o‘qilmagan` : 'Bildirishnomalar'}
        className={`relative flex size-11 items-center justify-center rounded-full bg-white text-[#0F2A1C] ring-1 ring-[#0F3D26]/15 transition hover:bg-[#E4F1E9]/70 active:scale-[0.98] motion-reduce:transition-none ${focusRing} ${open ? 'bg-[#E4F1E9]/70' : ''}`}
      >
        <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#1F7A4D] px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-[#0F3D26]/15 ring-1 ring-[#0F3D26]/10"
        >
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <p className="text-sm font-semibold text-[#0F2A1C]">Bildirishnomalar</p>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#1F7A4D] hover:bg-[#E4F1E9]/70 disabled:opacity-40 ${focusRing}`}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" /> Hammasini o‘qildi
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {busy && (
              <div className="flex items-center justify-center py-8 text-[#0F2A1C]/55">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              </div>
            )}
            {!busy && items?.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-[#0F2A1C]/55">Hozircha bildirishnoma yo‘q</p>
            )}
            {!busy && items?.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => openItem(item)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#E4F1E9]/70 ${focusRing}`}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.is_read ? 'bg-transparent' : 'bg-[#1F7A4D]'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${item.is_read ? 'font-medium text-[#0F2A1C]/75' : 'font-semibold text-[#0F2A1C]'}`}>{item.title}</span>
                  <span className="line-clamp-2 text-xs text-[#0F2A1C]/60">{item.body}</span>
                  <span className="mt-0.5 block text-[11px] text-[#0F2A1C]/45">{formatDateTime(item.created_at)}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-1 border-t border-[#0F3D26]/10 pt-1.5">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2 text-center text-sm font-semibold text-[#1F7A4D] hover:bg-[#E4F1E9]/70 ${focusRing}`}
            >
              Hammasini ko‘rish
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
