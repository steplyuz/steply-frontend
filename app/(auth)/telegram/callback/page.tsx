"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"

import { authApi } from "@/shared/api"
import { homeUrlForRole } from "@/shared/providers/auth-context"
import { Uz, useAlphabet } from "@/shared/providers/alphabet-provider"
import { safeNextPath } from "@/features/auth/components/auth-shared"

/* Xato matnlari kalit sifatida saqlanadi — ekranda t() orqali tanlangan alifboda chiqadi */
const ERRORS = {
  failed: "Telegram orqali kirish amalga oshmadi.",
  noSession: "Sessiya yaratilmadi. Iltimos, qaytadan urinib ko‘ring.",
} as const
type ErrorKey = keyof typeof ERRORS

const BRAND_GRADIENT = "linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)"

function TelegramCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useAlphabet()
  const [error, setError] = useState<ErrorKey | null>(null)

  useEffect(() => {
    let active = true

    async function finish() {
      if (searchParams.get("status") !== "success") {
        if (active) setError("failed")
        return
      }

      const me = await authApi.me().catch(() => null)
      if (!active) return

      if (!me) {
        setError("noSession")
        return
      }

      // Open-redirect himoyasi: faqat sayt ichidagi yo‘llarga ruxsat
      const next = safeNextPath(searchParams.get("next"))
      router.replace(next || homeUrlForRole(me.global_role))
    }

    void finish()
    return () => {
      active = false
    }
  }, [router, searchParams])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_24px_64px_rgba(15,61,38,0.10)] ring-1 ring-[#0F3D26]/[0.06]"
        role="status"
        aria-live="polite"
      >
        {error ? (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-[#DC2626]">
              <AlertCircle className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-bold text-foreground">
              <Uz>Telegram bilan kirish amalga oshmadi</Uz>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{t(ERRORS[error])}</p>
            <Link
              href="/login"
              style={{ backgroundImage: BRAND_GRADIENT }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-lg shadow-[#0F3D26]/20 transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
            >
              <Uz>Qayta urinish</Uz>
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#E4F1E9]">
              <Loader2 className="size-6 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-bold text-foreground">
              <Uz>Telegram tasdiqlanmoqda</Uz>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <Uz>Sessiyangiz xavfsiz tarzda yaratilmoqda…</Uz>
            </p>
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