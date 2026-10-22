'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { ApiRequestError } from '@/lib/api/client'
import { formatLockError } from '@/lib/api/resource'
import type { LockResult } from '@/lib/api/types'

type Props = {
  onLock: () => Promise<LockResult>
  onUnlock: () => Promise<unknown>
}

const btn =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50'

/** Admin: testni lock (muzlatish) va lock OFF (qayta tahrirlash) tugmalari. */
export function LockControls({ onLock, onUnlock }: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const errText = (err: unknown) =>
    err instanceof ApiRequestError ? err.message : err instanceof Error ? err.message : 'Xatolik yuz berdi'

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch (err) {
      setMessage({ text: errText(err), ok: false })
    } finally {
      setBusy(false)
    }
  }

  const lock = () => run(async () => {
    const res = await onLock()
    if (res.success) setMessage({ text: 'Test lock qilindi.', ok: true })
    else setMessage({ text: res.errors.map(formatLockError).join('; '), ok: false })
  })

  const unlock = () => run(async () => {
    if (!confirm("Lock olib tashlansinmi? Test qayta tahrirlanadi (eski tarix saqlanadi).")) return
    await onUnlock()
    setMessage({ text: "Lock olib tashlandi. Endi tahrirlash mumkin.", ok: true })
  })

  return (
    <div className="flex items-center gap-2">
      <button onClick={lock} disabled={busy} className={btn}>
        <Lock className="size-3.5" /> Lock
      </button>
      <button onClick={unlock} disabled={busy} className={btn}>
        <Unlock className="size-3.5" /> Lock OFF
      </button>
      {message && (
        <span className={`max-w-[240px] truncate text-xs font-medium ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}
          title={message.text}>
          {message.text}
        </span>
      )}
    </div>
  )
}
