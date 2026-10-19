"use client"

import { usePathname } from "next/navigation"
import { BookCheck, ClipboardCheck } from "lucide-react"

type SkillKey = "reading" | "listening" | "writing" | "speaking"

const SKILLS: Record<SkillKey, { label: string; icon: string; tint: string }> = {
  reading: { label: "Reading", icon: "/images/oqish.png", tint: "bg-secondary border-border" },
  listening: { label: "Listening", icon: "/images/tinglash.png", tint: "bg-secondary border-border" },
  writing: { label: "Writing", icon: "/images/yozish.png", tint: "bg-secondary border-border" },
  speaking: { label: "Speaking", icon: "/images/microPhone.png", tint: "bg-secondary border-border" },
}

/** URL'dan hozir qaysi skill bajarilayotganini aniqlaydi (/exams/reading/start -> reading). */
export function skillFromPath(pathname: string): SkillKey | null {
  const seg = pathname.split("/")[2]
  return seg === "reading" || seg === "listening" || seg === "writing" || seg === "speaking" ? seg : null
}

/**
 * Header'ning CHAP tomoni: nomzod hozir qaysi skill testini bajarayotgani.
 * Skill sahifasida emas bo'lsa — umumiy "Exam System" (hub / natijalar).
 */
export function SkillIndicator({ generic = false }: { generic?: boolean }) {
  const pathname = usePathname()
  const skill = generic ? null : skillFromPath(pathname)

  if (!skill) {
    const isResults = pathname.startsWith("/exams/results")
    const Icon = isResults ? BookCheck : ClipboardCheck
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-primary shadow-sm">
          <Icon className="size-5" />
        </div>
        <span className="text-lg font-bold text-foreground">{isResults ? "Natijalar" : "Exam System"}</span>
      </div>
    )
  }

  const cfg = SKILLS[skill]
  return (
    <div className="flex min-w-0 items-center gap-3" aria-label={`Joriy bo'lim: ${cfg.label}`}>
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${cfg.tint}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cfg.icon} alt="" className="size-7 object-contain" />
      </div>
      <div className="min-w-0 leading-none">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Joriy bo&apos;lim</p>
        <p className="mt-1 truncate text-base font-black text-foreground">{cfg.label}</p>
      </div>
    </div>
  )
}
