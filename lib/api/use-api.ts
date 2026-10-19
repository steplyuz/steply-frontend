'use client'

import { useCallback, useEffect, useState } from 'react'
import { get } from './dashboard'

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(!!path)

  const load = useCallback(async () => {
    if (!path) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setData(await get<T>(path))
    } catch (e) {
      setData(null)
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { data, error, loading, reload: load }
}
