'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Tag,
  X,
  XCircle,
  AlertCircle,
  Edit2,
  Check,
  Percent,
  Calendar,
  Lock,
  CreditCard,
  Building2,
  Phone,
  HelpCircle,
  Package,
} from 'lucide-react'

import { billingApi } from '@/lib/api/modules/billing'
import { authenticatedDownload } from '@/lib/api/download'
import { getErrorMessage } from '@/lib/api/client'
import type {
  BillingOrder,
  BillingPlan,
  BillingPlanInput,
  BillingProduct,
  BillingProductInput,
  PaymentDetails,
  PromoCode,
  PromoCodeInput,
  SubscriptionTier,
  TierLimitRule,
} from '@/lib/api/types'

import {
  AdminButton,
  AdminEmpty,
  AdminError,
  AdminPageShell,
  AdminSearch,
  AdminTable,
  AdminTableSkeleton,
} from '@/components/layout/admin-page-shell'

/* ── Order Status Meta ────────────────────────────────────── */
const ORDER_STATUS_LABEL: Record<string, string> = {
  under_review: 'Tekshiruvda',
  pending_payment: 'To‘lov kutilmoqda',
  paid: 'Tasdiqlangan',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
  cancelled: 'Bekor qilingan',
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  under_review: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

const ORDER_STATUS_ICON: Record<string, React.ElementType> = {
  under_review: Clock,
  pending_payment: Clock,
  paid: CheckCircle,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: XCircle,
}

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  subscription: 'Obuna tarifi',
  speaking_practice: 'Speaking amaliyot',
  full_exam: 'Bitta test xaridi',
  writing_ai_credits: 'Writing AI kreditlari',
  mock_exam: 'Mock imtihon',
  full_skills: 'Barcha ko‘nikmalar',
}

