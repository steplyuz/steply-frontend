"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarCtx = { loaded: boolean; failed: boolean; setStatus: (s: "loaded" | "failed") => void }
const Ctx = React.createContext<AvatarCtx | null>(null)

function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  const [status, setStatus] = React.useState<"idle" | "loaded" | "failed">("idle")
  return (
    <Ctx.Provider value={{ loaded: status === "loaded", failed: status === "failed", setStatus: (s) => setStatus(s) }}>
      <span data-slot="avatar" className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} {...props} />
    </Ctx.Provider>
  )
}

function AvatarImage({ className, src, alt, ...props }: React.ComponentProps<"img">) {
  const ctx = React.useContext(Ctx)
  if (!src || ctx?.failed) return null
  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt ?? ""}
      onLoad={() => ctx?.setStatus("loaded")}
      onError={() => ctx?.setStatus("failed")}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  const ctx = React.useContext(Ctx)
  if (ctx?.loaded) return null
  return (
    <span
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center rounded-full bg-muted text-sm", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
