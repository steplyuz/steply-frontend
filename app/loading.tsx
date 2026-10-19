// app/loading.tsx
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <img
        src="/logo.png"
        alt="Steply"
        className="h-10 w-auto object-contain"
      />

      <span className="inline-flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Yuklanmoqda...
      </span>
    </div>
  )
}