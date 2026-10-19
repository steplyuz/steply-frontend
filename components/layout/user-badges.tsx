'use client'

import { useEffect, useState } from 'react'
import { INK, LIME, initials } from '@/lib/brand'
import { resolveAssetUrl } from '@/lib/api/config'

/**
 * Foydalanuvchi avatari. `src` — backenddagi `profile.avatar_url` (nisbiy yo'l bo'lishi mumkin,
 * shuning uchun resolveAssetUrl orqali to'liq manzilga aylantiriladi). Rasm yo'q yoki yuklanmasa —
 * ism bosh harflari ko'rsatiladi.
 */
export function UserAvatar({
  name,
  src,
  className = 'size-9',
}: {
  name?: string | null
  src?: string | null
  className?: string
}) {
  const url = resolveAssetUrl(src)
  const [failed, setFailed] = useState(false)

  // Yangi rasm yuklanganda (url o'zgarganda) xato holati tiklanadi
  useEffect(() => setFailed(false), [url])

  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full bg-foreground/5 object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: LIME, color: INK }}
    >
      {initials(name)}
    </span>
  )
}

export function CefrBadge({ code }: { code?: string | null }) {
  if (!code) return null
  return (
    <span
      className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium"
      style={{ backgroundColor: INK, color: LIME }}
    >
      {code}
    </span>
  )
}
