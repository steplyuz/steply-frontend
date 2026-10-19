"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveMediaUrl } from "@/lib/media"
export interface CandidateUser {
  full_name?: string | null
  photo_url?: string | null
  avatar_url?: string | null
  mk_id?: string | null
  profile?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

function initials(name?: string | null) {
  const v = (name ?? "").trim()
  if (!v) return "U"
  return v.split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

/**
 * Header'ning O'NG tomoni: nomzodning to'liq ismi va yonida surati.
 * Ma'lumot `useAuth().user` dan keladi (backend: GET /exams-auth/me) — qo'shimcha so'rov yo'q.
 */
export function CandidateBadge({ user }: { user: CandidateUser | null }) {
  const photo = resolveMediaUrl(user?.photo_url || user?.avatar_url || user?.profile?.avatar_url)
  const name = user?.full_name || user?.profile?.full_name || "Candidate"

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="max-w-[220px] truncate text-sm font-black leading-none text-foreground" title={name}>
          {name}
        </p>
        {user?.mk_id && (
          <p className="mt-1 font-mono text-[10px] font-bold tracking-tight text-muted-foreground/70">{user.mk_id}</p>
        )}
      </div>
      <Avatar className="size-11 border-2 border-white shadow-sm ring-1 ring-border">
        {photo && <AvatarImage src={photo} alt={name} />}
        <AvatarFallback className="bg-[#17776A] text-xs font-bold text-white">{initials(name)}</AvatarFallback>
      </Avatar>
    </div>
  )
}
