import { BookOpen, Headphones, Mic, Pencil } from "lucide-react"

const SKILLS = [
  { label: "Reading", description: "O‘qib tushunish", icon: BookOpen },
  { label: "Listening", description: "Tinglab tushunish", icon: Headphones },
  { label: "Writing", description: "Yozma nutq", icon: Pencil },
  { label: "Speaking", description: "Og‘zaki nutq", icon: Mic },
]

export function StatsStrip() {
  return (
    <section aria-label="Practice ko‘nikmalari" className="border-y border-border bg-background">
      <div className="container-shell grid grid-cols-2 gap-5 py-8 sm:grid-cols-4 sm:py-10">
        {SKILLS.map(({ label, description, icon: Icon }) => (
          <div key={label} className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-foreground"><Icon className="size-5" /></span>
            <span><span className="block text-sm font-bold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{description}</span></span>
          </div>
        ))}
      </div>
    </section>
  )
}
