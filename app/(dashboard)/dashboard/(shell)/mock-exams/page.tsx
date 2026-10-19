'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, CheckCircle2, Clock3, Copy, CreditCard, FileText, GraduationCap, RefreshCw, UploadCloud } from 'lucide-react'
import { mockExamsApi } from '@/lib/api/modules/mock-exams'
import { billingApi } from '@/lib/api/modules/billing'
import { getErrorMessage } from '@/lib/api/client'
import { FOCUS, LIME } from '@/lib/brand'
import type { BillingOrder, PaymentDetails, MockExam } from '@/lib/api/types'

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'To‘lov kutilmoqda',
  under_review: 'Chek tekshirilmoqda',
  paid: 'To‘lov tasdiqlangan',
  rejected: 'Chek rad etilgan',
  cancelled: 'Bekor qilingan',
}

const STATUS_TONE: Record<string, string> = {
  pending_payment: 'bg-foreground/5 text-foreground/70',
  under_review: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-foreground/5 text-foreground/50',
}

const HEAD_TINT = 'rgba(228,247,10,0.22)'

const pillDark = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none ${FOCUS}`

function money(value: number) {
  return `${value.toLocaleString('uz-UZ')} UZS`
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

export default function MockExamsPage() {
  const [exams, setExams] = useState<MockExam[]>([])
  const [orders, setOrders] = useState<BillingOrder[]>([])
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [examRows, orderRows, paymentDetails] = await Promise.all([
        mockExamsApi.getAll(),
        billingApi.myOrders(0, 100),
        billingApi.paymentDetails(),
      ])
      setExams(examRows)
      setOrders(orderRows)
      setPayment(paymentDetails)
    } catch (e) {
      setError(getErrorMessage(e, 'Mock Exam ma’lumotlarini yuklab bo‘lmadi.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  const ordersByExam = useMemo(() => {
    const map = new Map<string, BillingOrder[]>()
    for (const order of orders) {
      if (order.product_type !== 'mock_exam' || !order.product_id) continue
      const list = map.get(order.product_id) ?? []
      list.push(order)
      map.set(order.product_id, list)
    }
    for (const list of map.values()) list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    return map
  }, [orders])

  const mockOrders = useMemo(() => orders.filter(order => order.product_type === 'mock_exam'), [orders])
  const purchasedCount = exams.filter(e => e.is_purchased).length

  async function buyExam(exam: MockExam) {
    setBusyId(exam.id)
    setError('')
    setNotice('')
    try {
      if (exam.is_purchased) {
        setNotice('Bu Mock Exam akkauntingizda allaqachon faollashtirilgan.')
      } else if (exam.price <= 0) {
        await mockExamsApi.buy(exam.id)
        setNotice('Bepul Mock Exam faollashtirildi.')
      } else {
        const current = ordersByExam.get(exam.id)?.find(order => ['pending_payment', 'under_review', 'rejected'].includes(order.status))
        if (current) {
          setNotice(current.status === 'under_review' ? 'To‘lov chekingiz tekshiruvda.' : 'Sizda ushbu imtihon uchun buyurtma mavjud. To‘lov bo‘limidan chek yuboring.')
        } else {
          const order = await billingApi.createOrder({ product_type: 'mock_exam', product_id: exam.id })
          setNotice(`Buyurtma yaratildi (${order.id.slice(0, 8)}). Quyidagi buyurtma orqali to‘lov chekini yuboring.`)
        }
      }
      await reload()
    } catch (e) {
      setError(getErrorMessage(e, 'Mock Exam xaridini yaratib bo‘lmadi.'))
    } finally {
      setBusyId(null)
    }
  }

  async function uploadReceipt(orderId: string) {
    const file = files[orderId]
    if (!file) {
      setError('Avval to‘lov chekini tanlang.')
      return
    }
    setUploadingId(orderId)
    setError('')
    setNotice('')
    try {
      await billingApi.uploadReceipt(orderId, file)
      setFiles(previous => ({ ...previous, [orderId]: undefined }))
      setNotice('Chek yuborildi. Admin tekshiruvidan keyin xarid huquqi faollashadi.')
      await reload()
    } catch (e) {
      setError(getErrorMessage(e, 'Chekni yuborib bo‘lmadi.'))
    } finally {
      setUploadingId(null)
    }
  }

  const hasPaymentDetails = Boolean(payment?.card_number || payment?.bank_name || payment?.account_number || payment?.phone_number)

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {/* Hero + statistika */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 text-foreground sm:p-8 lg:col-span-3 lg:min-h-72 lg:p-10" style={{ background: LIME }}>
          <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <GraduationCap aria-hidden="true" className="size-3.5" /> To‘liq imtihon
            </span>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tighter sm:text-6xl">Mock Exam</h1>
            <p className="mt-3 max-w-lg text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
              To‘liq imtihonni tanlang. Pullik imtihonlarda buyurtma yaratiladi, chek yuboriladi va admin tasdiqlagandan keyin kirish huquqi faollashadi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className={`group relative z-10 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none min-[420px]:w-fit min-[420px]:justify-start ${FOCUS}`}
          >
            Yangilash
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground">
              <RefreshCw aria-hidden="true" className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            </span>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10 flex h-full flex-col gap-5">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Sizning imtihonlaringiz</h2>
              <p className="mt-0.5 text-xs text-white/55">Katalog va xaridlar</p>
            </div>
            <dl className="grid flex-1 gap-3 sm:grid-rows-2">
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground" style={{ background: LIME }}>
                  <GraduationCap aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <dt className="min-w-0 flex-1 text-sm font-medium text-white/70">Mavjud imtihonlar</dt>
                <dd className="text-5xl font-black leading-none tabular-nums sm:text-6xl" style={{ color: LIME }}>
                  {loading && !exams.length ? '—' : exams.length}
                </dd>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-foreground">
                  <CheckCircle2 aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <dt className="min-w-0 flex-1 text-sm font-medium text-white/70">Xarid qilingan</dt>
                <dd className="text-5xl font-black leading-none tabular-nums text-white sm:text-6xl">
                  {loading && !exams.length ? '—' : purchasedCount}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{notice}</div>}

      {/* Imtihonlar katalogi */}
      <section aria-labelledby="mock-catalog" className="space-y-4 sm:space-y-6">
        <h2 id="mock-catalog" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">Imtihonlar katalogi</h2>

        {loading && exams.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map(x => <div key={x} className="h-72 animate-pulse rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-foreground/20 bg-white px-5 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl" style={{ background: HEAD_TINT }}>
              <GraduationCap aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-foreground">Hozircha faol Mock Exam yo‘q</p>
            <p className="mt-1 text-sm text-foreground/60">Admin imtihon katalogiga yangi imtihon qo‘shgandan keyin shu yerda ko‘rinadi.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {exams.map(exam => {
              const latestOrder = ordersByExam.get(exam.id)?.[0]
              const pending = latestOrder && ['pending_payment', 'rejected'].includes(latestOrder.status)
              const underReview = latestOrder?.status === 'under_review'
              return (
                <article key={exam.id} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="relative isolate flex min-h-28 items-start justify-between gap-3 overflow-hidden p-5 sm:p-6" style={{ background: HEAD_TINT }}>
                    <Circle color="rgba(228,247,10,0.35)" width={16} className="-right-10 -top-14 size-36" />
                    <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                      <GraduationCap aria-hidden="true" className="size-6" strokeWidth={1.9} />
                    </span>
                    <div className="relative z-10">
                      {exam.is_purchased ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 aria-hidden="true" className="size-3.5" /> Xarid qilingan</span>
                      ) : underReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"><Clock3 aria-hidden="true" className="size-3.5" /> Tekshiruvda</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                    <div>
                      <h3 className="line-clamp-2 text-xl font-black leading-snug tracking-tight text-foreground">{exam.title}</h3>
                      {exam.description && <p className="mt-2 line-clamp-3 text-sm leading-5 text-foreground/60">{exam.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70">{exam.cefr_level}</span>
                        {exam.duration_minutes ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70"><Clock3 aria-hidden="true" className="size-3.5" />{exam.duration_minutes} daqiqa</span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-3xl font-black leading-none tracking-tighter text-foreground tabular-nums">{exam.price > 0 ? money(exam.price) : 'Bepul'}</p>
                      <button
                        type="button"
                        disabled={!!busyId || !!exam.is_purchased || underReview}
                        onClick={() => void buyExam(exam)}
                        className={`group/btn mt-4 w-full !justify-between !pl-6 !pr-2 ${pillDark}`}
                      >
                        <span className="flex items-center gap-2">
                          {busyId === exam.id ? 'Tayyorlanmoqda…' : exam.is_purchased ? 'Faollashtirilgan' : underReview ? 'Chek tekshiruvda' : pending ? 'Buyurtmani ko‘rish' : <><CreditCard aria-hidden="true" className="size-4" /> {exam.price > 0 ? 'Xarid qilish' : 'Bepul olish'}</>}
                        </span>
                        <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-enabled/btn:group-hover/btn:rotate-45 motion-reduce:transition-none">
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* To'lov rekvizitlari */}
      <section aria-labelledby="mock-payment" className="rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
            <CreditCard aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
          </span>
          <h2 id="mock-payment" className="text-base font-extrabold text-foreground sm:text-lg">To‘lov rekvizitlari</h2>
        </div>
        {!hasPaymentDetails ? (
          <p className="mt-4 text-sm text-foreground/60">{payment?.instructions || 'To‘lov rekvizitlari hali sozlanmagan. Admin bilan bog‘laning.'}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {payment?.bank_name && <Detail label="Bank" value={payment.bank_name} />}
              {payment?.card_number && <Detail label="Karta raqami" value={payment.card_number} sub={payment.card_holder} copy />}
              {payment?.account_number && <Detail label="Hisob raqam" value={payment.account_number} copy />}
              {payment?.phone_number && <Detail label="Telefon" value={payment.phone_number} copy />}
            </div>
            {payment?.instructions && <p className="mt-4 text-sm leading-5 text-foreground/60">{payment.instructions}</p>}
          </>
        )}
      </section>

      {/* Buyurtmalar */}
      <section aria-labelledby="mock-orders" className="space-y-3 sm:space-y-4">
        <div>
          <h2 id="mock-orders" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">Mock Exam buyurtmalari</h2>
          <p className="mt-1 text-sm text-foreground/60">Chek yuborilgandan keyin admin tekshiradi. Tasdiqlanmaguncha pullik imtihonga kirish ochilmaydi.</p>
        </div>

        {mockOrders.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-foreground/20 bg-white p-6 text-center text-sm text-foreground/60">Mock Exam uchun buyurtma yo‘q.</p>
        ) : (
          <ul className="space-y-3">
            {mockOrders.map(order => {
              const canUpload = ['pending_payment', 'rejected'].includes(order.status)
              return (
                <li key={order.id} className="rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{order.product_title}</p>
                      <p className="mt-1 text-xs text-foreground/55">Buyurtma #{order.id.slice(0, 8)} · {money(order.amount)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[order.status] ?? 'bg-foreground/5 text-foreground/70'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  {canUpload && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="flex-1 text-xs font-semibold text-foreground/70">
                        <span className="mb-1.5 block">To‘lov cheki (JPG, PNG, WEBP yoki PDF; 8 MB gacha)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={e => setFiles(previous => ({ ...previous, [order.id]: e.target.files?.[0] }))}
                          className="block w-full rounded-2xl border border-border bg-white px-3 py-2.5 text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white"
                        />
                      </label>
                      <button type="button" disabled={!files[order.id] || uploadingId === order.id} onClick={() => void uploadReceipt(order.id)} className={pillDark}>
                        <UploadCloud aria-hidden="true" className="size-4" /> {uploadingId === order.id ? 'Yuborilmoqda…' : 'Chekni yuborish'}
                      </button>
                    </div>
                  )}

                  {order.status === 'paid' && <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 aria-hidden="true" className="size-4" /> Xarid tasdiqlangan; imtihon huquqi yangilanadi.</p>}
                  {order.status === 'rejected' && order.admin_note && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">Admin izohi: {order.admin_note}</p>}
                  {order.status === 'pending_payment' && <p className="mt-3 inline-flex items-center gap-2 text-xs text-foreground/55"><FileText aria-hidden="true" className="size-3.5" /> To‘lovni amalga oshirib, chek faylini yuboring.</p>}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}