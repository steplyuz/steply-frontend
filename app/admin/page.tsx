'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, FileText, CheckCircle2, PenLine, Mic2, CreditCard, RefreshCw, GraduationCap, ClipboardList, BadgeCheck, Banknote, Clock3, Activity
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { adminApi } from '@/lib/api'
import type { AdminDashboard as DashboardStats } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

const STAT_CARD_STYLES = 'rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 shadow-xs transition-all hover:border-foreground/30'
const STAT_NUM_STYLES = 'text-2xl font-bold tracking-tight text-foreground font-mono'
const STAT_LABEL_STYLES = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'

// --- Sub-components --------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  loading = false,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  loading?: boolean
}) {
  return (
    <div className={STAT_CARD_STYLES}>
      <div className="flex items-center justify-between">
        <span className={STAT_LABEL_STYLES}>{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className={STAT_NUM_STYLES}>{value}</p>
      )}
    </div>
  )
}

function QuickLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string
  label: string
  icon: React.ElementType
  badge?: number | string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-foreground transition hover:border-foreground hover:bg-muted/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-[15px] text-muted-foreground" strokeWidth={1.8} />
        </span>
        {label}
      </div>
      {badge !== undefined && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {badge}
        </span>
      )}
    </Link>
  )
}

// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const isSuper = user?.global_role === 'super_admin'

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.dashboard()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard statistikasini yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="container-shell mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuper ? 'Super Admin — Practice platformasi boshqaruvi' : 'Admin — Practice platformasi boshqaruvi'}
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Statistikani yuklashda xatolik: {error}</span>
          <button onClick={loadStats} disabled={loading} className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold disabled:opacity-50">Qayta urinish</button>
        </div>
      )}

      {/* Live platform overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Foydalanuvchilar" value={stats ? stats.users : '—'} icon={Users} loading={loading} />
        <StatCard label="Faol foydalanuvchilar" value={stats ? stats.active_users : '—'} icon={Activity} loading={loading} />
        <StatCard label="Teacherlar" value={stats ? (stats.teachers ?? 0) : '—'} icon={GraduationCap} loading={loading} />
        <StatCard label="Mock testlar" value={stats ? (stats.mock_exams ?? 0) : '—'} icon={FileText} loading={loading} />
        <StatCard label="Imtihon urinishlari" value={stats ? (stats.attempts ?? 0) : '—'} icon={ClipboardList} loading={loading} />
        <StatCard label="Yakuniy natijalar" value={stats ? (stats.final_results ?? 0) : '—'} icon={BadgeCheck} loading={loading} />
        <StatCard label="Tasdiqlangan to‘lovlar" value={stats ? (stats.paid_orders ?? 0) : '—'} icon={CreditCard} loading={loading} />
        <StatCard label="Kutilayotgan to‘lovlar" value={stats ? (stats.pending_orders ?? 0) : '—'} icon={Clock3} loading={loading} />
        <StatCard label="Tasdiqlangan tushum" value={stats ? `${(stats.confirmed_revenue ?? 0).toLocaleString('uz-UZ')} UZS` : '—'} icon={Banknote} loading={loading} />
        <StatCard label="Tekshirilishi kerak OMR" value={stats ? (stats.omr_pending ?? 0) : '—'} icon={CheckCircle2} loading={loading} />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Tezkor Boshqaruv
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <QuickLink href="/admin/users" label="Foydalanuvchilar va teacherlar" icon={Users} />
          <QuickLink href="/admin/billing" label="Obunalar va test savdosi" icon={CreditCard} badge={stats?.pending_orders ? stats.pending_orders : undefined} />
          <QuickLink href="/admin/reading" label="Reading testlar" icon={FileText} />
          <QuickLink href="/admin/listening" label="Listening testlar" icon={FileText} />
          <QuickLink href="/admin/writing" label="Writing testlar" icon={PenLine} />
          <QuickLink href="/admin/speaking/questions" label="Speaking testlar" icon={Mic2} />
          <QuickLink href="/admin/speaking/assessments" label="Speaking baholash" icon={CheckCircle2} />
        </div>
      </div>

    </div>
  )
}