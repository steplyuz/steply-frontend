'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save, Trash2 } from 'lucide-react'
import { adminTiersApi, billingApi } from '@/shared/api'
import type { AdminSkillKey, AdminSkillMatrix, AdminTestAccessRule, AdminTierKey, SubscriptionTier } from '@/shared/api/types'

export const dynamic = 'force-dynamic'

const TIERS: { key: AdminTierKey; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'plus', label: 'Plus' },
  { key: 'pro', label: 'Pro' },
]
const SKILLS: { key: AdminSkillKey; label: string }[] = [
  { key: 'READING', label: 'Reading' },
  { key: 'LISTENING', label: 'Listening' },
  { key: 'WRITING', label: 'Writing' },
  { key: 'SPEAKING', label: 'Speaking' },
]
const card = 'rounded-2xl border border-border bg-card p-5 shadow-xs'
const field = 'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40'
const btnDark = 'inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50'
const btnLight = 'inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50'

type LimitDraft = Record<AdminTierKey, { weekly: string; monthly: string }>
type Flash = { tone: 'ok' | 'err'; text: string } | null

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Xatolik yuz berdi')

export default function AdminTiersPage() {
  const [matrix, setMatrix] = useState<AdminSkillMatrix | null>(null)
  const [limits, setLimits] = useState<LimitDraft | null>(null)
  const [rules, setRules] = useState<AdminTestAccessRule[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<Flash>(null)

  const [testSkill, setTestSkill] = useState<AdminSkillKey>('READING')
  const [testId, setTestId] = useState('')
  const [testTiers, setTestTiers] = useState<Record<AdminTierKey, boolean>>({ free: false, plus: false, pro: false })

  const notify = (tone: 'ok' | 'err', text: string) => {
    setFlash({ tone, text })
    setTimeout(() => setFlash(null), 3000)
  }

  const load = useCallback(async () => {
    try {
      const [m, l, r] = await Promise.all([adminTiersApi.skills(), billingApi.tierLimits(), adminTiersApi.testAccess()])
      setMatrix(m)
      setLimits(Object.fromEntries(TIERS.map(({ key }) => [key, {
        weekly: String(l[key]?.practice.weekly_limit ?? ''),
        monthly: String(l[key]?.practice.monthly_limit ?? ''),
      }])) as LimitDraft)
      setRules(r)
    } catch (e) {
      notify('err', errText(e))
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Qoidalarni (skill, test) bo'yicha guruhlash
  const grouped = useMemo(() => {
    const map = new Map<string, { skill: AdminSkillKey; test_id: string; tiers: AdminTierKey[] }>()
    for (const r of rules) {
      const k = `${r.skill}:${r.test_id}`
      const g = map.get(k) ?? { skill: r.skill, test_id: r.test_id, tiers: [] }
      g.tiers.push(r.tier)
      map.set(k, g)
    }
    return [...map.values()]
  }, [rules])

  const toggleSkill = (tier: AdminTierKey, skill: AdminSkillKey) =>
    setMatrix((m) => (m ? { ...m, [tier]: { ...m[tier], [skill]: !m[tier][skill] } } : m))

  const saveSkills = async (tier: AdminTierKey) => {
    if (!matrix) return
    setBusy(`skills-${tier}`)
    try {
      setMatrix(await adminTiersApi.saveSkills(tier, matrix[tier]))
      notify('ok', `${tier.toUpperCase()} skill ruxsatlari saqlandi`)
    } catch (e) {
      notify('err', errText(e))
    } finally {
      setBusy(null)
    }
  }

  const saveLimit = async (tier: AdminTierKey) => {
    if (!limits) return
    const parse = (v: string) => (v.trim() === '' ? null : Number(v))
    setBusy(`limit-${tier}`)
    try {
      await billingApi.setPracticeLimit({
        tier: tier as SubscriptionTier,
        weekly_limit: parse(limits[tier].weekly),
        monthly_limit: parse(limits[tier].monthly),
      })
      notify('ok', `${tier.toUpperCase()} limiti saqlandi`)
    } catch (e) {
      notify('err', errText(e))
    } finally {
      setBusy(null)
    }
  }

  const saveTest = async (tiers: AdminTierKey[]) => {
    const id = testId.trim()
    if (!id) return notify('err', 'Test ID kiriting')
    setBusy('test')
    try {
      await adminTiersApi.saveTestAccess(testSkill, id, tiers)
      setRules(await adminTiersApi.testAccess())
      notify('ok', tiers.length ? 'Test tariflari saqlandi' : 'Test qoidasi o‘chirildi (eski qoida qaytdi)')
    } catch (e) {
      notify('err', errText(e))
    } finally {
      setBusy(null)
    }
  }

  const loadRule = (g: { skill: AdminSkillKey; test_id: string; tiers: AdminTierKey[] }) => {
    setTestSkill(g.skill)
    setTestId(g.test_id)
    setTestTiers({ free: g.tiers.includes('free'), plus: g.tiers.includes('plus'), pro: g.tiers.includes('pro') })
  }

  const selectedTiers = (): AdminTierKey[] => TIERS.filter((t) => testTiers[t.key]).map((t) => t.key)

  return (
    <div className="container-shell mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tariflar va testlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Har bir tarif qaysi skill va testlarni ochishini boshqaring</p>
        </div>
        <button onClick={load} className={btnLight}><RefreshCw className="size-3.5" /> Yangilash</button>
      </div>

      {flash && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${flash.tone === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-error/30 bg-error/10 text-error'}`}>
          {flash.text}
        </div>
      )}

      {/* 1. Skill matritsasi */}
      <section className={card}>
        <h2 className="text-base font-semibold text-foreground">Tarif → skill ruxsatlari</h2>
        <p className="mt-1 text-xs text-muted-foreground">Free tarif uchun ham shu yerda sozlanadi.</p>
        {!matrix ? (
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-3 py-2">Skill</th>
                  {TIERS.map((t) => <th key={t.key} className="px-3 py-2 text-center">{t.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SKILLS.map((s) => (
                  <tr key={s.key}>
                    <td className="px-3 py-3 font-medium text-foreground">{s.label}</td>
                    {TIERS.map((t) => (
                      <td key={t.key} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={matrix[t.key][s.key]}
                          onChange={() => toggleSkill(t.key, s.key)}
                          aria-label={`${t.label} — ${s.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  {TIERS.map((t) => (
                    <td key={t.key} className="px-3 pt-4 text-center">
                      <button onClick={() => saveSkills(t.key)} disabled={busy === `skills-${t.key}`} className={btnDark}>
                        <Save className="size-3.5" /> Saqlash
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* 2. Practice limitlari */}
      <section className={card}>
        <h2 className="text-base font-semibold text-foreground">Practice limitlari</h2>
        <p className="mt-1 text-xs text-muted-foreground">Bo‘sh qoldirilsa limit cheklanmaydi.</p>
        {!limits ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.key} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <label className="mt-3 block text-xs text-muted-foreground">
                  Haftalik
                  <input className={`${field} mt-1 w-full`} type="number" min={1} value={limits[t.key].weekly}
                    onChange={(e) => setLimits((l) => l && { ...l, [t.key]: { ...l[t.key], weekly: e.target.value } })} />
                </label>
                <label className="mt-3 block text-xs text-muted-foreground">
                  Oylik
                  <input className={`${field} mt-1 w-full`} type="number" min={1} value={limits[t.key].monthly}
                    onChange={(e) => setLimits((l) => l && { ...l, [t.key]: { ...l[t.key], monthly: e.target.value } })} />
                </label>
                <button onClick={() => saveLimit(t.key)} disabled={busy === `limit-${t.key}`} className={`${btnDark} mt-4`}>
                  <Save className="size-3.5" /> Saqlash
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Test → tarif */}
      <section className={card}>
        <h2 className="text-base font-semibold text-foreground">Test → tarif ruxsati</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Testning ID sini test bankidan oling. Testga tarif belgilansa, faqat shu tarif(lar) va yuqorilari ochadi.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <label className="block text-xs text-muted-foreground">
            Skill
            <select className={`${field} mt-1 block w-full`} value={testSkill} onChange={(e) => setTestSkill(e.target.value as AdminSkillKey)}>
              {SKILLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Test ID
            <input className={`${field} mt-1 block w-full`} value={testId} onChange={(e) => setTestId(e.target.value)} placeholder="masalan: 42" maxLength={64} />
          </label>
          <div className="flex flex-wrap gap-4 text-sm text-foreground">
            {TIERS.map((t) => (
              <label key={t.key} className="flex items-center gap-2">
                <input type="checkbox" className="size-4" checked={testTiers[t.key]}
                  onChange={(e) => setTestTiers((s) => ({ ...s, [t.key]: e.target.checked }))} />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => saveTest(selectedTiers())} disabled={busy === 'test'} className={btnDark}>
            <Save className="size-3.5" /> Saqlash
          </button>
          <button onClick={() => { setTestTiers({ free: false, plus: false, pro: false }); saveTest([]) }} disabled={busy === 'test' || !testId.trim()} className={btnLight}>
            <Trash2 className="size-3.5" /> Qoidani o‘chirish
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Skill</th>
                <th className="px-4 py-2">Test ID</th>
                <th className="px-4 py-2">Ochiq tariflar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Hali qoida yo‘q: barcha testlar eski qoida bo‘yicha ishlaydi</td></tr>
              )}
              {grouped.map((g) => (
                <tr key={`${g.skill}:${g.test_id}`} onClick={() => loadRule(g)} className="cursor-pointer hover:bg-muted/40">
                  <td className="px-4 py-2">{g.skill}</td>
                  <td className="px-4 py-2 font-mono text-xs">{g.test_id}</td>
                  <td className="px-4 py-2">{g.tiers.map((t) => t.toUpperCase()).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
