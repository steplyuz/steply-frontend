'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import type { OnboardingPlan } from '@/shared/api/types'
import { LIME } from '@/shared/lib/brand'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

function daysUntil(iso: string): number | null {
  const target = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Joriy holatga qarab eng muhim bitta eslatma matnini tanlaydi */
function pickReminder(plan: OnboardingPlan | null | undefined, hasOnboarding: boolean): { text: string; urgent: boolean } {
  if (!hasOnboarding) {
    return { text: 'Hali AI rejangiz yo‘q. Bir necha savolga javob bering — shaxsiy reja tuzib beraman.', urgent: true }
  }
  if (!plan) {
    return { text: 'Rejangiz hali tayyorlanmagan. Onboardingni yakunlang.', urgent: true }
  }
  const left = plan.exam ? daysUntil(plan.exam.date) : null
  if (left !== null && left <= 7 && left >= 0) {
    return { text: left === 0 ? 'Imtihon bugun! Omad tilayman 🎯' : `Imtihoningizga ${left} kun qoldi — bugungi mashqni unutmang.`, urgent: true }
  }
  if (plan.milestones?.length) {
    const next = plan.milestones[0]
    return { text: `Keyingi bosqich: ${next}`, urgent: false }
  }
  return { text: `Kuniga ${plan.daily_minutes} daqiqa mashq — bugun ham davom eting!`, urgent: false }
}

/**
 * Burchakdagi AI eslatma widgeti: doimiy kichik tugma + muhim holatlarda
 * avtomatik ochiladigan toast.
 */
export function AiReminder({ plan, loading, hasOnboarding }: { plan: OnboardingPlan | null | undefined; loading?: boolean; hasOnboarding: boolean }) {
  const [open, setOpen] = useState(false)
  const [dismissedToast, setDismissedToast] = useState(false)
  const reminder = useMemo(() => pickReminder(plan, hasOnboarding), [plan, hasOnboarding])

  // Muhim holatda bir marta avtomatik toast ko‘rsatish
  const [showToast, setShowToast] = useState(false)
  useEffect(() => {
    if (loading) return
    if (reminder.urgent && !dismissedToast) {
      setShowToast(true)
    }
  }, [reminder.urgent, dismissedToast, loading])

  if (loading) return null

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* ───── Toast (faqat muhim holatda) ───── */}
      {showToast ? (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-bottom-2 w-[min(90vw,320px)] rounded-2xl bg-foreground p-4 text-white shadow-2xl ring-1 ring-[#0F3D26]/[0.07] motion-reduce:animate-none"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: LIME, color: '#0F3D26' }}
            >
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{reminder.text}</p>
            <button
              type="button"
              onClick={() => {
                setShowToast(false)
                setDismissedToast(true)
              }}
              aria-label="Yopish"
              className={`-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white ${focusRing}`}
            >
              <X className="size-4" />
            </button>
          </div>
          {!hasOnboarding || !plan ? (
            <Link
              href="/dashboard/onboarding"
              className="mt-3 inline-flex min-h-9 items-center rounded-full px-4 text-xs font-bold text-foreground"
              style={{ background: LIME }}
            >
              Rejani tuzish
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* ───── Doimiy ixcham panel ───── */}
      {open ? (
        <div className="w-[min(90vw,300px)] rounded-3xl bg-white p-4 shadow-xl ring-1 ring-[#0F3D26]/[0.07]">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground/60">
              <Sparkles aria-hidden="true" className="size-3.5" style={{ color: '#8CB800' }} />
              AI eslatma
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Yopish"
              className={`flex size-6 items-center justify-center rounded-full text-foreground/40 transition hover:bg-black/5 hover:text-foreground ${focusRing}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-2 text-sm font-medium leading-snug text-foreground">{reminder.text}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="AI eslatma"
        className={`flex size-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 active:scale-95 motion-reduce:transition-none ${focusRing}`}
        style={{ background: LIME, color: '#0F3D26' }}
      >
        <Sparkles aria-hidden="true" className="size-6" />
      </button>
    </div>
  )
}
