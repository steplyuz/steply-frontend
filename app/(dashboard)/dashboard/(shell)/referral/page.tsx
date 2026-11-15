'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Gift } from 'lucide-react'
import { referralApi } from '@/shared/api'
import type { ReferralMe } from '@/shared/api/types'
import { FOCUS, LIME } from '@/shared/lib/brand'
import { Card, ErrorBox, Loading, PageHeader } from '@/shared/ui/dashboard-kit'

function errText(e: unknown) {
  return e instanceof Error ? e.message : 'Ma’lumotni yuklab bo‘lmadi'
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[#0F3D26]/[0.04] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/55">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralMe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const load = () => {
    setError(null)
    referralApi.me().then(setData).catch((e) => setError(errText(e)))
  }

  useEffect(() => { load() }, [])

  if (error) return <ErrorBox message={error} onRetry={load} />
  if (!data) return <Loading rows={3} />

  const link = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${data.code}` : ''

  const copy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard ruxsat berilmagan bo'lishi mumkin */
    }
  }

  const rewards: string[] = []
  if (data.reward.credits > 0) rewards.push(`${data.reward.credits} ta qo‘shimcha test`)
  if (data.reward.tier_days > 0) rewards.push(`${data.reward.tier_days} kunlik obuna`)

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Do‘stlarni taklif qil"
        desc="Do‘stingiz ro‘yxatdan o‘tib, onboardingni to‘liq tugatganda mukofot olasiz"
        eyebrow="Referal"
      />

      {!data.enabled && (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Referal dasturi hozircha yoqilmagan.
        </div>
      )}

      <Card className="space-y-5 p-5 sm:p-7">
        <div>
          <p className="text-sm font-semibold text-foreground">Sizning referal kodingiz</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-[#0F3D26]/[0.06] px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-foreground">
              {data.code}
            </span>
            <button
              type="button"
              onClick={() => copy(data.code, 'code')}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0F3D26]/[0.07] px-5 text-sm font-bold text-foreground transition hover:bg-[#0F3D26]/[0.12] ${FOCUS}`}
            >
              {copied === 'code' ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === 'code' ? 'Nusxalandi' : 'Kodni nusxalash'}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Taklif havolasi</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="max-w-full truncate rounded-xl bg-muted/50 px-4 py-2 text-sm text-foreground/80">{link}</code>
            <button
              type="button"
              onClick={() => copy(link, 'link')}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-foreground transition ${FOCUS}`}
              style={{ background: LIME }}
            >
              {copied === 'link' ? <Check className="size-4" /> : <Gift className="size-4" />}
              {copied === 'link' ? 'Nusxalandi' : 'Havolani nusxalash'}
            </button>
          </div>
        </div>

        {rewards.length > 0 && (
          <p className="text-sm text-foreground/70">
            Har bir to‘liq ro‘yxatdan o‘tgan do‘st uchun: {rewards.join(' va ')}.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Tile label="Taklif qilganlar" value={data.invited} />
        <Tile label="Kutilmoqda" value={data.pending} />
        <Tile label="Mukofot olingan" value={data.qualified} />
        <Tile label="Qolgan kreditlar" value={data.credits_available} />
      </div>
    </div>
  )
}
