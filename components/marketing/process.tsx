import Link from "next/link"
import { ArrowRight, BookOpen, Headphones, Mic, Pencil } from "lucide-react"

const STEPS = [
  { icon: BookOpen, title: "Reading", body: "Matnlarni o‘qing, savollarni yeching va tushunishingizni mustahkamlang.", href: "/dashboard/reading" },
  { icon: Headphones, title: "Listening", body: "Audio topshiriqlar bilan tinglab tushunish ko‘nikmasini rivojlantiring.", href: "/dashboard/listening" },
  { icon: Pencil, title: "Writing", body: "Yozma topshiriqlarni bajaring va yozish mahoratingizni oshiring.", href: "/dashboard/writing" },
  { icon: Mic, title: "Speaking", body: "Gapirish mashqlari orqali fikringizni ravon ifodalashni mashq qiling.", href: "/dashboard/speaking" },
]

export function ProcessFlow() {
  return (
    <section className="container-shell py-16 sm:py-24" aria-labelledby="practice-process-title">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Practice jarayoni</p>
        <h2 id="practice-process-title" className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">O‘zingizga mos ko‘nikmadan boshlang</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Har bir bo‘limda mashq qiling, muntazamlikni saqlang va o‘rganishni bosqichma-bosqich davom ettiring.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body, href }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-foreground/30 hover:shadow-lg">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/20 text-foreground"><Icon className="size-5" /></span>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{body}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Mashq qilish <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
