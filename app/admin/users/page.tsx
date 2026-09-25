'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/client'
import type { AdminUser } from '@/lib/api/types'
import { Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers(query = '') {
    setLoading(true)
    setError('')
    try {
      // The API typings for AdminUser might just be JsonObject, so we use any for now
      const data = await adminApi.users({ search: query })
      setUsers(data as any[])
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadUsers(search)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Barcha ro'yxatdan o'tgan mijozlar va tizim xodimlarini boshqarish
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ism yoki telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border bg-transparent pl-9 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <ShieldAlert className="inline mr-2 size-5" />
          {error}
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Foydalanuvchi</th>
                  <th className="px-4 py-3 font-medium">Aloqa (Telefon)</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Holat</th>
                  <th className="px-4 py-3 font-medium">Ro'yxatdan o'tgan</th>
                  <th className="px-4 py-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="animate-pulse">Yuklanmoqda...</div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Foydalanuvchilar topilmadi.
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{user.full_name || 'Noma\'lum'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {user.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                          ${user.global_role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                          {user.global_role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-green-600 text-xs font-medium">
                            <CheckCircle className="mr-1 size-3" /> Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 text-xs font-medium">
                            <XCircle className="mr-1 size-3" /> Bloklangan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-primary hover:underline text-xs font-semibold">
                          Tahrirlash
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
