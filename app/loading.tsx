// app/loading.tsx
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 text-center"
    >
      {/* Logotip: sidebar va bosh sahifa bilan bir xil (gradient nuqta + wordmark) */}
      <div className="flex items-center gap-2.5 text-4xl font-semibold tracking-tight text-foreground">
        <span
          aria-hidden="true"
          className="size-5 rounded-full bg-gradient-to-br from-brand-glow via-primary to-primary-strong shadow-sm shadow-primary-strong/20"
        />
        Steply
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary ring-1 ring-primary/10">
          <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">Yuklanmoqda…</p>
      </div>
    </main>
  )
}