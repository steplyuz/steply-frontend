/**
 * app/admin/applications/page.tsx
 * ================================
 * Barcha sessiya ro'yxatlari — qidiruv, filtr va Excel eksport.
 *
 * Tuzatildi:
 *  - Export: <a href> o'rniga authenticatedDownload() (401 hal qilindi)
 *  - Davomat tasdiqlash to'g'ridan-to'g'ri shu sahifadan
 *  - Filtr: holat + ism/ID bo'yicha qidiruv
 */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Download, Search, ShieldAlert } from 'lucide-react'
import { adminApi, mockCenterApi, mockExamsApi } from '@/lib/api'
import { authenticatedDownload } from '@/lib/api/download'
import type { AdminStatistics, SessionRegistration } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { ApiRequestError } from '@/lib/api/client'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlangan',
  ATTENDED: 'Qatnashdi', CANCELLED: 'Bekor qilingan',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  ATTENDED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

export default function AdminApplicationsPage() {
  const { user, isLoading } = useAuth()
  const [stats, setStats]       = useState<AdminStatistics | null>(null)
  const [all, setAll]           = useState<SessionRegistration[] | null>(null)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('All')
  const [error, setError]       = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirming, setConfirming] = useState<Record<number, boolean>>({})

  const isAdmin = user?.global_role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    adminApi.statistics().then(setStats).catch(() => {})
    loadAll()
  }, [isAdmin])

  async function loadAll() {
    try {
      const sessions = await mockExamsApi.adminSessions()
      const result: SessionRegistration[] = []
      await Promise.all(
        sessions.map(async s => {
          try {
            const r = await mockExamsApi.sessionRegistrations(s.id)
            result.push(...r)
          } catch {}
        })
      )
      setAll(result)
    } catch {
      setAll([])
    }
  }

  async function handleExport() {
    setExporting(true); setError(null)
    await authenticatedDownload(adminApi.exportUsersUrl(), {
      filename: 'users_export.xlsx',
      onError: setError,
    })
    setExporting(false)
  }

  async function handleConfirm(regId: number) {
    if (!confirm('Bu talabaning kelganini tasdiqlaysizmi?')) return
    setConfirming(c => ({ ...c, [regId]: true }))
    try {
      await mockCenterApi.checkIn(
        all?.find(r => r.id === regId)?.student_id ?? '',
        all?.find(r => r.id === regId)?.session_id,
      )
      setAll(prev =>
        prev?.map(r =>
          r.id === regId
            ? { ...r, status: 'ATTENDED', attended_confirmed_at: new Date().toISOString() }
            : r
        ) ?? null
      )
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Tasdiqlashda xatolik')
    } finally {
      setConfirming(c => ({ ...c, [regId]: false }))
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  )
  if (!isAdmin) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="font-semibold">Bu bo'limga faqat administratorlar kira oladi.</p>
      <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">Kabinetga qaytish</Link>
    </div>
  )

  // ── Filtr ───────────────────────────────────────────────────────────────────
  const filtered = (all ?? []).filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || r.full_name.toLowerCase().includes(q)
      || String(r.student_id ?? '').toLowerCase().includes(q)
    const matchStatus = status === 'All' || r.status === status
    return matchSearch && matchStatus
  })

  const attendedCount = all?.filter(r => r.status === 'ATTENDED').length ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container-shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <span className="font-semibold">Admin · Ro'yxatlar</span>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Download className="size-4" />
            {exporting ? 'Yuklanmoqda...' : 'Excel eksport'}
          </button>
        </div>
      </header>

      <main className="container-shell py-10 space-y-8">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* Statistika */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Jami foydalanuvchilar',    value: stats?.total_users },
            { label: 'Topshirilgan imtihonlar',  value: stats?.total_exams_taken },
            { label: 'Bugungi yangi',             value: stats?.users_today },
            { label: 'Sessiyaga keldi',           value: attendedCount },
          ].map(s => (
            <div key={s.label} className="surface p-5">
              <p className="text-2xl font-bold">{s.value ?? '—'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Qidiruv va filtr */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Sessiya ro'yxatlari</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ism yoki ID..."
                className="w-56 rounded-lg border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="All">Barcha holat</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jadval */}
        <div className="overflow-hidden rounded-xl border bg-card">
          {all === null ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {all.length === 0 ? 'Hozircha ro\'yxatdan o\'tganlar yo\'q.' : 'Qidiruv natijasi topilmadi.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {['F.I.Sh.','Talaba ID','Yosh','Jins','Viloyat','Holat','Ro\'yxat sanasi','Amal'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">{r.full_name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.student_id ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.age}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.gender === 'male' ? 'Erkak' : 'Ayol'}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{r.region?.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('uz-UZ') : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {r.status !== 'ATTENDED' && r.status !== 'CANCELLED' ? (
                          <button
                            onClick={() => handleConfirm(r.id)}
                            disabled={!!confirming[r.id]}
                            className="flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <Check className="size-3" />
                            {confirming[r.id] ? '...' : 'Keldi'}
                          </button>
                        ) : r.status === 'ATTENDED' ? (
                          <span className="text-xs text-emerald-600 font-medium">✓ Keldi</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Jami: {all?.length ?? 0} ta ro'yxat · Ko'rsatilmoqda: {filtered.length} ta
        </p>
      </main>
    </div>
  )
}
