'use client'

import { useCallback, useEffect, useState } from 'react'
import { notificationsInboxApi } from '@/shared/api'

const POLL_MS = 60_000

/** O'qilmagan bildirishnomalar soni: har 60 soniyada va oyna fokusga kelganda yangilanadi. */
export function useUnreadCount(enabled: boolean) {
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await notificationsInboxApi.unreadCount()
      setUnread(res.unread)
    } catch {
      // Tarmoq xatosi: badge oldingi qiymatda qoladi.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const id = window.setInterval(() => void refresh(), POLL_MS)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, refresh])

  return { unread, setUnread, refresh }
}
