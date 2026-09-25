'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { profileApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/client'
import type { Session } from '@/lib/api/types'
import { Save, Smartphone, Trash2, ShieldCheck, Mail } from 'lucide-react'

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Profile state
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || '')
      setBirthDate(user.profile.birth_date || '')
      setBio(user.profile.bio || '')
    }
    loadSessions()
  }, [user])

  async function loadSessions() {
    try {
      const data = await profileApi.sessions()
      setSessions(data)
    } catch (e) {
      console.error('Failed to load sessions', e)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await profileApi.update({
        full_name: fullName,
        birth_date: birthDate || undefined,
        bio: bio || undefined
      })
      await refresh()
      setSuccess('Profil muvaffaqiyatli yangilandi')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleRevokeSession(id: string) {
    if (!confirm('Haqiqatan ham bu qurilmadan chiqmoqchimisiz?')) return
    try {
      await profileApi.revokeSession(id)
      await loadSessions()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <main className="container-shell py-10 sm:py-14">
      <h1 className="text-2xl font-bold mb-8">Sozlamalar</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Shaxsiy Ma'lumotlar */}
        <div className="surface p-6">
          <h2 className="text-lg font-bold mb-4">Shaxsiy ma'lumotlar</h2>
          
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To'liq ism</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tug'ilgan sana</label>
              <input 
                type="date" 
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full rounded-md border p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full rounded-md border p-2 text-sm h-24"
                placeholder="O'zingiz haqingizda qisqacha..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Save className="size-4" />
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>

        {/* Kontaktlar va xavfsizlik */}
        <div className="space-y-8">
          <div className="surface p-6">
            <h2 className="text-lg font-bold mb-4">Kontaktlar</h2>
            <div className="space-y-3">
              {user?.contacts?.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    {contact.contact_type === 'PHONE' ? <Smartphone className="size-5 text-muted-foreground" /> : <Mail className="size-5 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{contact.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.is_primary ? 'Asosiy ' : ''}
                        {contact.is_verified ? <span className="text-green-600">Tasdiqlangan</span> : <span className="text-yellow-600">Tasdiqlanmagan</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-sm text-primary font-semibold hover:underline mt-2">
                + Yangi kontakt qo'shish
              </button>
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="text-lg font-bold mb-4">Faol seanslar (Qurilmalar)</h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-muted-foreground" />
                    <div className="max-w-[200px] sm:max-w-[300px]">
                      <p className="text-sm font-medium truncate" title={session.user_agent || ''}>{session.user_agent || 'Noma\'lum qurilma'}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.ip_address} &bull; {new Date(session.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md shrink-0"
                    title="Seansni to'xtatish"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
