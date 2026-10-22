'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight, Ban, Check, CheckCheck, CheckCircle2, Clock, Clock3, Copy, CreditCard, GraduationCap,
  Search, Sparkles, Ticket, UploadCloud, Wallet, X,
} from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import type { BillingLimits, BillingProduct } from '@/lib/api/types'
import { post, upload, errMsg } from '@/lib/api/dashboard'
import { FOCUS, LIME } from '@/lib/brand'
import { fmtDate, fmtMoney } from '@/components/dashboard/ui'

type PaymentRequisites = {
  card_number: string
  card_holder: string
  bank_name: string
  account_number?: string | null
  phone_number?: string | null
  instructions?: string | null
}

type Plan = { id: number; name: string; description?: string | null; price: number; duration_days: number; tier: string; ai_limit: number; exam_limit?: number; included_skills?: string[]; ai_enabled?: boolean; discount_percent?: number; is_active?: boolean }
type Order = { id: string; product_title?: string | null; product_type?: string; amount: number; discount_amount?: number; status: string; created_at: string }
type Sub = { end_date: string; is_active: boolean } | null
type Promo = { code: string; discount_amount: number; final_amount: number; discount_percent?: number | null; fixed_discount_amount?: number | null }

const HEAD_TINT = 'rgba(228,247,10,0.22)'

const TONE = {
  green: 'bg-emerald-100 text-emerald-800',
  sky: 'bg-sky-100 text-sky-800',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-800',
  muted: 'bg-foreground/5 text-foreground/60',
}
const orderTone = (s: string) =>
  /approv|paid/i.test(s) ? TONE.green : /review/i.test(s) ? TONE.sky : /reject|cancel/i.test(s) ? TONE.red : /pending/i.test(s) ? TONE.amber : TONE.muted
const orderLabel = (s: string) =>
  /approv|paid/i.test(s) ? 'Tasdiqlangan'
    : /review/i.test(s) ? 'Tekshiruvda'
      : /reject/i.test(s) ? 'Rad etilgan'
        : /cancel/i.test(s) ? 'Bekor qilingan'
          : /pending/i.test(s) ? 'To‘lov kutilmoqda'
            : s
const canPay = (s: string) => /pending|reject/i.test(s)

const pillDark = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none ${FOCUS}`
const pillLight = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground/5 px-6 py-2 text-sm font-bold text-foreground transition hover:bg-foreground/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`
const pillDanger = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-50 px-6 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`

const toNum = (x: unknown): number | null =>
  x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? null : Number(x)

function orderMeta(s: string): { icon: React.ElementType; color: string; done: number; current: number; showSteps: boolean } {
  if (/approv|paid/i.test(s)) return { icon: Check, color: '#059669', done: 3, current: -1, showSteps: true }
  if (/review/i.test(s)) return { icon: Search, color: '#0284C7', done: 1, current: 1, showSteps: true }
  if (/reject/i.test(s)) return { icon: X, color: '#DC2626', done: 0, current: 0, showSteps: true }
  if (/cancel/i.test(s)) return { icon: Ban, color: '#6B7280', done: 0, current: -1, showSteps: false }
  return { icon: Clock, color: '#D97706', done: 0, current: 0, showSteps: true }
}

const STEP_LABELS = ['To‘lov', 'Tekshiruv', 'Tasdiq']

function daysLeft(end: string) {
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000))
}

/** Dekorativ halqa — faqat bezak */
function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      aria-label={`${label}ni nusxalash`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* clipboard mavjud emas — e'tiborsiz */
        }
      }}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-foreground/70 ring-1 ring-black/5 transition hover:text-foreground active:scale-95 ${FOCUS}`}
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  )
}

function Detail({ label, value, sub, copy }: { label: string; value: string; sub?: string | null; copy?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-foreground/[0.04] p-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground/55">{label}</p>
        <p className="mt-1 break-all font-bold tabular-nums text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-foreground/55">{sub}</p>}
      </div>
      {copy && <CopyButton text={value.replace(/\s/g, '')} label={label} />}
    </div>
  )
}

function SectionTitle({ id, title, desc }: { id: string; title: string; desc?: string }) {
  return (
    <div>
      <h2 id={id} className="text-xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {desc && <p className="mt-1 text-sm text-foreground/60">{desc}</p>}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none ${className}`} />
}

function EmptyBox({ text }: { text: string }) {
  return <p className="rounded-3xl border border-dashed border-foreground/20 bg-white p-6 text-center text-sm text-foreground/60">{text}</p>
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700">Qayta urinish</button>
    </div>
  )
}

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => {
    let id2 = 0
    const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setM(true)) })
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2) }
  }, [])
  return m
}

