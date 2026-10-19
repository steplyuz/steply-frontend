"use client"

// Telegram Login — popup rejimi (callback sahifasisiz, redirect URI'siz).
//
// Oqim: backend bir martalik nonce beradi -> telegram-login.js popup ochadi ->
// popup `id_token` ni shu sahifadagi JS'ga qaytaradi -> id_token backendga yuboriladi,
// backend imzo/issuer/audience/exp/nonce ni tekshirib O'ZINING cookie sessiyasini ochadi.
// Telegram tokeni hech qayerda (localStorage ham) saqlanmaydi.
//
// MUHIM: popup'ni brauzer faqat foydalanuvchi bosishi bilan SINXRON chaqirilganda ochadi.
// Shuning uchun skript va nonce sahifa ochilganda oldindan yuklanadi, `start()` esa await qilmaydi.

import { useCallback, useEffect, useRef, useState } from "react"

import { authApi } from "@/lib/api"
import type { Me } from "@/lib/api/types"

// BotFather'dagi "Login Widget" bo'limi bergan embed kodidagi skript manzili bilan solishtiring.
const TELEGRAM_LOGIN_SCRIPT = "https://telegram.org/js/telegram-login.js"

type TelegramLoginResult = { id_token?: string; error?: string }

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          options: { client_id: number; scope?: string[]; lang?: string; nonce?: string },
          callback: (result: TelegramLoginResult | false | null | undefined) => void,
        ) => void
      }
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadTelegramScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.Telegram?.Login) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script")
    el.src = TELEGRAM_LOGIN_SCRIPT
    el.async = true
    el.onload = () => (window.Telegram?.Login ? resolve() : reject(new Error("Telegram Login yuklanmadi")))
    el.onerror = () => reject(new Error("Telegram skripti yuklanmadi"))
    document.head.appendChild(el)
  }).catch((err) => {
    scriptPromise = null // keyingi urinishda qayta yuklash mumkin bo'lsin
    throw err
  })
  return scriptPromise
}

interface Options {
  onSuccess: (me: Me) => void
  onError: (message: string) => void
}

export function useTelegramLogin({ onSuccess, onError }: Options) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const session = useRef<{ nonce: string; clientId: number } | null>(null)
  const callbacks = useRef({ onSuccess, onError })
  callbacks.current = { onSuccess, onError }

  // Nonce bir martalik: har urinishdan keyin (muvaffaqiyatli yoki yo'q) yangisi olinadi.
  const prepare = useCallback(async () => {
    setReady(false)
    session.current = null
    try {
      const [, { nonce, client_id }] = await Promise.all([loadTelegramScript(), authApi.telegramNonce()])
      session.current = { nonce, clientId: Number(client_id) }
      setReady(true)
    } catch {
      callbacks.current.onError("Telegram bilan kirish hozircha mavjud emas. Keyinroq urinib ko'ring.")
    }
  }, [])

  useEffect(() => {
    void prepare()
  }, [prepare])

  const start = useCallback(() => {
    const current = session.current
    if (!current || busy || !window.Telegram?.Login) return
    session.current = null
    setReady(false)

    // Sinxron chaqiruv — popup bloklanmasligi uchun.
    window.Telegram.Login.auth(
      { client_id: current.clientId, scope: ["profile", "phone"], nonce: current.nonce },
      async (result) => {
        if (!result || result.error || !result.id_token) {
          // Foydalanuvchi popup'ni yopgan bo'lishi mumkin — xato ko'rsatilmaydi, faqat qayta tayyorlanadi.
          void prepare()
          return
        }
        setBusy(true)
        try {
          await authApi.telegramVerify(result.id_token)
          const me = await authApi.me()
          callbacks.current.onSuccess(me)
        } catch {
          callbacks.current.onError("Telegram orqali kirish amalga oshmadi. Qaytadan urinib ko'ring.")
          void prepare()
        } finally {
          setBusy(false)
        }
      },
    )
  }, [busy, prepare])

  return { start, ready, busy }
}
