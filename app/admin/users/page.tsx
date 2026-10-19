'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, UserCog, X, Loader2, CheckCircle2, XCircle, ShieldCheck, Shield } from 'lucide-react'
import { adminApi } from '@/lib/api'

type GlobalRole = 'admin' | 'super_admin' | 'teacher' | 'student'

const ROLE_LABELS: Record<GlobalRole, string> = {
  admin:          'Admin',
  super_admin:    'Super Admin',
  teacher:          'Teacher',
  student:        'Student',
}

const ROLE_COLORS: Record<GlobalRole, string> = {
  admin:          'bg-amber-50 text-amber-700 border-amber-200',
  super_admin:    'bg-violet-50 text-violet-700 border-violet-200',
  teacher: 'bg-purple-50 text-purple-700 border-purple-200',
  student:        'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// ─── Change Role Modal ────────────────────────────────────────────────────────

function ChangeRoleModal({
  user,
  onClose,
  onUpdated,
}: {
  user: any
  onClose: () => void
  onUpdated: (user: any) => void
}) {
  const [role, setRole] = useState<GlobalRole>(user.global_role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true); setError(null)
      const updated = await adminApi.updateUser(user.id, { global_role: role })
      onUpdated(updated)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Rolni o\'zgartirishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const SELECTABLE_ROLES: GlobalRole[] = ['student', 'teacher', 'admin']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Rolni o'zgartirish</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.full_name ?? user.id?.slice(0, 8)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="space-y-2">
            {SELECTABLE_ROLES.map(r => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  role === r ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ROLE_COLORS[r]}`}>
                  {ROLE_LABELS[r]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r === 'teacher' && '→ Teacher vakolatlari'}
                  {r === 'admin'          && '→ Admin panelga kiradi'}
                  {r === 'super_admin'   && '→ Yuqori darajadagi administrator'}
                  {r === 'student'        && '→ Oddiy foydalanuvchi'}
                </span>
                {role === r && <CheckCircle2 className="ml-auto size-4 shrink-0 text-primary" />}
              </label>
            ))}
          </div>

          {role === 'teacher' && (
            <div className="flex items-start gap-2 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-xs text-purple-800">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-purple-500" />
              <p>Bu foydalanuvchiga backenddagi teacher roli beriladi. Faqat teacher uchun ruxsat etilgan amallar ochiladi.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={saving || role === user.global_role}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editUser, setEditUser] = useState<any | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await adminApi.users({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        limit: 100,
      })
      setUsers(data)
    } catch {
      setError("Foydalanuvchilarni yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => { void load() }, [load])

  const handleRoleUpdated = (updated: any) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
  }

  const handleToggleActive = async (user: any) => {
    const action = user.is_active ? 'bloklash' : 'faollashtirish'
    if (!confirm(`Bu foydalanuvchini ${action}ni tasdiqlaysizmi?`)) return
    try {
      const updated = await adminApi.updateUser(user.id, { is_active: !user.is_active })
      handleRoleUpdated(updated)
    } catch {
      alert('Xatolik yuz berdi')
    }
  }

  const ROLES = ['all', 'student', 'teacher', 'admin', 'super_admin']

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {editUser && (
        <ChangeRoleModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={u => { handleRoleUpdated(u); setEditUser(null) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length} ta foydalanuvchi</p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Role Filter */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === r
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {r === 'all' ? 'Barchasi' : ROLE_LABELS[r as GlobalRole] ?? r}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Foydalanuvchilar topilmadi</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ism</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Username</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Global Rol</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Holat</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sana</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {u.full_name ?? '—'}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{u.id?.slice(0, 8)}…</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {u.username ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      ROLE_COLORS[u.global_role as GlobalRole] ?? 'bg-muted text-foreground/80 border-border'
                    }`}>
                      {ROLE_LABELS[u.global_role as GlobalRole] ?? u.global_role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`size-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.is_active ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Change role */}
                      <button
                        onClick={() => setEditUser(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Rolni o'zgartirish"
                      >
                        <UserCog className="size-3.5" /> Rol
                      </button>
                      {/* Block / unblock */}
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          u.is_active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={u.is_active ? 'Bloklash' : 'Faollashtirish'}
                      >
                        {u.is_active
                          ? <><XCircle className="size-3.5" /> Blok</>
                          : <><CheckCircle2 className="size-3.5" /> Faol</>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2">
        <h3 className="text-sm font-bold text-foreground">Organization vakolatlari</h3>
        <p className="text-sm text-muted-foreground">Organization a'zoligi global rol emas. Tashkilotga biriktirish va org_admin/org_member vakolatlarini tashkilot boshqaruvi bo'limidan sozlang. Bu ro'yxatda faqat backend qo'llab-quvvatlaydigan global rollar ko'rsatiladi.</p>
      </div>
    </div>
  )
}