function Step({ h, index, filled }: { h: number; index: number; filled: boolean }) {
  const m = useMounted()
  return (
    <div className="flex flex-1 flex-col justify-end">
      <div
        className="rounded-t-xl border border-dashed transition-[height,background-color,border-color] duration-700 ease-out motion-reduce:transition-none"
        style={{
          height: m ? `${h}%` : '0%',
          transitionDelay: `${index * 110}ms`,
          backgroundColor: filled ? LIME : 'transparent',
          borderColor: m && !filled ? 'rgba(255,255,255,0.2)' : 'transparent',
        }}
      />
    </div>
  )
}

function Fill({ pct, index }: { pct: number; index: number }) {
  const m = useMounted()
  return (
    <div
      className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out motion-reduce:transition-none"
      style={{ width: m ? `${pct}%` : '0%', transitionDelay: `${150 + index * 90}ms` }}
    />
  )
}

function UsageCard({ title, hint, right, pct, ariaLabel, max, now, footer, extra }: {
  title: string; hint?: React.ReactNode; right: string; pct?: number | null; ariaLabel: string; max?: number; now?: number; footer: React.ReactNode; extra?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          {hint && <div className="mt-1 text-xs text-foreground/55">{hint}</div>}
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{right}</span>
      </div>
      {pct != null && (
        <div role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={max} aria-valuenow={now} className="mt-3 h-2.5 overflow-hidden rounded-full bg-foreground/10">
          <Fill pct={pct} index={0} />
        </div>
      )}
      <p className="mt-2 text-xs text-foreground/60">{footer}</p>
      {extra}
    </div>
  )
}

