'use client'

import { useCallback, useEffect, useState } from 'react'
import { Globe2, Loader2, MonitorSmartphone, RefreshCw, Save, Settings2, ShieldCheck, Trash2, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { profileApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/client'
import type { Session } from '@/lib/api/types'
import { FOCUS, LIME } from '@/lib/brand'
import { fmtDate } from '@/components/dashboard/ui'
import { Select } from '@/components/dashboard/select'

const pillDark = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none ${FOCUS}`
const pillLight = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground/5 px-6 py-2 text-sm font-bold text-foreground transition hover:bg-foreground/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`
const pillDanger = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${FOCUS}`
const LANGUAGES = [
  { value: 'uz', label: 'O‘zbekcha' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]
const TIMEZONES = [
  { value: 'Asia/Tashkent', label: 'Toshkent (UTC+5)' },
  { value: 'Europe/Istanbul', label: 'Istanbul' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'UTC', label: 'UTC' },
]

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

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const [language, setLanguage] = useState('uz')
  const [timezone, setTimezone] = useState('Asia/Tashkent')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [sessionsError, setSessionsError] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    setLanguage(user?.profile?.language || 'uz')
    setTimezone(user?.profile?.timezone || 'Asia/Tashkent')
  }, [user?.profile?.language, user?.profile?.timezone])

  const loadSessions = useCallback(async () => {
    setSessionsError('')
    try {
      setSessions(await profileApi.sessions())
    } catch (e) {
      setSessionsError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => { void loadSessions() }, [loadSessions])

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await profileApi.update({ language, timezone })
      await refresh()
      setMessage({ ok: true, text: 'Sozlamalar saqlandi.' })
    } catch (e) {
      setMessage({ ok: false, text: getErrorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  async function revokeSession(sessionId: string) {
    setConfirmId(null)
    setRevoking(sessionId)
    setSessionsError('')
    try {
      await profileApi.revokeSession(sessionId)
      await loadSessions()
    } catch (e) {
      setSessionsError(getErrorMessage(e))
    } finally {
      setRevoking(null)
    }
  }

  const activeSessions = (sessions ?? []).filter((session) => !session.is_revoked)
  const loadingSessions = sessions === null && !sessionsError

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {/* Hero + statistika */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 text-foreground sm:p-8 lg:col-span-3 lg:min-h-64 lg:p-10" style={{ background: LIME }}>
          <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Settings2 aria-hidden="true" className="size-3.5" /> Hisob
            </span>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tighter sm:text-6xl">Sozlamalar</h1>
            <p className="mt-3 max-w-lg text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
              Til, vaqt zonasi va hisobingiz xavfsizligini boshqaring.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Xavfsizlik</h2>
              <p className="mt-0.5 text-xs text-white/55">Hisobingiz ochiq qurilmalar</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground" style={{ background: LIME }}>
                <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={2} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-white/70">Faol seanslar</p>
              <p className="text-5xl font-black leading-none tabular-nums sm:text-6xl" style={{ color: LIME }}>
                {loadingSessions ? '—' : activeSessions.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ilova sozlamalari */}
      <section aria-labelledby="settings-app" className="rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
            <Globe2 aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
          </span>
          <div>
            <h2 id="settings-app" className="text-base font-extrabold text-foreground sm:text-lg">Til va vaqt</h2>
            <p className="text-xs text-foreground/55">Bu sozlamalar profil ma’lumotlaridan alohida saqlanadi.</p>
          </div>
        </div>

        <form onSubmit={savePreferences} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Interfeys tili</span>
              <Select label="Interfeys tili" value={language} onChange={setLanguage} options={LANGUAGES} />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Vaqt zonasi</span>
              <Select label="Vaqt zonasi" value={timezone} onChange={setTimezone} options={TIMEZONES} />
            </div>
          </div>

          {message && (
            <p role={message.ok ? 'status' : 'alert'} className={`rounded-2xl border p-4 text-sm font-medium ${message.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
              {message.text}
            </p>
          )}

          <button type="submit" disabled={saving} className={pillDark}>
            {saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <Save aria-hidden="true" className="size-4" />}
            {saving ? 'Saqlanmoqda…' : 'Sozlamalarni saqlash'}
          </button>
        </form>
      </section>

      {/* Faol seanslar */}
      <section aria-labelledby="settings-sessions" className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="settings-sessions" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">Faol seanslar</h2>
            <p className="mt-1 max-w-xl text-sm text-foreground/60">Hisobingiz qaysi qurilmalarda ochiq ekanini tekshiring. Notanish seansni shu yerdan tugatishingiz mumkin.</p>
          </div>
          <button type="button" onClick={() => void loadSessions()} className={pillLight}>
            <RefreshCw aria-hidden="true" className="size-4" /> Yangilash
          </button>
        </div>

        {sessionsError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
            <span>{sessionsError}</span>
            <button type="button" onClick={() => void loadSessions()} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700">Qayta urinish</button>
          </div>
        )}

        {loadingSessions ? (
          <div className="h-28 animate-pulse rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" aria-busy="true" />
        ) : activeSessions.length === 0 ? (
          !sessionsError && <p className="rounded-3xl border border-dashed border-foreground/20 bg-white p-6 text-center text-sm text-foreground/60">Faol seans topilmadi.</p>
        ) : (
          <ul className="space-y-3">
            {activeSessions.map((session) => (
              <li key={session.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(228,247,10,0.22)' }}>
                  <MonitorSmartphone aria-hidden="true" className="size-6" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{session.user_agent || 'Noma’lum qurilma'}</p>
                  <p className="mt-1 text-xs text-foreground/55">{session.ip_address || 'IP noma’lum'} · oxirgi faollik {fmtDate(session.last_active)}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <ShieldCheck aria-hidden="true" className="size-3.5" /> Faol seans
                  </span>
                </div>
                <button type="button" onClick={() => setConfirmId(session.id)} disabled={revoking === session.id} className={pillDanger}>
                  {revoking === session.id ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <Trash2 aria-hidden="true" className="size-4" />}
                  Seansni tugatish
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tasdiq modali */}
      {confirmId && (
        <div role="dialog" aria-modal="true" aria-label="Seansni tugatish" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <X aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">Seansni tugatish</h3>
                <p className="mt-1 text-sm leading-5 text-foreground/60">Ushbu qurilmadagi seansni tugatmoqchimisiz? Qurilma hisobdan chiqariladi.</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmId(null)} className={pillLight}>Bekor qilish</button>
              <button
                type="button"
                onClick={() => void revokeSession(confirmId)}
                className={`inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] ${FOCUS}`}
              >
                Ha, tugatish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}