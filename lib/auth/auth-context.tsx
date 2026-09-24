'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AUTH_CHANGED_EVENT, authApi, profileApi } from '@/lib/api'
import type { Me } from '@/lib/api/types'

interface AuthContextValue {
  user: Me | null
  isLoading: boolean
  isAuthenticated: boolean
  homeUrl: string
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// AuthProvider can be mounted/re-run during React Strict Mode and several
// layouts/components can subscribe at once. Keep one in-flight request and a
// short cache so a page never fires a /users/me request per consumer.
let mePromise: Promise<Me | null> | null = null
let cachedMe: Me | null = null
let cacheAt = 0
const CACHE_MS = 15_000

function invalidateAuthCache() {
  cachedMe = null
  cacheAt = 0
}

async function loadMe(force = false): Promise<Me | null> {
  const now = Date.now()
  if (!force && now - cacheAt < CACHE_MS) return cachedMe
  if (mePromise) return mePromise

  mePromise = profileApi.me()
    .then((me) => {
      cachedMe = me
      cacheAt = Date.now()
      return me
    })
    .catch(() => {
      cachedMe = null
      cacheAt = Date.now()
      return null
    })
    .finally(() => {
      mePromise = null
    })

  return mePromise
}

export function homeUrlForRole(role?: string | null): string {
  if (role === 'admin' || role === 'speaking_evaluator') return '/admin'
  return '/dashboard'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (force = false) => {
    const me = await loadMe(force)
    setUser(me)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void load()

    const onChange = () => {
      invalidateAuthCache()
      void load(true)
    }

    window.addEventListener(AUTH_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange)
  }, [load])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      invalidateAuthCache()
      setUser(null)
    }
  }, [])

  const homeUrl = homeUrlForRole(user?.global_role)

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      homeUrl,
      refresh: () => load(true),
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}
