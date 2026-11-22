'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, ExternalLink } from 'lucide-react'
import { notificationsInboxApi } from '@/shared/api'
import { getErrorMessage } from '@/shared/api/client'
import type { InboxItem } from '@/shared/api/types'
import { formatDateTime, isSafeLink } from '@/shared/lib/notification-labels'
import { cardClass, Empty, ErrorBox, Loading } from '@/shared/ui/dashboard-kit'

const PAGE = 20
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

/** To'liq bildirishnomalar ro'yxati: filtr, o'qilgan belgisi, sahifalash. */
export function InboxList() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [items, setItems] = useState<InboxItem[]>([])
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async (offset: number) => {
    setLoading(true)
    setError(null)
    try {
      const page = await notificationsInboxApi.list({ unread_only: filter === 'unread', offset, limit: PAGE })
      setTotal(page.total)
      setUnread(page.unread)
      setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]))
    } catch (e) {
      setError(getErrorMessage(e, 'Bildirishnomalarni yuklab bo‘lmadi'))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void fetchPage(0)
  }, [fetchPage])

  const markRead = async (item: InboxItem) => {
    if (!item.is_read) {
      try {
        await notificationsInboxApi.markRead(item.id)
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_read: true, read_at: new Date().toISOString() } : i)))
        setUnread((n) => Math.max(0, n - 1))
      } catch (e) {
        setError(getErrorMessage(e))
        return
      }
    }
    if (!isSafeLink(item.link)) return
    if (item.link!.startsWith('/')) router.push(item.link!)
    else window.open(item.link!, '_blank', 'noopener,noreferrer')
  }

  const markAll = async () => {
    try {
      await notificationsInboxApi.markAllRead()
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
      setUnread(0)
      if (filter === 'unread') void fetchPage(0)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const tab = (key: 'all' | 'unread', label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        filter === key ? 'bg-[#0F3D26] text-white' : 'bg-white text-[#0F2A1C] ring-1 ring-[#0F3D26]/15 hover:bg-[#E4F1E9]/70'
      } ${focusRing}`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tab('all', 'Barchasi')}
          {tab('unread', `O‘qilmagan${unread ? ` (${unread})` : ''}`)}
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={unread === 0}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[#1F7A4D] ring-1 ring-[#1F7A4D]/25 hover:bg-[#E4F1E9]/70 disabled:opacity-40 ${focusRing}`}
        >
          <CheckCheck className="size-3.5" aria-hidden="true" /> Hammasini o‘qildi deb belgilash
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={() => void fetchPage(0)} />}

      {!error && loading && items.length === 0 && <Loading rows={4} />}

      {!loading && !error && items.length === 0 && (
        <Empty text={filter === 'unread' ? 'O‘qilmagan bildirishnoma yo‘q' : 'Hozircha bildirishnoma yo‘q'} />
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => markRead(item)}
                className={`${cardClass} flex w-full items-start gap-4 p-4 text-left transition hover:ring-[#0F3D26]/20 ${focusRing}`}
              >
                <span className={`mt-2 size-2.5 shrink-0 rounded-full ${item.is_read ? 'bg-transparent ring-1 ring-[#0F3D26]/20' : 'bg-[#1F7A4D]'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`text-sm ${item.is_read ? 'font-medium text-[#0F2A1C]/75' : 'font-semibold text-[#0F2A1C]'}`}>{item.title}</span>
                    <span className="text-[11px] text-[#0F2A1C]/45">{formatDateTime(item.created_at)}</span>
                  </span>
                  <span className="mt-1 block whitespace-pre-line break-words text-sm text-[#0F2A1C]/65">{item.body}</span>
                  {isSafeLink(item.link) && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1F7A4D]">
                      <ExternalLink className="size-3.5" aria-hidden="true" /> Ochish
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && items.length < total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void fetchPage(items.length)}
            disabled={loading}
            className={`rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0F2A1C] ring-1 ring-[#0F3D26]/15 hover:bg-[#E4F1E9]/70 disabled:opacity-50 ${focusRing}`}
          >
            {loading ? 'Yuklanmoqda…' : 'Ko‘proq yuklash'}
          </button>
        </div>
      )}
    </div>
  )
}
