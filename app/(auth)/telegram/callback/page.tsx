"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { authApi } from "@/lib/api"
import { homeUrlForRole } from "@/lib/auth/auth-context"

function TelegramCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function finish() {
      if (searchParams.get("status") !== "success") {
        if (active) setError("Telegram orqali kirish amalga oshmadi.")
        return
      }

      const me = await authApi.me().catch(() => null)
      if (!active) return

      if (!me) {
        setError("Sessiya yaratilmadi. Iltimos, qaytadan urinib ko‘ring.")
        return
      }

      const next = searchParams.get("next")
      router.replace(next || homeUrlForRole(me.global_role))
    }

    void finish()
    return () => {
      active = false
    }
  }, [router, searchParams])

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#FBFCF6] px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_24px_64px_rgba(20,24,0,0.07)]">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Telegram bilan kirish amalga oshmadi</h1>
            <p className="mt-3 text-sm text-[#777982]">{error}</p>
            <a
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#D4F53C] px-5 text-sm font-semibold text-foreground"
            >
              Qayta urinish
            </a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-8 animate-spin text-foreground" />
            <h1 className="mt-5 text-xl font-bold text-foreground">Telegram tasdiqlanmoqda</h1>
            <p className="mt-2 text-sm text-[#777982]">Sessiyangiz xavfsiz tarzda yaratilmoqda…</p>
          </>
        )}
      </div>
    </main>
  )
}

// useSearchParams() Next.js'da Suspense chegarasini talab qiladi (build'da prerender xatosini oldini oladi).
export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={null}>
      <TelegramCallbackContent />
    </Suspense>
  )
}