function fmtDate(dt?: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtMoney(amount?: number | null) {
  if (amount === undefined || amount === null) return '—'
  return amount.toLocaleString('uz-UZ') + ' UZS'
}

function normalizeTierLimits(data: Record<string, { practice?: { weekly_limit: number | null; monthly_limit: number | null }; analysis?: { weekly_limit: number | null; monthly_limit: number | null } }> | null | undefined): TierLimitRule[] {
  return Object.entries(data ?? {}).map(([tier, value]) => ({
    tier: tier.toLowerCase() as SubscriptionTier,
    practice: {
      weekly_limit: value.practice?.weekly_limit ?? null,
      monthly_limit: value.practice?.monthly_limit ?? null,
    },
    analysis: {
      weekly_limit: value.analysis?.weekly_limit ?? null,
      monthly_limit: value.analysis?.monthly_limit ?? null,
    },
  }))
}

type TabKey = 'plans' | 'products' | 'orders' | 'reports' | 'promos' | 'limits' | 'requisites'

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('plans')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Data states
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [products, setProducts] = useState<BillingProduct[]>([])
  const [orders, setOrders] = useState<BillingOrder[]>([])
  const [reportSummary, setReportSummary] = useState<{total_orders:number;paid_orders:number;confirmed_revenue:number;paid_original_amount:number;paid_discount_amount:number;by_status:Record<string,{count:number;amount:number}>} | null>(null)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [tierLimits, setTierLimits] = useState<TierLimitRule[]>([])
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    card_number: '',
    card_holder: '',
    bank_name: '',
    account_number: '',
    phone_number: '',
    instructions: "To'lov rekvizitlari hali sozlanmagan. Tasdiqlangan ma'lumotlarni kiriting.",
  })

  // Orders filters
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')

  // Modal states: Plan
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null)
  const [planForm, setPlanForm] = useState<BillingPlanInput>({
    name: '',
    description: '',
    price: 150000,
    duration_days: 30,
    tier: 'pro',
    ai_limit: 20,
    included_skills: ['READING', 'LISTENING', 'WRITING'],
    ai_enabled: true,
    discount_percent: 0,
    is_active: true,
  })

  const [planSubmitting, setPlanSubmitting] = useState(false)

  // Admin o'zi uchun ham obuna buyurtmasi yaratishi mumkin; to'lovni boshqa admin tasdiqlaydi.
  const [selfPurchaseOrder, setSelfPurchaseOrder] = useState<BillingOrder | null>(null)
  const [selfPurchasePlan, setSelfPurchasePlan] = useState<BillingPlan | null>(null)
  const [selfPurchaseReceipt, setSelfPurchaseReceipt] = useState<File | null>(null)
  const [selfPurchaseSubmitting, setSelfPurchaseSubmitting] = useState(false)
  const [selfPurchaseUploading, setSelfPurchaseUploading] = useState(false)

  // Billing products: backend faqat FULL_EXAM va WRITING_AI_CREDITS katalogini qabul qiladi.
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<BillingProduct | null>(null)
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productForm, setProductForm] = useState<BillingProductInput>({
    product_type: 'writing_ai_credits',
    code: '',
    title: '',
    description: '',
    price: 15000,
    external_ref: '10',
    is_active: true,
  })

  // Promo modal
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [promoDiscountType, setPromoDiscountType] = useState<'percent' | 'amount'>('percent')
  const [promoForm, setPromoForm] = useState<{
    code: string
    discount_val: number
    max_usage: string
    valid_from: string
    valid_until: string
    is_active: boolean
  }>({
    code: '',
    discount_val: 20,
    max_usage: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  })
  const [promoSubmitting, setPromoSubmitting] = useState(false)

  // Order action modal
  const [orderReviewModal, setOrderReviewModal] = useState<{
    orderId: string
    action: 'approve' | 'reject'
  } | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Limit edit modal (Tab 4)
  const [editingLimit, setEditingLimit] = useState<{
    tier: SubscriptionTier
    kind: 'practice' | 'analysis'
    currentLimit: number | null
    currentMonthlyLimit: number | null
  } | null>(null)
  const [limitValue, setLimitValue] = useState<string>('')
  const [monthlyLimitValue, setMonthlyLimitValue] = useState<string>('')
  const [limitSubmitting, setLimitSubmitting] = useState(false)

  // Requisites form state
  const [requisitesForm, setRequisitesForm] = useState<PaymentDetails>(paymentDetails)
  const [requisitesSaving, setRequisitesSaving] = useState(false)

  // Load all data
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [plansData, productsData, ordersData, promosData, limitsData, paymentData, reportData] = await Promise.all([
        billingApi.adminPlans().catch(() => []),
        billingApi.adminProducts().catch(() => []),
        billingApi.adminOrders(undefined, 0, 100).catch(() => []),
        billingApi.adminPromoCodes().catch(() => []),
        billingApi.tierLimits().catch(() => ({})),
        billingApi.paymentDetails().catch(() => null),
        billingApi.reportSummary().catch(() => null),
      ])
      setPlans(Array.isArray(plansData) ? plansData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setPromos(Array.isArray(promosData) ? promosData : [])
      setTierLimits(normalizeTierLimits(limitsData))
      setReportSummary(reportData)
      if (paymentData) {
        setPaymentDetails(paymentData)
        setRequisitesForm(paymentData)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto clear message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  /* ──────────────────────────────────────────────────────────────
     PLAN ACTIONS
  ────────────────────────────────────────────────────────────── */
  const PLAN_PRESETS = [
    {
      label: 'PLUS (1 oylik)',
      name: 'Steply PLUS',
      description: 'Reading, Listening va Writing practice hamda Writing AI tekshiruvlari',
      tier: 'plus' as SubscriptionTier,
      duration_days: 30,
      price: 150000,
      ai_limit: 20,
    },
    {
      label: 'PRO (1 oylik)',
      name: 'Steply PRO',
      description: 'Barcha practice ko‘nikmalari, jumladan Speaking',
      tier: 'pro' as SubscriptionTier,
      duration_days: 30,
      price: 300000,
      ai_limit: 30,
    },
    {
      label: 'PLUS (3 oylik)',
      name: 'Steply PLUS (90 kun)',
      description: '3 oylik PLUS obunasi',
      tier: 'plus' as SubscriptionTier,
      duration_days: 90,
      price: 380000,
      ai_limit: 60,
    },
    {
      label: 'PRO (1 yillik)',
      name: 'Steply PRO (1 yil)',
      description: 'Yillik PRO obunasi',
      tier: 'pro' as SubscriptionTier,
      duration_days: 365,
      price: 2400000,
      ai_limit: 200,
    },
  ]

  const applyPreset = (preset: typeof PLAN_PRESETS[number]) => {
    setPlanForm({
      name: preset.name,
      description: preset.description,
      tier: preset.tier,
      duration_days: preset.duration_days,
      price: preset.price,
      ai_limit: preset.ai_limit,
      included_skills: preset.tier === 'pro' ? ['READING', 'LISTENING', 'WRITING', 'SPEAKING'] : ['READING', 'LISTENING', 'WRITING'],
      ai_enabled: preset.ai_limit > 0,
      discount_percent: 0,
      is_active: true,
    })
  }

  const openCreatePlanModal = () => {
    setEditingPlan(null)
    const initialTier = 'pro'
    setPlanForm({
      name: '',
      description: '',
      price: 150000,
      duration_days: 30,
      tier: initialTier,
      ai_limit: 20,
      included_skills: ['READING', 'LISTENING', 'WRITING'],
      ai_enabled: true,
      discount_percent: 0,
      is_active: true,
    })
    setPlanModalOpen(true)
  }

  const openEditPlanModal = (p: BillingPlan) => {
    setEditingPlan(p)
    const tier = p.tier || 'pro'
    setPlanForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      duration_days: p.duration_days,
      tier: tier as SubscriptionTier,
      ai_limit: p.ai_limit,
      included_skills: p.included_skills || (p.tier === 'pro' ? ['READING', 'LISTENING', 'WRITING', 'SPEAKING'] : ['READING', 'LISTENING', 'WRITING']),
      ai_enabled: p.ai_enabled ?? p.ai_limit > 0,
      discount_percent: p.discount_percent ?? 0,
      is_active: p.is_active,
    })
    setPlanModalOpen(true)
  }

  const handleTierChange = (newTier: string) => {
    setPlanForm({ ...planForm, tier: newTier as SubscriptionTier })
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.name.trim()) {
      alert("Tarif nomini kiriting")
      return
    }
    if (planForm.price <= 0) {
      alert("Narx 0 dan katta bo'lishi kerak")
      return
    }
    if (planForm.duration_days <= 0) {
      alert("Muddati kamida 1 kun bo'lishi kerak")
      return
    }

    setPlanSubmitting(true)
    setError('')
    try {
      // 1. Save plan
      if (editingPlan) {
        await billingApi.updatePlan(editingPlan.id, planForm)
        setSuccessMsg(`"${planForm.name}" tarifi muvaffaqiyatli yangilandi!`)
      } else {
        await billingApi.createPlan(planForm)
        setSuccessMsg(`"${planForm.name}" tarifi muvaffaqiyatli yaratildi!`)
      }

      // Practice va Analysis kvotalari tarifdan mustaqil, tier bo‘yicha boshqariladi.
      // Shu sabab tarifni saqlash alohida kvotalarni tasodifan qayta yozmaydi.
      setPlanModalOpen(false)
      const [updatedPlans, updatedLimits] = await Promise.all([
        billingApi.adminPlans(),
        billingApi.tierLimits(),
      ])
      setPlans(updatedPlans)
      setTierLimits(normalizeTierLimits(updatedLimits))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPlanSubmitting(false)
    }
  }

  const handleSelfPurchase = async (plan: BillingPlan) => {
    setError('')
    setSelfPurchaseSubmitting(true)
    try {
      const order = await billingApi.createOrder({
        product_type: 'subscription',
        product_id: String(plan.id),
      })
      setSelfPurchasePlan(plan)
      setSelfPurchaseOrder(order)
      setSelfPurchaseReceipt(null)
      const updatedOrders = await billingApi.adminOrders(undefined, 0, 100).catch(() => null)
      if (updatedOrders) setOrders(updatedOrders)
      setSuccessMsg(`“${plan.name}” obunasi uchun buyurtma yaratildi. Chekni yuboring; boshqa admin tasdiqlagach obuna faollashadi.`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSelfPurchaseSubmitting(false)
    }
  }

  const handleSelfPurchaseReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selfPurchaseOrder || !selfPurchaseReceipt) {
      setError('To‘lov chekini tanlang.')
      return
    }
    setSelfPurchaseUploading(true)
    setError('')
    try {
      await billingApi.uploadReceipt(selfPurchaseOrder.id, selfPurchaseReceipt)
      const updatedOrders = await billingApi.adminOrders(undefined, 0, 100).catch(() => null)
      if (updatedOrders) setOrders(updatedOrders)
      setSuccessMsg('Chek yuborildi. Xavfsizlik uchun o‘z buyurtmangizni boshqa admin tasdiqlashi kerak.')
      setSelfPurchaseOrder((prev) => prev ? { ...prev, status: 'under_review' } : prev)
      setSelfPurchaseReceipt(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSelfPurchaseUploading(false)
    }
  }

  const openCreateProductModal = () => {
    setEditingProduct(null)
    setProductForm({
      product_type: 'writing_ai_credits',
      code: '',
      title: '',
      description: '',
      price: 15000,
      external_ref: '10',
      is_active: true,
    })
    setProductModalOpen(true)
  }

  const openEditProductModal = (product: BillingProduct) => {
    setEditingProduct(product)
    setProductForm({
      product_type: product.product_type,
      code: product.code || '',
      title: product.title,
      description: product.description || '',
      price: product.price,
      external_ref: product.external_ref || '',
      is_active: product.is_active,
    })
    setError('')
    setProductModalOpen(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const externalRef = String(productForm.external_ref ?? '').trim()
    if (!productForm.code.trim() || !productForm.title.trim() || !Number.isFinite(productForm.price) || productForm.price <= 0) {
      setError('Mahsulot kodi, nomi va musbat narxi majburiy.')
      return
    }
    if (!externalRef) {
      setError(productForm.product_type === 'full_exam' ? 'Full Exam uchun Mock Exam ID majburiy.' : 'Writing AI kreditlari sonini kiriting.')
      return
    }
    if (productForm.product_type === 'writing_ai_credits' && (!/^\d+$/.test(externalRef) || Number(externalRef) < 1 || Number(externalRef) > 10000)) {
      setError('Writing AI kreditlari 1–10000 oralig‘idagi butun son bo‘lishi kerak.')
      return
    }
    setProductSubmitting(true)
    try {
      const input = {
        code: productForm.code.trim().toUpperCase(),
        title: productForm.title.trim(),
        description: productForm.description?.trim() || null,
        price: productForm.price,
        external_ref: externalRef,
        is_active: productForm.is_active ?? true,
      }
      if (editingProduct) {
        const updated = await billingApi.updateProduct(editingProduct.id, input)
        setProducts(previous => previous.map(product => product.id === updated.id ? updated : product))
        setSuccessMsg(`“${updated.title}” mahsuloti yangilandi.`)
      } else {
        const created = await billingApi.createProduct({ ...input, product_type: productForm.product_type })
        setProducts(previous => [created, ...previous])
        setSuccessMsg(`“${created.title}” mahsuloti yaratildi.`)
      }
      setProductModalOpen(false)
      setEditingProduct(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleTogglePlanActive = async (p: BillingPlan) => {
    try {
      await billingApi.updatePlan(p.id, { is_active: !p.is_active })
      setPlans(prev => prev.map(x => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)))
      setSuccessMsg(`Tarif holati o'zgartirildi`)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  /* ──────────────────────────────────────────────────────────────
     ORDER ACTIONS
  ────────────────────────────────────────────────────────────── */
  const handleOpenReview = (orderId: string, action: 'approve' | 'reject') => {
    setOrderReviewModal({ orderId, action })
    setReviewNote('')
  }

  const handleConfirmOrderReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderReviewModal) return
    const { orderId, action } = orderReviewModal
    setReviewSubmitting(true)
    setError('')
    try {
      if (action === 'approve') {
        await billingApi.approveOrder(orderId, reviewNote.trim() || undefined)
        setSuccessMsg(`Buyurtma #${orderId.slice(0, 8)} tasdiqlandi!`)
      } else {
        await billingApi.rejectOrder(orderId, reviewNote.trim() || undefined)
        setSuccessMsg(`Buyurtma #${orderId.slice(0, 8)} rad etildi!`)
      }
      setOrderReviewModal(null)
      const updatedOrders = await billingApi.adminOrders(undefined, 0, 100)
      setOrders(updatedOrders)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDownloadReceipt = async (orderId: string) => {
    const url = billingApi.adminOrderReceiptUrl(orderId)
    await authenticatedDownload(url, {
      filename: `receipt-${orderId.slice(0, 8)}.png`,
      onError: (msg) => setError(msg),
    })
  }

  /* ──────────────────────────────────────────────────────────────
     PROMO ACTIONS
  ────────────────────────────────────────────────────────────── */
  const openCreatePromoModal = () => {
    setEditingPromo(null)
    setPromoDiscountType('percent')
    setPromoForm({
      code: '',
      discount_val: 20,
      max_usage: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    })
    setPromoModalOpen(true)
  }

  const openEditPromoModal = (p: PromoCode) => {
    setEditingPromo(p)
    if (p.discount_percent !== null && p.discount_percent !== undefined) {
      setPromoDiscountType('percent')
      setPromoForm({
        code: p.code,
        discount_val: p.discount_percent,
        max_usage: p.max_usage !== null && p.max_usage !== undefined ? String(p.max_usage) : '',
        valid_from: p.valid_from ? p.valid_from.slice(0, 16) : '',
        valid_until: p.valid_until ? p.valid_until.slice(0, 16) : '',
        is_active: p.is_active,
      })
    } else {
      setPromoDiscountType('amount')
      setPromoForm({
        code: p.code,
        discount_val: p.discount_amount || 0,
        max_usage: p.max_usage !== null && p.max_usage !== undefined ? String(p.max_usage) : '',
        valid_from: p.valid_from ? p.valid_from.slice(0, 16) : '',
        valid_until: p.valid_until ? p.valid_until.slice(0, 16) : '',
        is_active: p.is_active,
      })
    }
    setPromoModalOpen(true)
  }

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoForm.code.trim()) {
      alert("Promo kod nomini kiriting")
      return
    }
    if (promoForm.discount_val <= 0) {
      alert("Chegirma miqdori 0 dan katta bo'lishi kerak")
      return
    }

    const payload: PromoCodeInput = {
      code: promoForm.code.trim().toUpperCase(),
      discount_percent: promoDiscountType === 'percent' ? promoForm.discount_val : null,
      discount_amount: promoDiscountType === 'amount' ? promoForm.discount_val : null,
      max_usage: promoForm.max_usage ? Number(promoForm.max_usage) : null,
      valid_from: promoForm.valid_from ? new Date(promoForm.valid_from).toISOString() : null,
      valid_until: promoForm.valid_until ? new Date(promoForm.valid_until).toISOString() : null,
      is_active: promoForm.is_active,
    }

    setPromoSubmitting(true)
    setError('')
    try {
      if (editingPromo) {
        await billingApi.updatePromoCode(editingPromo.id, payload)
        setSuccessMsg(`Promo kod "${payload.code}" yangilandi!`)
      } else {
        await billingApi.createPromoCode(payload)
        setSuccessMsg(`Promo kod "${payload.code}" yaratildi!`)
      }
      setPromoModalOpen(false)
      const updated = await billingApi.adminPromoCodes()
      setPromos(updated)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPromoSubmitting(false)
    }
  }

  const handleTogglePromoActive = async (p: PromoCode) => {
    try {
      await billingApi.updatePromoCode(p.id, { is_active: !p.is_active })
      setPromos(prev => prev.map(x => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)))
      setSuccessMsg(`Promo kod holati o'zgartirildi`)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  /* ──────────────────────────────────────────────────────────────
     TIER LIMIT ACTIONS (TAB 4)
  ────────────────────────────────────────────────────────────── */
  const openEditLimit = (tier: SubscriptionTier, kind: 'practice' | 'analysis', currentLimit: number | null, currentMonthlyLimit: number | null) => {
    setEditingLimit({ tier, kind, currentLimit, currentMonthlyLimit })
    setLimitValue(currentLimit !== null ? String(currentLimit) : '')
    setMonthlyLimitValue(currentMonthlyLimit !== null ? String(currentMonthlyLimit) : '')
  }

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLimit) return
    setLimitSubmitting(true)
    setError('')
    try {
      const val = limitValue.trim() === '' ? null : Number(limitValue)
      const monthlyVal = monthlyLimitValue.trim() === '' ? null : Number(monthlyLimitValue)
      if ((val !== null && (!Number.isInteger(val) || val < 0)) || (monthlyVal !== null && (!Number.isInteger(monthlyVal) || monthlyVal < 0))) {
        setError('Limit 0 yoki undan katta butun son bo‘lishi kerak.')
        return
      }
      const input = { tier: editingLimit.tier, weekly_limit: val, monthly_limit: monthlyVal }
      if (editingLimit.kind === 'practice') await billingApi.setPracticeLimit(input)
      else await billingApi.setAnalysisLimit(input)
      setSuccessMsg(`${editingLimit.tier.toUpperCase()} - ${editingLimit.kind === 'practice' ? 'umumiy practice' : 'Analysis'} limiti yangilandi.`)
      setEditingLimit(null)
      const updated = await billingApi.tierLimits()
      setTierLimits(normalizeTierLimits(updated))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLimitSubmitting(false)
    }
  }

  /* ──────────────────────────────────────────────────────────────
     REQUISITES ACTIONS (TAB 5)
  ────────────────────────────────────────────────────────────── */
  const handleSaveRequisites = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequisitesSaving(true)
    setError('')
    try {
      const saved = await billingApi.updatePaymentDetails(requisitesForm)
      setPaymentDetails(saved)
      setSuccessMsg("To'lov rekvizitlari muvaffaqiyatli saqlandi!")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRequisitesSaving(false)
    }
  }

  /* ──────────────────────────────────────────────────────────────
     ORDERS FILTERING
  ────────────────────────────────────────────────────────────── */
  const underReviewCount = orders.filter(o => o.status === 'under_review').length
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== 'ALL') {
      if (orderStatusFilter === 'under_review' && o.status !== 'under_review') return false
      if (orderStatusFilter === 'pending_payment' && o.status !== 'pending_payment') return false
      if (orderStatusFilter === 'paid' && o.status !== 'paid' && o.status !== 'approved') return false
      if (orderStatusFilter === 'rejected' && o.status !== 'rejected') return false
      if (orderStatusFilter === 'cancelled' && o.status !== 'cancelled') return false
    }
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase()
      const matchId = o.id?.toLowerCase().includes(q)
      const matchUser = o.user_id?.toLowerCase().includes(q)
      const matchTitle = o.product_title?.toLowerCase().includes(q)
      if (!matchId && !matchUser && !matchTitle) return false
    }
    return true
  })

  return (
    <AdminPageShell
      eyebrow="Moliya boshqaruvi"
      title="Obunalar va Billing"
      description="Tariflar, billing mahsulotlari, to‘lov buyurtmalari, promo kodlar, umumiy limitlar va to‘lov rekvizitlarini boshqarish"
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'plans' && (
            <AdminButton variant="primary" onClick={openCreatePlanModal}>
              <Plus className="size-4" /> Yangi tarif qo'shish
            </AdminButton>
          )}
          {activeTab === 'promos' && (
            <AdminButton variant="primary" onClick={openCreatePromoModal}>
              <Plus className="size-4" /> Yangi promo kod
            </AdminButton>
          )}
          {activeTab === 'products' && (
            <AdminButton variant="primary" onClick={openCreateProductModal}>
              <Plus className="size-4" /> Mahsulot yaratish
            </AdminButton>
          )}
          <AdminButton variant="default" onClick={loadData} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Yangilash
          </AdminButton>
        </div>
      }
    >
      {/* ── Xabarlar ────────────────────────────────────────── */}
      {error && <AdminError message={error} />}
      {successMsg && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* ── Asosiy Tablar ───────────────────────────────────── */}
      <div className="mb-7 flex items-center gap-2 overflow-x-auto border-b border-border pb-4 [scrollbar-width:thin]">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'plans'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="size-4" /> Tariflar ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'products'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Package className="size-4" /> Mahsulotlar ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Receipt className="size-4" /> Buyurtmalar ({orders.length})
          {underReviewCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">
              {underReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'reports' ? 'bg-foreground text-background shadow-xs' : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
          <Download className="size-4" /> Hisobotlar
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'promos'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Tag className="size-4" /> Promo kodlar ({promos.length})
        </button>

        <button
          onClick={() => setActiveTab('limits')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'limits'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Sliders className="size-4" /> Tier Limitlari (Kvotalar)
        </button>

        <button
          onClick={() => setActiveTab('requisites')}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'requisites'
              ? 'bg-foreground text-background shadow-xs'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CreditCard className="size-4" /> To'lov rekvizitlari
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
         TAB 1: TARIFLAR (PLANS)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Obuna tariflari</h2>
              <p className="text-xs text-muted-foreground">Foydalanuvchilar uchun PLUS va PRO obuna tariflari</p>
            </div>
            <AdminButton variant="default" size="sm" onClick={openCreatePlanModal}>
              <Plus className="size-3.5" /> Tarif yaratish
            </AdminButton>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-2xl border border-border bg-card p-6 animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <AdminEmpty
              icon={Layers}
              title="Tariflar mavjud emas"
              description="Hozircha tizimda hech qanday tarif yaratilmagan. Yangi tarif qo'shing."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map(p => {
                const isPro = p.tier === 'pro'
                const isPlus = p.tier === 'plus'
                const includedSkills = p.included_skills || (p.tier === 'pro' ? ['READING', 'LISTENING', 'WRITING', 'SPEAKING'] : ['READING', 'LISTENING', 'WRITING'])
                const salePrice = Math.round(p.price * (1 - (p.discount_percent || 0) / 100))
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 bg-card shadow-xs hover:border-foreground/40 ${
                      p.is_active ? 'border-border' : 'border-dashed border-border opacity-60'
                    }`}
                  >
                    <div>
                      {/* Tier Badge & Status */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            isPro
                              ? 'bg-purple-500/15 text-purple-700 border border-purple-500/30 dark:text-purple-400'
                              : isPlus
                              ? 'bg-foreground/15 text-foreground border border-foreground/30 dark:text-foreground/60'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Sparkles className="size-3" /> {p.tier}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {p.is_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                      {p.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                      )}

                      {/* Price */}
                      <div className="mt-4 pb-4 border-b border-border">
                        {(p.discount_percent || 0) > 0 && <span className="mr-2 text-sm text-muted-foreground line-through">{p.price.toLocaleString('uz-UZ')}</span>}
                        <span className="font-mono text-2xl font-black text-foreground">
                          {salePrice.toLocaleString('uz-UZ')}
                        </span>
                        {(p.discount_percent || 0) > 0 && <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-600">-{p.discount_percent}%</span>}
                        <span className="text-xs text-muted-foreground ml-1.5">UZS / {p.duration_days} kun</span>
                      </div>

                      {/* Features */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Amal qilish muddati:</span>
                          <strong className="text-foreground">{p.duration_days} kun</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">AI tekshiruvlar:</span>
                          <strong className="text-foreground">{p.ai_enabled && p.ai_limit > 0 ? `${p.ai_limit} ta/oy` : 'Yoqilmagan'}</strong>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-muted-foreground">Bo‘limlar:</span>
                          <strong className="text-right text-foreground">{includedSkills.map(skill => (({READING:'Reading',LISTENING:'Listening',WRITING:'Writing',SPEAKING:'Speaking'} as Record<string, string>)[skill] || skill)).join(', ')}</strong>
                        </div>

                        {(() => {
                          const rule = tierLimits.find(item => item.tier === p.tier)
                          const format = (value: number | null | undefined) => value == null ? 'Cheksiz' : `${value} ta / hafta`
                          return (
                            <div className="pt-2.5 mt-2.5 border-t border-border/70 space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Umumiy practice:</span>
                                <span className="font-semibold text-foreground">{format(rule?.practice.weekly_limit)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Analysis:</span>
                                <span className="font-semibold text-foreground">{format(rule?.analysis.weekly_limit)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                      {p.is_active && (
                        <button
                          type="button"
                          disabled={selfPurchaseSubmitting}
                          onClick={() => void handleSelfPurchase(p)}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-50 dark:text-emerald-400"
                        >
                          <CreditCard className="size-3.5" /> {selfPurchaseSubmitting ? 'Buyurtma...' : 'O‘zim uchun sotib olish'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePlanActive(p)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          p.is_active
                            ? 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                            : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        {p.is_active ? 'Faolsizlantirish' : 'Faollashtirish'}
                      </button>

                      <AdminButton
                        size="sm"
                        variant="default"
                        onClick={() => openEditPlanModal(p)}
                      >
                        <Edit2 className="size-3" /> Tahrirlash
                      </AdminButton>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 2: BUYURTMALAR (ORDERS)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Billing katalogi</h2>
            <p className="text-xs leading-5 text-muted-foreground">Faqat backend qo‘llaydigan mahsulot turlari ko‘rsatiladi: Full Exam va Writing AI kreditlari. Mock Exam katalogining o‘zi “Mock Exam” bo‘limida boshqariladi.</p>
          </div>
          {loading ? <div className="h-48 animate-pulse rounded-2xl border border-border bg-muted/30" /> : products.length === 0 ? (
            <AdminEmpty title="Mahsulot yo‘q" description="Writing AI kreditlari yoki Full Exam mahsulotini yarating." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Mahsulot</th><th className="px-4 py-3">Turi</th><th className="px-4 py-3">Narx</th><th className="px-4 py-3">Bog‘lanish</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Amal</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4"><p className="font-semibold">{product.title}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{product.code || `#${product.id}`}</p>{product.description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{product.description}</p>}</td>
                      <td className="px-4 py-4 text-xs">{product.product_type === 'writing_ai_credits' ? 'Writing AI kreditlari' : product.product_type === 'full_exam' ? 'Full Exam' : 'Eski mahsulot turi'}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-semibold">{fmtMoney(product.price)}</td>
                      <td className="px-4 py-4 font-mono text-xs">{product.external_ref || '—'}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${product.is_active ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{product.is_active ? 'Faol' : 'Nofaol'}</span></td>
                      <td className="px-4 py-4"><button type="button" disabled={!['full_exam', 'writing_ai_credits'].includes(product.product_type)} onClick={() => openEditProductModal(product)} aria-label={`${product.title} mahsulotini tahrirlash`} title={!['full_exam', 'writing_ai_credits'].includes(product.product_type) ? 'Eski mahsulot turi tahrirlanmaydi' : 'Tahrirlash'} className="rounded-lg border border-border p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><Edit2 className="size-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">To‘lovlar hisoboti</h2>
            <p className="text-xs text-muted-foreground">Hisob-kitob bazadagi barcha buyurtmalar bo‘yicha; tushumga faqat tasdiqlangan to‘lovlar kiradi.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Tasdiqlangan tushum', value: `${(reportSummary?.confirmed_revenue ?? 0).toLocaleString('uz-UZ')} UZS`, icon: CreditCard },
              { label: 'Tasdiqlangan to‘lovlar', value: String(reportSummary?.paid_orders ?? 0), icon: CheckCircle },
              { label: 'Chegirma summasi', value: `${(reportSummary?.paid_discount_amount ?? 0).toLocaleString('uz-UZ')} UZS`, icon: Percent },
              { label: 'Jami buyurtmalar', value: String(reportSummary?.total_orders ?? 0), icon: Receipt },
            ].map(item => <div key={item.label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{item.label}</span><item.icon className="size-4" /></div><p className="mt-3 text-xl font-bold text-foreground">{item.value}</p></div>)}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Holatlar bo‘yicha</h3>
            <div className="mt-3 divide-y divide-border">
              {Object.entries(reportSummary?.by_status ?? {}).map(([status, data]) => <div key={status} className="flex items-center justify-between py-3 text-sm"><span>{ORDER_STATUS_LABEL[status] || status}</span><span className="font-medium">{data.count} ta · {data.amount.toLocaleString('uz-UZ')} UZS</span></div>)}
              {!reportSummary && <p className="py-3 text-sm text-muted-foreground">Hisobot yuklanmadi. Yangilash tugmasini bosing.</p>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Eslatma: bu operatsion hisobot. Bank hisobvarag‘i bilan avtomatik solishtirish uchun to‘lov provayderi yoki bank integratsiyasi alohida talab etiladi.</p>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-5">
          {underReviewCount > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-800 dark:text-sky-300">
              <Clock className="size-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="text-sm font-semibold">{underReviewCount} ta to'lov cheki tekshiruv kutmoqda</p>
                <p className="text-xs text-sky-700/80 dark:text-sky-300/80">Chekni ko'rib chiqib, buyurtmani tasdiqlang yoki rad eting.</p>
              </div>
            </div>
          )}

          {/* Filtrlar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `Barchasi (${orders.length})` },
                { id: 'under_review', label: `Tekshiruvda (${underReviewCount})` },
                { id: 'pending_payment', label: `Kutilmoqda (${pendingCount})` },
                { id: 'paid', label: `Tasdiqlangan` },
                { id: 'rejected', label: `Rad etilgan` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`h-8 rounded-xl px-3 text-xs font-semibold transition-all ${
                    orderStatusFilter === f.id
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:max-w-xs">
              <AdminSearch
                value={orderSearch}
                onChange={setOrderSearch}
                placeholder="Buyurtma ID, user ID..."
              />
            </div>
          </div>

          {/* Jadval */}
          <AdminTable headers={['Buyurtma', 'Foydalanuvchi', 'Mahsulot', 'Summa', 'Chek', 'Holat', 'Sana', 'Amallar']}>
            {loading ? (
              <AdminTableSkeleton rows={6} cols={8} />
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-0">
                  <AdminEmpty
                    icon={Receipt}
                    title="Buyurtmalar topilmadi"
                    description="Qidiruv yoki filtr mezonlarini o'zgartirib ko'ring"
                  />
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const StatusIcon = ORDER_STATUS_ICON[order.status] || Clock
                const canReview = order.status === 'under_review' || order.status === 'pending_payment'
                const hasReceipt = !!order.receipt_file_path || order.status === 'under_review'

                return (
                  <tr key={order.id} className="transition-colors hover:bg-muted/40">
                    {/* Buyurtma ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* Foydalanuvchi */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.user_id.slice(0, 8)}…
                      </span>
                    </td>

                    {/* Mahsulot */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{order.product_title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {PRODUCT_TYPE_LABEL[order.product_type] || (order.product_type === 'full_exam' ? 'Bitta test xaridi' : order.product_type === 'mock_exam' ? 'Mock imtihon' : order.product_type)}
                        </span>
                      </div>
                    </td>

                    {/* Summa */}
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-foreground">
                      {fmtMoney(order.amount)}
                      {order.discount_amount > 0 && (
                        <span className="block text-[10px] font-normal text-emerald-600">
                          -{fmtMoney(order.discount_amount)} promo
                        </span>
                      )}
                    </td>

                    {/* Chek */}
                    <td className="px-5 py-4">
                      {hasReceipt ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Download className="size-3 text-primary" /> Chek
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Holat */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                          ORDER_STATUS_COLOR[order.status] || ORDER_STATUS_COLOR.cancelled
                        }`}
                      >
                        <StatusIcon className="size-3" />
                        {ORDER_STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>

                    {/* Sana */}
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {fmtDate(order.created_at)}
                    </td>

                    {/* Amallar */}
                    <td className="px-5 py-4 text-right">
                      {canReview ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(order.id, 'approve')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                          >
                            <Check className="size-3" /> Tasdiqlash
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(order.id, 'reject')}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/20 dark:text-red-400 transition-colors"
                          >
                            <X className="size-3" /> Rad etish
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </AdminTable>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 3: PROMO KODLAR (PROMO CODES)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'promos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Chegirma promo kodlari</h2>
              <p className="text-xs text-muted-foreground">Foydalanuvchilar tarif va to'lovlarda ishlatishi mumkin bo'lgan chegirma kodlari</p>
            </div>
            <AdminButton variant="default" size="sm" onClick={openCreatePromoModal}>
              <Plus className="size-3.5" /> Promo kod yaratish
            </AdminButton>
          </div>

          <AdminTable headers={['Kod', 'Chegirma', 'Foydalanish', 'Amal qilish muddati', 'Holat', 'Amallar']}>
            {loading ? (
              <AdminTableSkeleton rows={5} cols={6} />
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-0">
                  <AdminEmpty
                    icon={Tag}
                    title="Promo kodlar mavjud emas"
                    description="Yangi chegirma promo kodini yarating."
                  />
                </td>
              </tr>
            ) : (
              promos.map(p => {
                const isPercent = p.discount_percent !== null && p.discount_percent !== undefined
                const discountText = isPercent
                  ? `${p.discount_percent}%`
                  : fmtMoney(p.discount_amount)

                return (
                  <tr key={p.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold tracking-wider text-foreground bg-muted px-2 py-1 rounded-md">
                        {p.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                        {discountText}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <span className="font-semibold text-foreground">{p.used_count}</span>
                      <span className="text-muted-foreground"> / {p.max_usage ?? '∞'}</span>
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {p.valid_until ? (
                        <span>{fmtDate(p.valid_until)} gacha</span>
                      ) : (
                        <span>Muddatsiz</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePromoActive(p)}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium"
                        >
                          {p.is_active ? 'O‘chirish' : 'Yoqish'}
                        </button>
                        <AdminButton size="sm" variant="default" onClick={() => openEditPromoModal(p)}>
                          <Edit2 className="size-3" /> Tahrirlash
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </AdminTable>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 4: TIER LIMITLARI (12 QOIDA)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Umumiy Practice va Analysis limitlari</h2>
            <p className="text-xs leading-5 text-muted-foreground">
              Practice limiti Reading, Listening, Writing va Speaking urinishlari uchun umumiy. Analysis alohida kvota sifatida hisoblanadi. Bo‘sh limit cheksiz degani.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Tarif</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Practice / hafta · oy</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Analysis / hafta · oy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(['free', 'plus', 'pro'] as SubscriptionTier[]).map(tier => {
                  const rule = tierLimits.find(item => item.tier === tier)
                  const practice = rule?.practice ?? { weekly_limit: null, monthly_limit: null }
                  const analysis = rule?.analysis ?? { weekly_limit: null, monthly_limit: null }
                  const display = (value: number | null | undefined) => value == null ? '∞' : String(value)
                  return (
                    <tr key={tier} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-bold uppercase">{tier}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => openEditLimit(tier, 'practice', practice.weekly_limit, practice.monthly_limit)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-foreground">
                          {display(practice.weekly_limit)} / hafta · {display(practice.monthly_limit)} / oy <Edit2 className="size-3 text-muted-foreground" />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => openEditLimit(tier, 'analysis', analysis.weekly_limit, analysis.monthly_limit)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-foreground">
                          {display(analysis.weekly_limit)} / hafta · {display(analysis.monthly_limit)} / oy <Edit2 className="size-3 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 5: TO'LOV REKVIZITLARI (REQUISITES)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'requisites' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-foreground">To'lov rekvizitlari va yo'riqnoma</h2>
            <p className="text-xs text-muted-foreground">
              Ushbu ma'lumotlar talabalar obuna sotib olayotganda to'lov qilishlari uchun ko'rsatiladi.
            </p>
          </div>

          <form onSubmit={handleSaveRequisites} className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Karta raqami (Uzcard / Humo) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={requisitesForm.card_number}
                    onChange={e => setRequisitesForm({ ...requisitesForm, card_number: e.target.value })}
                    placeholder="8600 5304 1234 5678"
                    className="w-full font-mono rounded-xl border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Karta egasi (Ism / Kompaniya) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requisitesForm.card_holder}
                  onChange={e => setRequisitesForm({ ...requisitesForm, card_holder: e.target.value })}
                  placeholder="STEPLEY EDUCATION MCHJ"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Bank nomi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={requisitesForm.bank_name}
                    onChange={e => setRequisitesForm({ ...requisitesForm, bank_name: e.target.value })}
                    placeholder="ATIB Ipoteka Bank"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Bank hisob raqami (20 xonali, ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={requisitesForm.account_number || ''}
                  onChange={e => setRequisitesForm({ ...requisitesForm, account_number: e.target.value })}
                  placeholder="2020 8000 9001 2345 6001"
                  className="w-full font-mono rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Telefon raqam (Click / Payme / Qo'llab-quvvatlash uchun)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={requisitesForm.phone_number || ''}
                  onChange={e => setRequisitesForm({ ...requisitesForm, phone_number: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full font-mono rounded-xl border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                To'lov yo'riqnomasi va eslatma
              </label>
              <textarea
                rows={3}
                value={requisitesForm.instructions || ''}
                onChange={e => setRequisitesForm({ ...requisitesForm, instructions: e.target.value })}
                placeholder="To'lovni amalga oshirgach, chekni tizimga yuklang..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <AdminButton type="submit" variant="primary" disabled={requisitesSaving}>
                {requisitesSaving ? 'Saqlanmoqda...' : 'Rekvizitlarni saqlash'}
              </AdminButton>
            </div>
          </form>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         MODAL: TARIF YARATISH / TAHRIRLASH
      ────────────────────────────────────────────────────────── */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingPlan ? 'Tarifni tahrirlash' : 'Yangi tarif yaratish'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tarif parametrlari va unga biriktirilgan ko'nikmalar limitlarini sozlang
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="mt-5 space-y-4">
              {/* Tezkor Shablonlar */}
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Tezkor shablon tanlang (avtomatik to‘ldirish):
                  </p>
                  <span className="text-[10px] text-muted-foreground">Tavsiya etiladi</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLAN_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-lg border border-border bg-card p-2 text-left hover:border-primary hover:bg-muted/50 transition-all text-xs group"
                    >
                      <div className="font-bold text-foreground text-[11px] truncate group-hover:text-primary">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {preset.price.toLocaleString('uz-UZ')} UZS
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asosiy ma'lumotlar */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tarif nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Masalan: Steply PRO 1 oy, Steply PRO 1 yil"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tavsifi (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={planForm.description || ''}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Tarif haqida qisqacha ma'lumot..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Daraja (Tier) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={planForm.tier}
                    onChange={e => handleTierChange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  >
                    <option value="plus">PLUS</option>
                    <option value="pro">PRO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Muddati (kunlarda) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    required
                    value={planForm.duration_days}
                    onChange={e => setPlanForm({ ...planForm, duration_days: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Narxi (UZS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    AI tekshiruv limiti (insholar uchun)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.ai_limit ?? 0}
                    disabled={!planForm.ai_enabled}
                    onChange={e => setPlanForm({ ...planForm, ai_limit: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-foreground">AI tekshiruvi</p><p className="text-xs text-muted-foreground">Bu tarifda Writing AI ishlatilsinmi?</p></div>
                  <input type="checkbox" checked={!!planForm.ai_enabled} onChange={e => setPlanForm({ ...planForm, ai_enabled: e.target.checked, ai_limit: e.target.checked ? Math.max(1, planForm.ai_limit || 20) : 0 })} className="size-4" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">Tarifga kiritilgan bo‘limlar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([['READING','Reading'],['LISTENING','Listening'],['WRITING','Writing'],['SPEAKING','Speaking']] as const).map(([skill, label]) => (
                      <label key={skill} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
                        <input type="checkbox" checked={(planForm.included_skills || []).includes(skill)} onChange={e => {
                          const current = planForm.included_skills || []
                          const next = e.target.checked ? [...current, skill] : current.filter(x => x !== skill)
                          setPlanForm({ ...planForm, included_skills: next })
                        }} className="size-4" /> {label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Speaking faqat tarifda yoqilgan bo‘lsa ochiladi. Kamida bitta bo‘lim tanlanishi kerak.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Tarif chegirmasi (%)</label>
                  <input type="number" min={0} max={100} value={planForm.discount_percent ?? 0} onChange={e => setPlanForm({ ...planForm, discount_percent: Math.min(100, Math.max(0, Number(e.target.value))) })} className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm" />
                  <p className="mt-1 text-xs text-muted-foreground">Joriy chegirmali narx: {Math.round(planForm.price * (1 - (planForm.discount_percent || 0) / 100)).toLocaleString('uz-UZ')} UZS</p>
                </div>
              </div>

              <p className="rounded-xl border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
                Practice va Analysis kvotalari “Limitlar” bo‘limida alohida boshqariladi. AI tekshiruvi esa tarif bo‘yicha yoqiladi/o‘chiriladi va oylik limitga ega.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="plan_is_active"
                  checked={planForm.is_active}
                  onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="plan_is_active" className="text-sm font-medium text-foreground cursor-pointer">
                  Tarif sotuv uchun faol bo'lsin
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                <AdminButton variant="default" onClick={() => setPlanModalOpen(false)}>
                  Bekor qilish
                </AdminButton>
                <AdminButton type="submit" variant="primary" disabled={planSubmitting}>
                  {planSubmitting ? 'Saqlanmoqda...' : editingPlan ? 'Saqlash' : 'Tarifni yaratish'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         MODAL: BILLING MAHSULOTI YARATISH
      ────────────────────────────────────────────────────────── */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">{editingProduct ? 'Mahsulotni tahrirlash' : 'Billing mahsuloti yaratish'}</h3>
              <button type="button" onClick={() => { setProductModalOpen(false); setEditingProduct(null) }} aria-label="Yopish" className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Mahsulot turi</label>
                <select disabled={!!editingProduct} value={productForm.product_type} onChange={e => setProductForm(previous => ({ ...previous, product_type: e.target.value as BillingProductInput['product_type'], external_ref: e.target.value === 'writing_ai_credits' ? '10' : '' }))} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm disabled:opacity-60">
                  <option value="writing_ai_credits">Writing AI kreditlari</option>
                  <option value="full_exam">Full Exam (Mock Exam ID bilan)</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-semibold">Mahsulot kodi</label><input required maxLength={100} value={productForm.code} onChange={e => setProductForm(previous => ({ ...previous, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_.-]/g, '').replace(/^[^A-Z0-9]+/, '') }))} placeholder="WRITING_AI_10" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold">Narx (UZS)</label><input required type="number" min={1} max={100000000} value={productForm.price} onChange={e => setProductForm(previous => ({ ...previous, price: Number(e.target.value) }))} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-semibold">Nomi</label><input required maxLength={200} value={productForm.title} onChange={e => setProductForm(previous => ({ ...previous, title: e.target.value }))} placeholder="Writing AI — 10 kredit" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Tavsif (ixtiyoriy)</label><textarea maxLength={2000} value={productForm.description || ''} onChange={e => setProductForm(previous => ({ ...previous, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold">{productForm.product_type === 'writing_ai_credits' ? 'Kreditlar soni (external_ref)' : 'Mock Exam ID (external_ref)'}</label><input required maxLength={100} value={productForm.external_ref || ''} onChange={e => setProductForm(previous => ({ ...previous, external_ref: e.target.value.trim() }))} placeholder={productForm.product_type === 'writing_ai_credits' ? '10' : 'Mock Exam ID'} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm" /><p className="mt-1 text-[11px] text-muted-foreground">{productForm.product_type === 'writing_ai_credits' ? '1–10000 oralig‘idagi butun son kiriting.' : 'ID admin Mock Exam katalogidagi mavjud, faol imtihonga tegishli bo‘lishi kerak.'}</p></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productForm.is_active ?? true} onChange={e => setProductForm(previous => ({ ...previous, is_active: e.target.checked }))} className="size-4" /> Xarid uchun faol</label>
              <div className="flex justify-end gap-3 border-t border-border pt-4"><AdminButton variant="default" onClick={() => { setProductModalOpen(false); setEditingProduct(null) }}>Bekor qilish</AdminButton><AdminButton type="submit" variant="primary" disabled={productSubmitting}>{productSubmitting ? 'Saqlanmoqda…' : editingProduct ? 'O‘zgarishlarni saqlash' : 'Mahsulot yaratish'}</AdminButton></div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         MODAL: PROMO KOD YARATISH / TAHRIRLASH
      ────────────────────────────────────────────────────────── */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                {editingPromo ? 'Promo kodni tahrirlash' : 'Yangi promo kod yaratish'}
              </h3>
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handlePromoSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Promo kod <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="Masalan: SPRING2026"
                  className="w-full font-mono uppercase rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Chegirma turi <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="discount_type"
                      checked={promoDiscountType === 'percent'}
                      onChange={() => setPromoDiscountType('percent')}
                    />
                    <span>Foiz (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="discount_type"
                      checked={promoDiscountType === 'amount'}
                      onChange={() => setPromoDiscountType('amount')}
                    />
                    <span>Aniq summa (UZS)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Chegirma miqdori {promoDiscountType === 'percent' ? '(%)' : '(UZS)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={promoDiscountType === 'percent' ? 100 : 100000000}
                  required
                  value={promoForm.discount_val}
                  onChange={e => setPromoForm({ ...promoForm, discount_val: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Maksimal foydalanish soni (bo'sh qolsa cheksiz)
                </label>
                <input
                  type="number"
                  min={1}
                  value={promoForm.max_usage}
                  onChange={e => setPromoForm({ ...promoForm, max_usage: e.target.value })}
                  placeholder="Cheksiz"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Amal qilish muddati (gacha)
                </label>
                <input
                  type="datetime-local"
                  value={promoForm.valid_until}
                  onChange={e => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="promo_is_active"
                  checked={promoForm.is_active}
                  onChange={e => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="promo_is_active" className="text-sm font-medium text-foreground cursor-pointer">
                  Promo kod faol bo'lsin
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Oylik limit (soni)</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyLimitValue}
                  onChange={e => setMonthlyLimitValue(e.target.value)}
                  placeholder="Bo'sh qoldiring = cheksiz"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                <AdminButton variant="default" onClick={() => setPromoModalOpen(false)}>
                  Bekor qilish
                </AdminButton>
                <AdminButton type="submit" variant="primary" disabled={promoSubmitting}>
                  {promoSubmitting ? 'Saqlanmoqda...' : editingPromo ? 'Saqlash' : 'Promo kodni yaratish'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         MODAL: BUYURTMANI TASDIQLASH / RAD ETISH
      ────────────────────────────────────────────────────────── */}
      {orderReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                Buyurtmani {orderReviewModal.action === 'approve' ? 'tasdiqlash' : 'rad etish'}
              </h3>
              <button
                type="button"
                onClick={() => setOrderReviewModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrderReview} className="mt-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                Buyurtma: <strong className="text-foreground">#{orderReviewModal.orderId.slice(0, 8)}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Admin izohi {orderReviewModal.action === 'reject' && <span className="text-red-500">* (sabab)</span>}
                </label>
                <textarea
                  rows={3}
                  required={orderReviewModal.action === 'reject'}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder={
                    orderReviewModal.action === 'approve'
                      ? "To'lov qabul qilindi (ixtiyoriy izoh)..."
                      : "Chek summasi mos kelmadi / soxta chek..."
                  }
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Oylik limit (soni)</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyLimitValue}
                  onChange={e => setMonthlyLimitValue(e.target.value)}
                  placeholder="Bo'sh qoldiring = cheksiz"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                <AdminButton variant="default" onClick={() => setOrderReviewModal(null)}>
                  Bekor qilish
                </AdminButton>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                    orderReviewModal.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewSubmitting ? 'Bajarilmoqda...' : orderReviewModal.action === 'approve' ? 'Tasdiqlash' : 'Rad etish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin o'z obunasini sotib olish: tasdiqlashni boshqa admin bajaradi. */}
      {selfPurchaseOrder && selfPurchasePlan && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/55 p-3 sm:p-5" onClick={() => setSelfPurchaseOrder(null)}>
          <section className="my-auto max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shaxsiy obuna buyurtmasi</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{selfPurchasePlan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Buyurtma: <span className="break-all font-mono">{selfPurchaseOrder.id}</span></p>
              </div>
              <button type="button" aria-label="Modalni yopish" onClick={() => setSelfPurchaseOrder(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">To'lanadigan summa</span>
                <strong className="text-xl font-black text-foreground">{fmtMoney(selfPurchaseOrder.amount)}</strong>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Pul o'tkazmasidan so'ng chekni yuklang. Admin o'z buyurtmasini o'zi tasdiqlay olmaydi, shuning uchun boshqa admin tekshirishi kerak.</p>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-border p-4 text-sm">
              <p><span className="text-muted-foreground">Bank:</span> <strong>{paymentDetails.bank_name || 'Sozlanmagan'}</strong></p>
              <p><span className="text-muted-foreground">Karta:</span> <strong className="break-all">{paymentDetails.card_number || 'Sozlanmagan'}</strong></p>
              <p><span className="text-muted-foreground">Karta egasi:</span> <strong>{paymentDetails.card_holder || 'Sozlanmagan'}</strong></p>
              {paymentDetails.account_number && <p><span className="text-muted-foreground">Hisob raqami:</span> <strong className="break-all">{paymentDetails.account_number}</strong></p>}
              {paymentDetails.phone_number && <p><span className="text-muted-foreground">Telefon:</span> <strong>{paymentDetails.phone_number}</strong></p>}
              {paymentDetails.instructions && <p className="border-t border-border pt-2 text-xs leading-5 text-muted-foreground">{paymentDetails.instructions}</p>}
            </div>

            {selfPurchaseOrder.status === 'under_review' || selfPurchaseOrder.status === 'paid' ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
                {selfPurchaseOrder.status === 'paid' ? 'To‘lov tasdiqlangan.' : 'Chek tekshiruvda. Obuna boshqa admin tasdiqlagach faollashadi.'}
              </div>
            ) : (
              <form onSubmit={handleSelfPurchaseReceipt} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-foreground" htmlFor="self-purchase-receipt">To'lov cheki (JPG, PNG yoki PDF)</label>
                <input id="self-purchase-receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setSelfPurchaseReceipt(e.target.files?.[0] ?? null)} className="field file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs" />
                <button type="submit" disabled={!selfPurchaseReceipt || selfPurchaseUploading || selfPurchaseOrder.status === 'cancelled'} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50">
                  {selfPurchaseUploading ? <RefreshCw className="size-4 animate-spin" /> : <Receipt className="size-4" />}
                  {selfPurchaseUploading ? 'Chek yuborilmoqda...' : 'Chekni yuborish'}
                </button>
              </form>
            )}
            <button type="button" onClick={() => setSelfPurchaseOrder(null)} className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Yopish</button>
          </section>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         MODAL: TIER LIMIT TAHRIRLASH (TAB 4)
      ────────────────────────────────────────────────────────── */}
      {editingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Limitni o'zgartirish
              </h3>
              <button
                type="button"
                onClick={() => setEditingLimit(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimit} className="mt-4 space-y-4">
              <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1">
                <p><strong>Tarif:</strong> <span className="uppercase">{editingLimit.tier}</span></p>
                <p><strong>Xizmat:</strong> <span>{editingLimit.kind === 'practice' ? 'Umumiy Practice (4 skill)' : 'Analysis'}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Haftalik limit (soni)
                </label>
                <input
                  type="number"
                  min={0}
                  value={limitValue}
                  onChange={e => setLimitValue(e.target.value)}
                  placeholder="Bo'sh qoldiring = Cheksiz (∞)"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Bo'sh qoldirsangiz, foydalanuvchiga cheklov qo'yilmaydi (cheksiz).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Oylik limit (soni)</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyLimitValue}
                  onChange={e => setMonthlyLimitValue(e.target.value)}
                  placeholder="Bo'sh qoldiring = cheksiz"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                <AdminButton variant="default" onClick={() => setEditingLimit(null)}>
                  Bekor qilish
                </AdminButton>
                <AdminButton type="submit" variant="primary" disabled={limitSubmitting}>
                  {limitSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}