'use client'

// Speaking javoblari HAR DOIM to'liq yozib olinadi va saqlanadi.
// Baholash (evaluator / AI) esa faqat Speaking'ni o'z ichiga olgan FAOL obunada ishlaydi.
// Bu yerda faqat UI holati aniqlanadi; baholashni cheklashning asl manbai — backend.

import { useEffect, useState } from 'react'
import { billingApi } from '@/lib/api'
import type { AiQuota } from '@/lib/api/types'

let cached: { at: number; canGrade: boolean } | null = null
const TTL_MS = 60_000

async function resolveCanGrade(): Promise<boolean> {
  let sub
  try {
    sub = await billingApi.mySubscription()
  } catch {
    return false // obuna yo'q (404) yoki olib bo'lmadi
  }
  if (!sub?.is_active) return false
  if (sub.end_date && new Date(sub.end_date).getTime() < Date.now()) return false

  try {
    const plans = await billingApi.plans()
    const plan = plans.find((p) => p.id === sub.plan_id)
    if (!plan) return true // faol obuna bor, reja topilmadi — to'sib qo'ymaymiz
    if (plan.included_skills?.length) return plan.included_skills.includes('SPEAKING')
    return plan.tier !== 'free'
  } catch {
    return true
  }
}

export function useSpeakingGrading() {
  const [state, setState] = useState<{ loading: boolean; canGrade: boolean }>(() => ({
    loading: !(cached && Date.now() - cached.at < TTL_MS),
    canGrade: cached?.canGrade ?? false,
  }))

  useEffect(() => {
    if (cached && Date.now() - cached.at < TTL_MS) return
    let alive = true
    resolveCanGrade().then((canGrade) => {
      cached = { at: Date.now(), canGrade }
      if (alive) setState({ loading: false, canGrade })
    })
    return () => {
      alive = false
    }
  }, [])

  return state
}

/**
 * Umumiy AI kreditlar (GET /billing/me/ai-quota): Writing va Speaking bitta pooldan.
 * Kvota backendda tekshiriladi; bu hook faqat UI uchun qolgan limitni ko'rsatadi.
 */
export function useAiQuota() {
  const [state, setState] = useState<{ loading: boolean; quota: AiQuota | null }>({ loading: true, quota: null })

  useEffect(() => {
    let alive = true
    billingApi
      .aiQuota()
      .then((quota) => alive && setState({ loading: false, quota }))
      .catch(() => alive && setState({ loading: false, quota: null }))
    return () => {
      alive = false
    }
  }, [])

  return state
}
