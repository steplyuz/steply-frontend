"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { authApi } from "@/lib/api"
import type { Me } from "@/lib/api/types"

const GOOGLE_GSI_SCRIPT = "https://accounts.google.com/gsi/client"

interface PromptNotification {
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => string
  isSkippedMoment: () => boolean
  getSkippedReason: () => string
  isDismissedMoment: () => boolean
  getDismissedReason: () => string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            nonce?: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          prompt: (momentListener?: (notification: PromptNotification) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon"
              theme?: "outline" | "filled_blue" | "filled_black"
              size?: "large" | "medium" | "small"
              text?: "signin_with" | "signup_with" | "continue_with" | "signin"
              shape?: "rectangular" | "pill" | "circle" | "square"
              logo_alignment?: "left" | "center"
              width?: number | string
              locale?: string
            },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script")
    el.src = GOOGLE_GSI_SCRIPT
    el.async = true
    el.defer = true
    el.onload = () => (window.google?.accounts?.id ? resolve() : reject(new Error("Google Identity yuklanmadi")))
    el.onerror = () => reject(new Error("Google skripti yuklanmadi"))
    document.head.appendChild(el)
  }).catch((err) => {
    googleScriptPromise = null
    throw err
  })

  return googleScriptPromise
}

interface Options {
  onSuccess: (me: Me) => void
  onError: (message: string) => void
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  locale?: string
}

export function useGoogleLogin({ onSuccess, onError, text = "signin_with", locale = "uz" }: Options) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [available, setAvailable] = useState(true)
  const buttonRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<{ nonce: string; clientId: string } | null>(null)
  const callbacks = useRef({ onSuccess, onError })
  callbacks.current = { onSuccess, onError }
  const textRef = useRef(text)
  textRef.current = text
  const localeRef = useRef(locale)
  localeRef.current = locale

  const renderGoogleButton = useCallback((element?: HTMLElement | null) => {
    const el = element || buttonRef.current
    if (!el || !window.google?.accounts?.id || !sessionRef.current?.clientId) return
    el.innerHTML = ""
    const parentWidth = el.parentElement?.clientWidth || el.clientWidth || 360
    const buttonWidth = Math.min(Math.max(parentWidth, 200), 400)

    window.google.accounts.id.renderButton(el, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: textRef.current,
      shape: "rectangular",
      logo_alignment: "left",
      width: buttonWidth,
      locale: localeRef.current,
    })
  }, [])

  const prepare = useCallback(async () => {
    setReady(false)
    sessionRef.current = null
    try {
      const [, res] = await Promise.all([loadGoogleScript(), authApi.googleNonce()])
      if (!res?.client_id) {
        setAvailable(false)
        return
      }
      sessionRef.current = { nonce: res.nonce, clientId: res.client_id }

      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: res.client_id,
          nonce: res.nonce,
          callback: async (response: { credential: string }) => {
            if (!response?.credential) {
              void prepare()
              return
            }
            setBusy(true)
            try {
              await authApi.googleVerify(response.credential)
              const me = await authApi.me()
              callbacks.current.onSuccess(me)
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Google orqali kirishda xatolik yuz berdi"
              callbacks.current.onError(msg)
              void prepare()
            } finally {
              setBusy(false)
            }
          },
        })
        setReady(true)
        setAvailable(true)
      }
    } catch {
      setAvailable(false)
    }
  }, [])

  useEffect(() => {
    void prepare()
  }, [prepare])

  useEffect(() => {
    if (!ready || !buttonRef.current) return
    const el = buttonRef.current
    renderGoogleButton(el)

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastWidth = el.parentElement?.clientWidth || 0

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width)
        if (w > 0 && Math.abs(w - lastWidth) > 4) {
          lastWidth = w
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            renderGoogleButton(el)
          }, 150)
        }
      }
    })

    if (el.parentElement) {
      ro.observe(el.parentElement)
    }

    return () => {
      if (timer) clearTimeout(timer)
      ro.disconnect()
    }
  }, [ready, renderGoogleButton])

  const start = useCallback(() => {
    if (!ready || busy || !window.google?.accounts?.id) {
      if (!available) {
        callbacks.current.onError("Google bilan kirish hozircha sozlanmagan.")
      }
      return
    }

    // Google Identity Services prompt (One Tap)
    window.google.accounts.id.prompt((notification: PromptNotification) => {
      if (typeof notification?.isNotDisplayed === "function" && notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason()
        console.warn("[Google GSI] Not displayed reason:", reason)
        if (reason === "unregistered_origin") {
          callbacks.current.onError("Ushbu domen Google Cloud Console'da (Authorized JavaScript origins) ro'yxatdan o'tmagan.")
        } else if (reason === "opt_out_or_no_session") {
          callbacks.current.onError("Google hisobingiz topilmadi. Iltimos, to'g'ridan-to'g'ri Google tugmasini bosing.")
        }
      }
    })
  }, [ready, busy, available])

  return { ready, busy, available, start, prepare, buttonRef, renderGoogleButton }
}