export default function BillingPage() {
  const sub = useApi<Sub>('/billing/me/subscription')
  const limits = useApi<BillingLimits>('/billing/me/limits')
  const plans = useApi<Plan[]>('/billing/plans')
  const products = useApi<BillingProduct[]>('/billing/products')
  const orders = useApi<Order[]>('/billing/orders?limit=25')
  const paymentInfo = useApi<PaymentRequisites>('/billing/payment-details')

  // Admin tasdig‘i boshqa sessiyada bajarilishi mumkin: tabga qaytganda holatni yangilaymiz
  useEffect(() => {
    const refreshBillingState = () => {
      void limits.reload()
      void orders.reload()
    }
    window.addEventListener('focus', refreshBillingState)
    return () => window.removeEventListener('focus', refreshBillingState)
  }, [limits.reload, orders.reload])

  const [promo, setPromo] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [checkoutModal, setCheckoutModal] = useState<{ orderId: string; title: string; amount: number; status: string; productType?: string } | null>(null)
  const [modalReceiptFile, setModalReceiptFile] = useState<File | null>(null)
  const [modalUploading, setModalUploading] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancellingSub, setCancellingSub] = useState(false)

  function openCheckout(data: { orderId: string; title: string; amount: number; status: string; productType?: string }) {
    setCheckoutModal(data)
    setModalReceiptFile(null)
    setModalSuccess(false)
    setModalError(null)
  }

  async function handleCancelActiveSubscription() {
    setCancellingSub(true)
    try {
      await post('/billing/me/subscription/cancel')
      setMsg({ ok: true, text: 'Faol obuna muvaffaqiyatli bekor qilindi. Hisobingiz Free rejimiga qaytdi.' })
      sub.reload()
      limits.reload()
      orders.reload()
      setCancelConfirmOpen(false)
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    } finally {
      setCancellingSub(false)
    }
  }

  async function handleSubscribe(plan: Plan) {
    const key = `buy-plan-${plan.id}`
    setBusy(key)
    setMsg(null)
    try {
      const res = await post<Order>('/billing/orders', {
        product_type: 'subscription',
        product_id: String(plan.id),
        promo_code: appliedPromo ? appliedPromo.code : undefined,
      })
      orders.reload()
      sub.reload()
      openCheckout({ orderId: res.id, title: res.product_title || plan.name, amount: res.amount, status: res.status, productType: 'subscription' })
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    } finally {
      setBusy(null)
    }
  }

  async function handleBuyProduct(product: BillingProduct) {
    const key = `buy-product-${product.id}`
    setBusy(key)
    setMsg(null)
    try {
      const res = await post<Order>('/billing/orders', {
        product_type: product.product_type,
        product_id: String(product.id),
        promo_code: appliedPromo ? appliedPromo.code : undefined,
      })
      orders.reload()
      openCheckout({ orderId: res.id, title: res.product_title || product.title, amount: res.amount, status: res.status, productType: product.product_type })
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    } finally {
      setBusy(null)
    }
  }

  async function handleUploadModalReceipt() {
    if (!checkoutModal || !modalReceiptFile) return
    setModalUploading(true)
    setModalError(null)
    try {
      await upload(`/billing/orders/${checkoutModal.orderId}/receipt`, modalReceiptFile)
      setModalSuccess(true)
      orders.reload()
      sub.reload()
      limits.reload()
    } catch (e) {
      setModalError(errMsg(e))
    } finally {
      setModalUploading(false)
    }
  }

  async function handleApplyPromo() {
    const code = promo.trim()
    if (!code) {
      setAppliedPromo(null)
      setPromoError(null)
      return
    }
    setPromoChecking(true)
    setPromoError(null)
    try {
      const baseAmount = plans.data?.length ? Math.min(...plans.data.map((p) => Math.round(p.price * (1 - (p.discount_percent || 0) / 100)))) : 150000
      const res = await post<Promo>('/billing/promo/validate', { code, amount: baseAmount })
      setAppliedPromo(res)
    } catch (e) {
      setAppliedPromo(null)
      setPromoError(errMsg(e))
    } finally {
      setPromoChecking(false)
    }
  }

  async function cancelOrder(id: string) {
    const key = `c-${id}`
    setBusy(key)
    setMsg(null)
    try {
      await post(`/billing/orders/${id}/cancel`)
      setMsg({ ok: true, text: 'Buyurtma bekor qilindi.' })
      orders.reload()
      sub.reload()
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e) })
    } finally {
      setBusy(null)
    }
  }

  const active = !!sub.data?.is_active
  const left = active ? daysLeft(sub.data!.end_date) : 0

  const pay = paymentInfo.data
  const cardNum = pay?.card_number || ''
  const cardHolder = pay?.card_holder || ''
  const bankName = pay?.bank_name || ''
  const accNum = pay?.account_number || ''
  const phoneNum = pay?.phone_number || ''
  const instructions = pay?.instructions || 'To‘lov rekvizitlari administrator tomonidan hali sozlanmagan. Rekvizitlar tasdiqlanmaguncha to‘lov qilmang.'
  const hasPaymentDetails = Boolean(cardNum || bankName || accNum || phoneNum)

  const extraProducts = (products.data ?? []).filter(p => p.is_active && ['full_exam', 'writing_ai_credits', 'teacher_review_credits'].includes(p.product_type))

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {/* Hero + joriy obuna */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 text-foreground sm:p-8 lg:col-span-3 lg:min-h-72 lg:p-10" style={{ background: LIME }}>
          <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Wallet aria-hidden="true" className="size-3.5" /> Obuna va to‘lov
            </span>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tighter sm:text-6xl">Tarif va to‘lovlar</h1>
            <p className="mt-3 max-w-lg text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
              Obuna, haftalik limitlar va buyurtmalaringizni shu yerda boshqaring. To‘lov chekini yuboring — admin tasdiqlagach huquq faollashadi.
            </p>
          </div>
          <div className="relative z-10 flex flex-col gap-3 min-[420px]:flex-row">
            <a
              href="#plans"
              className={`group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 active:scale-[0.98] motion-reduce:transition-none min-[420px]:w-fit min-[420px]:justify-start ${FOCUS}`}
            >
              Tariflarni ko‘rish
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
            </a>
            <Link
              href="/dashboard/mock-exams"
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/70 px-6 py-2 text-[15px] font-bold text-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:transition-none min-[420px]:w-fit ${FOCUS}`}
            >
              <GraduationCap aria-hidden="true" className="size-4" /> Mock Exam katalogi
            </Link>
          </div>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10 flex h-full flex-1 flex-col">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Joriy obuna</h2>
              <p className="mt-0.5 text-xs text-white/55">Holat va qolgan muddat</p>
            </div>

            <div aria-hidden="true" className="mt-5 flex min-h-24 flex-1 items-stretch gap-2 sm:gap-3">
              {[34, 55, 77, 100].map((h, i) => (
                <Step key={h} h={h} index={i} filled={active || i === 0} />
              ))}
            </div>

            {sub.loading ? (
              <div className="mt-5 h-16 animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
            ) : sub.error ? (
              <p className="mt-5 text-sm text-white/70">Obuna holatini yuklab bo‘lmadi.</p>
            ) : active ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: LIME }} aria-hidden="true" /> Faol
                  </p>
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOpen(true)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-red-300 ${FOCUS}`}
                  >
                    Obunani bekor qilish
                  </button>
                </div>
                <p className="text-5xl font-black leading-none tracking-tighter tabular-nums sm:text-6xl" style={{ color: LIME }}>
                  {left} <span className="text-lg font-semibold tracking-normal text-white/70">kun qoldi</span>
                </p>
                <p className="text-sm text-white/60">{fmtDate(sub.data!.end_date)} gacha</p>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-3xl font-black tracking-tight">Free tarif</p>
                <p className="mt-1 text-sm text-white/65">Cheklovsiz mashq uchun tarif tanlang.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {msg && (
        <div
          role={msg.ok ? 'status' : 'alert'}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${msg.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}
        >
          <p className="flex-1">{msg.text}</p>
          <button type="button" onClick={() => setMsg(null)} aria-label="Xabarni yopish" className={`-m-1 rounded-full p-1 opacity-70 hover:opacity-100 ${FOCUS}`}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Limitlar */}
      <section aria-labelledby="billing-limits" className="rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
              <Clock3 aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="billing-limits" className="text-base font-extrabold text-foreground sm:text-lg">Haftalik limitlar</h2>
              {limits.data?.week_start && <p className="text-xs text-foreground/55">Hafta boshi: {fmtDate(limits.data.week_start)}</p>}
            </div>
          </div>
          {limits.data && (
            <span className="rounded-full bg-foreground px-3 py-1 font-mono text-[11px] font-bold uppercase" style={{ color: LIME }}>
              {limits.data.tier}
            </span>
          )}
        </div>

        {limits.loading ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-32 !rounded-2xl" />)}</div>
        ) : limits.error ? (
          <p className="mt-4 text-sm text-foreground/60">Limitlarni yuklab bo‘lmadi.</p>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {limits.data?.ai && (() => {
              const ai = limits.data.ai
              const used = toNum(ai.used_this_month) ?? 0
              const monthly = ai.monthly_limit
              const showBar = ai.enabled && monthly !== null && monthly > 0
              return (
                <UsageCard
                  title="AI tekshiruv limiti"
                  hint={
                    <>
                      {limits.data.month_start && <p>Oy boshi: {fmtDate(limits.data.month_start)}</p>}
                      {(ai.purchased_remaining ?? 0) > 0 && (
                        <p className="mt-1 font-semibold text-emerald-700">Xarid qilingan Writing AI kreditlari: {ai.purchased_remaining} ta</p>
                      )}
                    </>
                  }
                  right={ai.enabled ? `${used} / ${monthly ?? '∞'}` : 'Faol emas'}
                  pct={showBar ? Math.min(100, Math.round((used / monthly!) * 100)) : null}
                  ariaLabel="AI tekshiruvlar: oylik foydalanish"
                  max={monthly ?? undefined}
                  now={showBar ? Math.min(monthly!, Math.max(0, used)) : undefined}
                  footer={
                    !ai.enabled
                      ? 'Bu tarifda AI tekshiruvi yoqilmagan.'
                      : monthly === null
                        ? 'Cheksiz'
                        : `${Math.max(0, toNum(ai.remaining) ?? ((toNum(monthly) ?? 0) - used))} ta qoldi`
                  }
                />
              )
            })()}

            {limits.data?.practice && (() => {
              const pr = limits.data.practice
              const showBar = pr.weekly_limit !== null && pr.weekly_limit > 0
              return (
                <UsageCard
                  title="Umumiy practice limiti"
                  hint="Reading, Listening, Writing va Speaking urinishlari umumiy kvotadan foydalanadi."
                  right={`${pr.used_this_week} / ${pr.weekly_limit ?? '∞'}`}
                  pct={showBar ? Math.min(100, Math.round((pr.used_this_week / pr.weekly_limit!) * 100)) : null}
                  ariaLabel="Practice: haftalik umumiy foydalanish"
                  max={pr.weekly_limit ?? undefined}
                  now={showBar ? Math.min(pr.weekly_limit!, Math.max(0, pr.used_this_week)) : undefined}
                  footer={
                    pr.weekly_limit === null
                      ? 'Haftalik cheklov yo‘q'
                      : `${pr.remaining ?? Math.max(0, pr.weekly_limit - pr.used_this_week)} ta haftalik urinish qoldi`
                  }
                  extra={
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10 pt-3 text-xs text-foreground/60">
                      <span>Oylik sarf: {pr.used_this_month} / {pr.monthly_limit ?? '∞'}</span>
                      <span>{pr.monthly_limit === null ? 'Oylik cheklov yo‘q' : `${pr.remaining_this_month ?? Math.max(0, pr.monthly_limit - pr.used_this_month)} ta qoldi`}</span>
                    </div>
                  }
                />
              )
            })()}
          </div>
        )}
      </section>

      {/* Tariflar */}
      <section id="plans" aria-labelledby="billing-plans" className="scroll-mt-20 space-y-4 sm:space-y-6">
        <SectionTitle id="billing-plans" title="Tariflar" />

        <div className="rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="promo" className="flex items-center gap-3 text-sm font-bold text-foreground">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: HEAD_TINT }}>
                <Ticket className="size-4" strokeWidth={1.9} />
              </span>
              Promo kodingiz bormi?
            </label>
            <div className="flex items-center gap-2 sm:ml-auto">
              <input
                id="promo"
                className="h-12 w-full min-w-0 rounded-full border border-border bg-white px-5 font-mono text-sm uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:w-52"
                placeholder="KODNI KIRITING"
                value={promo}
                onChange={(e) => {
                  setPromo(e.target.value.toUpperCase())
                  setPromoError(null)
                  if (appliedPromo && e.target.value.trim() !== appliedPromo.code) setAppliedPromo(null)
                }}
                autoCapitalize="characters"
                autoComplete="off"
              />
              <button type="button" onClick={handleApplyPromo} disabled={!promo.trim() || promoChecking} className={`${pillDark} shrink-0`}>
                {promoChecking ? 'Tekshirilmoqda…' : appliedPromo ? 'Qo‘llangan ✓' : 'Qo‘llash'}
              </button>
            </div>
          </div>
          {appliedPromo && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
              <span>✓ <strong>{appliedPromo.code}</strong> kodi tekshirildi.</span>
              <span className="font-semibold">Chegirma tanlangan mahsulot summasiga qarab hisoblanadi.</span>
            </div>
          )}
          {promoError && <div role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">✕ {promoError}</div>}
        </div>

        {plans.loading ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3" aria-busy="true">{[0, 1, 2].map(i => <Skeleton key={i} className="h-96" />)}</div>
        ) : plans.error ? (
          <ErrorRetry message={plans.error.message} onRetry={plans.reload} />
        ) : !plans.data?.length ? (
          <EmptyBox text="Hozircha faol tariflar yo‘q." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {plans.data.map((plan) => {
              const key = `buy-plan-${plan.id}`
              const includedSkills = plan.included_skills || (plan.tier === 'free' ? ['READING', 'LISTENING', 'WRITING'] : ['READING', 'LISTENING', 'WRITING', 'SPEAKING'])
              const hasSpeaking = includedSkills.includes('SPEAKING')
              const discountedPrice = Math.round(plan.price * (1 - (plan.discount_percent || 0) / 100))
              const promoDiscount = appliedPromo
                ? appliedPromo.discount_percent != null
                  ? Math.round(discountedPrice * appliedPromo.discount_percent / 100)
                  : Math.min(discountedPrice, appliedPromo.fixed_discount_amount ?? appliedPromo.discount_amount ?? 0)
                : 0
              const finalPlanPrice = Math.max(0, discountedPrice - promoDiscount)
              const isPro = plan.tier === 'pro'
              const isPlus = plan.tier === 'plus'
              const duration = plan.duration_days === 30 ? '1 oy' : plan.duration_days === 90 ? '3 oy' : plan.duration_days === 365 ? '1 yil' : `${plan.duration_days} kun`
              const skillName: Record<string, string> = { READING: 'Reading', LISTENING: 'Listening', WRITING: 'Writing', SPEAKING: 'Speaking' }

              return (
                <article key={plan.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="relative isolate flex min-h-28 items-start justify-between gap-3 overflow-hidden p-5 sm:p-6" style={{ background: HEAD_TINT }}>
                    <Circle color="rgba(228,247,10,0.35)" width={16} className="-right-10 -top-14 size-36" />
                    <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                      <Sparkles aria-hidden="true" className="size-6" strokeWidth={1.9} />
                    </span>
                    <div className="relative z-10 flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isPro ? 'bg-purple-100 text-purple-800' : isPlus ? 'bg-foreground text-white' : 'bg-white text-foreground/70'}`}>
                        {plan.tier}
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-foreground/70">{duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                    <div>
                      <h3 className="line-clamp-2 text-xl font-black leading-snug tracking-tight text-foreground">{plan.name}</h3>
                      {plan.description && <p className="mt-2 text-sm leading-5 text-foreground/60">{plan.description}</p>}

                      <ul className="mt-4 space-y-2.5 text-sm text-foreground">
                        {includedSkills.map((skill) => (
                          <li key={skill} className="flex items-start gap-2">
                            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            <span>{skillName[skill] || skill}</span>
                          </li>
                        ))}
                        <li className="flex items-start gap-2">
                          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <span>{plan.ai_enabled && plan.ai_limit > 0 ? `Writing AI tekshiruvi: ${plan.ai_limit} ta / oy` : 'Writing AI tekshiruvi kiritilmagan'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <span>{hasSpeaking ? 'Speaking mashqlari kiritilgan' : 'Speaking mashqlari bu tarifga kirmaydi'}</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="text-3xl font-black leading-none tracking-tighter text-foreground tabular-nums">{fmtMoney(finalPlanPrice)}</p>
                        {((plan.discount_percent ?? 0) > 0 || promoDiscount > 0) && <span className="text-sm text-foreground/50 line-through">{fmtMoney(plan.price)}</span>}
                      </div>
                      {promoDiscount > 0 && <p className="mt-1 text-xs font-semibold text-emerald-700">Promo chegirma: −{fmtMoney(promoDiscount)}</p>}
                      {(plan.discount_percent || 0) > 0 && <p className="mt-1 text-xs text-foreground/55">Tarif chegirmasi: {plan.discount_percent}%</p>}

                      <button
                        type="button"
                        onClick={() => void handleSubscribe(plan)}
                        disabled={busy !== null}
                        className={`group/btn mt-4 w-full !justify-between !pl-6 !pr-2 ${pillDark}`}
                      >
                        <span className="flex items-center gap-2">
                          {busy === key ? 'Buyurtma yaratilmoqda…' : <><CreditCard aria-hidden="true" className="size-4" /> Obunani sotib olish</>}
                        </span>
                        <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-enabled/btn:group-hover/btn:rotate-45 motion-reduce:transition-none">
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        </span>
                      </button>
                      <p className="mt-2 text-center text-[11px] leading-4 text-foreground/55">Chek yuborilgach, admin tasdig‘i bilan faollashadi.</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* To'lov rekvizitlari */}
      <section aria-labelledby="billing-payment" className="rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
            <CreditCard aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
          </span>
          <div>
            <h2 id="billing-payment" className="text-base font-extrabold text-foreground sm:text-lg">To‘lov rekvizitlari</h2>
            <p className="text-xs text-foreground/55">Obuna yoki testlar uchun to‘lovni quyidagi rekvizitlarga o‘tkazing va chekni yuklang</p>
          </div>
        </div>

        {paymentInfo.loading ? (
          <Skeleton className="mt-5 h-32 !rounded-2xl" />
        ) : !hasPaymentDetails ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{instructions}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 lg:grid-cols-5">
              <div className="relative isolate flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-foreground p-5 text-white lg:col-span-2">
                <Circle color="rgba(255,255,255,0.06)" width={16} className="-right-12 -top-12 size-40" />
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/65">Uzcard / Humo</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: LIME }}>{bankName}</span>
                </div>
                <p className="relative z-10 break-all font-mono text-xl font-bold tracking-wider">{cardNum || 'Karta raqami sozlanmagan'}</p>
                <p className="relative z-10 truncate text-xs text-white/75">{cardHolder || 'Karta egasi sozlanmagan'}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
                {bankName && <Detail label="Bank" value={bankName} />}
                {cardNum && <Detail label="Karta raqami" value={cardNum} sub={cardHolder} copy />}
                {accNum && <Detail label="Hisob raqam" value={accNum} copy />}
                {phoneNum && <Detail label="Click / Payme telefon" value={phoneNum} copy />}
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-foreground/[0.04] p-4 text-sm leading-5 text-foreground/65"><strong className="text-foreground">To‘lov ko‘rsatmasi:</strong> {instructions}</p>
          </>
        )}
      </section>

      {/* Alohida xizmatlar */}
      {extraProducts.length > 0 && (
        <section aria-labelledby="billing-products" className="space-y-4 sm:space-y-6">
          <SectionTitle id="billing-products" title="Alohida xizmatlar va testlar" desc="Writing AI qo‘shimcha tekshiruv kreditlari yoki alohida Full Exam mahsulotlari. Huquq to‘lov tasdiqlangandan keyin faollashadi." />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {extraProducts.map(product => (
              <article key={product.id} className="flex flex-col justify-between gap-5 rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-6">
                <div>
                  <h3 className="text-lg font-black leading-snug tracking-tight text-foreground">{product.title}</h3>
                  {product.description ? <p className="mt-2 text-sm leading-5 text-foreground/60">{product.description}</p> : null}
                  <span className="mt-3 inline-flex rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70">
                    {product.product_type === 'writing_ai_credits' ? `Writing AI · ${product.external_ref || '?'} ta tekshiruv` : product.product_type === 'teacher_review_credits' ? `Ustoz tekshiruvi · ${product.external_ref || '?'} ta` : 'Bir martalik test xaridi'}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-black leading-none tracking-tighter text-foreground tabular-nums">{product.price.toLocaleString('uz-UZ')} UZS</p>
                  <button type="button" disabled={!!busy} onClick={() => void handleBuyProduct(product)} className={`group/btn mt-4 w-full !justify-between !pl-6 !pr-2 ${pillDark}`}>
                    <span>{busy === `buy-product-${product.id}` ? 'Tayyorlanmoqda…' : 'Xarid qilish'}</span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-enabled/btn:group-hover/btn:rotate-45 motion-reduce:transition-none">
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Buyurtmalar */}
      <section aria-labelledby="billing-orders" className="space-y-3 sm:space-y-4">
        <SectionTitle id="billing-orders" title="Buyurtmalarim" desc="Chek yuborilgandan keyin admin tekshiradi." />
        {orders.loading ? (
          <Skeleton className="h-28" />
        ) : orders.error ? (
          <ErrorRetry message={orders.error.message} onRetry={orders.reload} />
        ) : !orders.data?.length ? (
          <EmptyBox text="Hali buyurtma yo‘q." />
        ) : (
          <ul className="space-y-3">
            {orders.data.map((o) => {
              const payable = canPay(o.status)
              const rejected = /reject/i.test(o.status)
              const meta = orderMeta(o.status)
              return (
                <li key={o.id} className="rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${meta.color}1F`, color: meta.color }}>
                      <meta.icon className="size-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-bold text-foreground">{o.product_title || 'Buyurtma'}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${orderTone(o.status)}`}>{orderLabel(o.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-foreground/55">{fmtDate(o.created_at)} · <span className="font-mono">#{String(o.id).slice(0, 8)}</span></p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black tabular-nums text-foreground">{fmtMoney(o.amount)}</p>
                      {!!o.discount_amount && <p className="text-xs font-semibold text-emerald-700">−{fmtMoney(o.discount_amount)}</p>}
                    </div>
                  </div>

                  {meta.showSteps && (
                    <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Buyurtma jarayoni">
                      {STEP_LABELS.map((label, i) => {
                        const isDone = i < meta.done
                        const isCurrent = i === meta.current
                        return (
                          <li key={label}>
                            <div className={`h-1.5 rounded-full ${isDone ? 'bg-foreground' : isCurrent ? '' : 'bg-foreground/10'}`} style={isCurrent ? { backgroundColor: meta.color } : undefined} />
                            <p className={`mt-1.5 text-[11px] ${isCurrent ? 'font-bold text-foreground' : isDone ? 'text-foreground/60' : 'text-foreground/40'}`}>{label}</p>
                          </li>
                        )
                      })}
                    </ol>
                  )}

                  {payable && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-foreground/10 pt-4 sm:flex-row sm:items-center">
                      <p className={`flex-1 text-sm ${rejected ? 'font-semibold text-red-700' : 'text-foreground/60'}`}>
                        {rejected ? 'Chek rad etildi. Yangi chek yuklang.' : 'To‘lovdan so‘ng chekni yuklang, buyurtma tekshiriladi.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openCheckout({ orderId: o.id, title: o.product_title || 'Buyurtma', amount: o.amount, status: o.status, productType: o.product_type })}
                        className={pillDark}
                      >
                        <UploadCloud aria-hidden="true" className="size-4" /> To‘lov va chek yuklash
                      </button>
                      <button type="button" className={pillDanger} disabled={busy === `c-${o.id}`} onClick={() => void cancelOrder(o.id)}>
                        {busy === `c-${o.id}` ? 'Bekor qilinmoqda…' : 'Bekor qilish'}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* To'lov va chek modali */}
      {checkoutModal && (
        <div role="dialog" aria-modal="true" aria-label="To‘lov va rekvizitlar" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: LIME }}>
                  <CreditCard aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-black tracking-tight text-foreground">To‘lov va rekvizitlar</h3>
                  <p className="truncate text-xs text-foreground/55">Buyurtma <span className="font-mono font-semibold">#{checkoutModal.orderId.slice(0, 8)}</span> · {checkoutModal.title}</p>
                </div>
              </div>
              <button type="button" aria-label="Yopish" onClick={() => setCheckoutModal(null)} className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 transition hover:bg-foreground/10 ${FOCUS}`}>
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.04] p-4">
                <span className="text-xs font-medium text-foreground/60">To‘lov summasi</span>
                <span className="text-2xl font-black tabular-nums tracking-tight text-foreground">{fmtMoney(checkoutModal.amount)}</span>
              </div>

              <div className="relative isolate space-y-4 overflow-hidden rounded-3xl bg-foreground p-5 text-white">
                <Circle color="rgba(255,255,255,0.06)" width={14} className="-right-10 -top-12 size-36" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/65">Uzcard / Humo</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: LIME }}>{bankName}</span>
                </div>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <p className="break-all font-mono text-xl font-bold tracking-wider sm:text-2xl">{cardNum || 'Karta raqami sozlanmagan'}</p>
                  {cardNum && <CopyButton text={cardNum.replace(/\s/g, '')} label="Karta raqami" />}
                </div>
                <div className="relative z-10 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/75">
                  <span className="truncate">{cardHolder || 'Karta egasi sozlanmagan'}</span>
                  {phoneNum && <span className="font-mono text-[11px] text-white/60">{phoneNum}</span>}
                </div>
              </div>

              <p className={`rounded-2xl p-3 text-xs leading-relaxed ${cardNum ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>
                <strong>{cardNum ? 'Eslatma:' : 'To‘lov hozircha mavjud emas:'}</strong> {instructions}
              </p>

              <div className="space-y-3 border-t border-foreground/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">To‘lov chekini yuklash</p>

                {modalSuccess ? (
                  <div className="space-y-2 rounded-2xl bg-emerald-50 p-5 text-center">
                    <CheckCircle2 aria-hidden="true" className="mx-auto size-8 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">Chek muvaffaqiyatli qabul qilindi!</p>
                    <p className="text-xs leading-5 text-emerald-700/80">
                      Chek tekshiruvga yuborildi. {checkoutModal.productType === 'writing_ai_credits' ? 'AI kreditlari' : checkoutModal.productType === 'teacher_review_credits' ? 'Ustoz tekshiruvi kreditlari' : checkoutModal.productType === 'full_exam' || checkoutModal.productType === 'mock_exam' ? 'Testga kirish huquqi' : 'Obuna'} administrator to‘lovni tasdiqlagandan keyin faollashadi. Holatni Buyurtmalarim bo‘limida kuzatishingiz mumkin.
                    </p>
                    <button type="button" onClick={() => setCheckoutModal(null)} className={`${pillDark} mt-2 !min-h-11`}>Tushundim, yopish</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-foreground/20 bg-foreground/[0.03] p-5 text-center transition hover:border-foreground/40">
                      <UploadCloud aria-hidden="true" className="mb-1 size-6 text-foreground/55" />
                      <span className="text-xs font-bold text-foreground">{modalReceiptFile ? modalReceiptFile.name : 'Chek faylini tanlang (JPG, PNG, PDF)'}</span>
                      <span className="mt-0.5 text-[10px] text-foreground/55">{modalReceiptFile ? `${(modalReceiptFile.size / 1024).toFixed(1)} KB` : 'Maksimal hajm: 8 MB'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) { setModalReceiptFile(f); setModalError(null) }
                        }}
                      />
                    </label>

                    {modalError && <div role="alert" className="rounded-2xl bg-red-50 p-3 text-xs font-medium text-red-700">✕ {modalError}</div>}

                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => setCheckoutModal(null)} className={pillLight}>Keyinroq</button>
                      <button type="button" disabled={!modalReceiptFile || modalUploading} onClick={handleUploadModalReceipt} className={pillDark}>
                        {modalUploading ? 'Yuklanmoqda…' : 'Chekni yuborish'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Obunani bekor qilish modali */}
      {cancelConfirmOpen && (
        <div role="dialog" aria-modal="true" aria-label="Faol obunani bekor qilish" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Ban aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">Faol obunani bekor qilish</h3>
                <p className="mt-1 text-sm leading-5 text-foreground/60">
                  Haqiqatan ham faol obunangizni bekor qilmoqchimisiz? Bekor qilingandan so‘ng hisobingiz darhol Free (bepul) rejimiga qaytadi va obunaning qolgan muddati to‘xtatiladi.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={cancellingSub} onClick={() => setCancelConfirmOpen(false)} className={pillLight}>Orqaga (qoldirish)</button>
              <button
                type="button"
                disabled={cancellingSub}
                onClick={handleCancelActiveSubscription}
                className={`inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 ${FOCUS}`}
              >
                {cancellingSub ? 'Bekor qilinmoqda…' : 'Ha, bekor qilish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
