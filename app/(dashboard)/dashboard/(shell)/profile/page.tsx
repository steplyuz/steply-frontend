'use client'

import { useState } from 'react'
import { BadgeCheck, Camera, Loader2, Mail, Phone, Plus, Save, Star, Trash2, UserRound } from 'lucide-react'
import { useApi } from '@/lib/api/use-api'
import { useAuth } from '@/lib/auth/auth-context'
import { UserAvatar } from '@/components/layout/user-badges'
import { del, errMsg, patch, post, put, upload } from '@/lib/api/dashboard'
import { FOCUS, LIME } from '@/lib/brand'
import { Select } from '@/components/dashboard/select'
import { DatePicker } from '@/components/dashboard/date-picker'

type Profile = { full_name?: string | null; username?: string | null; avatar_url?: string | null; bio?: string | null; birth_date?: string | null; language?: string | null; timezone?: string | null }
type Contact = { id: number; contact_type: string; value: string; is_verified: boolean; is_primary: boolean }
type Me = { global_role: string; profile: Profile; contacts: Contact[] }

const pillDark = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2 text-sm font-bold text-white transition hover:bg-foreground/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none ${FOCUS}`
const pillLight = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground/5 px-5 py-2 text-sm font-bold text-foreground transition hover:bg-foreground/10 active:scale-[0.98] motion-reduce:transition-none ${FOCUS}`
const pillDanger = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.98] motion-reduce:transition-none ${FOCUS}`
const inputCls = `h-12 w-full rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground outline-none placeholder:text-foreground/40 ${FOCUS}`

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
const CONTACT_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefon' },
]

/** Dekorativ halqa — faqat bezak */
function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute z-0 rounded-full ${className}`} style={{ border: `${width}px solid ${color}` }} />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-foreground/70">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

function ProfileForm({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const p = me.profile
  const [f, setF] = useState({
    full_name: p.full_name ?? '', username: p.username ?? '', bio: p.bio ?? '',
    birth_date: p.birth_date ?? '', language: p.language ?? 'uz', timezone: p.timezone ?? 'Asia/Tashkent',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }))
  const setVal = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  // Saqlangan vaqt zonasi ro‘yxatda bo‘lmasa ham tanlov ko‘rinib tursin
  const tzOptions = TIMEZONES.some(t => t.value === f.timezone) ? TIMEZONES : [...TIMEZONES, { value: f.timezone, label: f.timezone }]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      await put('/users/me/profile', { ...f, birth_date: f.birth_date || null, bio: f.bio || null })
      setMsg({ ok: true, text: 'Saqlandi.' }); onSaved()
    } catch (err) { setMsg({ ok: false, text: errMsg(err) }) } finally { setBusy(false) }
  }
  async function avatar(file: File) {
    setMsg(null)
    try { await upload('/users/me/avatar', file); setMsg({ ok: true, text: 'Rasm yangilandi.' }); onSaved() }
    catch (err) { setMsg({ ok: false, text: errMsg(err) }) }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12" style={{ background: LIME }}>
          <UserRound aria-hidden="true" className="size-5 sm:size-6" strokeWidth={1.75} />
        </span>
        <h2 className="text-base font-extrabold text-foreground sm:text-lg">Shaxsiy ma’lumotlar</h2>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-foreground/[0.04] p-4">
        <UserAvatar name={p.full_name} src={p.avatar_url} className="size-16 text-xl" />
        <label className={`${pillLight} cursor-pointer focus-within:ring-2 focus-within:ring-foreground`}>
          <Camera aria-hidden="true" className="size-4" /> Rasmni almashtirish
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ''; if (x) void avatar(x) }} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="To‘liq ism"><input className={inputCls} value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Username"><input className={inputCls} value={f.username} onChange={set('username')} /></Field>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Tug‘ilgan sana</span>
          <DatePicker label="Tug‘ilgan sana" value={f.birth_date} onChange={setVal('birth_date')} max={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Til</span>
          <Select label="Til" value={f.language} onChange={setVal('language')} options={LANGUAGES} />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Vaqt zonasi</span>
          <Select label="Vaqt zonasi" value={f.timezone} onChange={setVal('timezone')} options={tzOptions} />
        </div>
      </div>

      <Field label="Bio">
        <textarea rows={3} className={`w-full rounded-3xl border border-border bg-white px-5 py-3 text-sm font-medium text-foreground outline-none ${FOCUS}`} value={f.bio} onChange={set('bio')} />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button className={pillDark} disabled={busy}>
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <Save aria-hidden="true" className="size-4" />}
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        {msg && (
          <span role={msg.ok ? 'status' : 'alert'} className={`rounded-full px-4 py-2 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</span>
        )}
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const { refresh: refreshAuth } = useAuth()
  const meApi = useApi<Me>('/users/me')
  // Saqlangandan so'ng sidebar va topbar (avatar, ism) ham yangilansin
  const me = { ...meApi, reload: () => { meApi.reload(); void refreshAuth() } }
  const [type, setType] = useState('email')
  const [value, setValue] = useState('')
  const [err, setErr] = useState('')

  async function act(fn: () => Promise<unknown>, after: () => void) {
    setErr('')
    try { await fn(); after() } catch (e) { setErr(errMsg(e)) }
  }

  const profile = me.data?.profile
  const contactCount = me.data?.contacts.length ?? 0

  return (
    <div className="space-y-5 pb-6 sm:space-y-8">
      {/* Hero + statistika */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 text-foreground sm:p-8 lg:col-span-3 lg:min-h-64 lg:p-10" style={{ background: LIME }}>
          <Circle color="rgba(0,0,0,0.07)" width={22} className="-right-14 -top-14 size-44 sm:-right-16 sm:-top-16 sm:size-72" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <UserRound aria-hidden="true" className="size-3.5" /> Hisob
            </span>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tighter sm:text-6xl">Profil</h1>
            <p className="mt-3 max-w-lg text-[15px] font-medium leading-6 text-foreground/70 sm:mt-4 sm:text-base">
              Shaxsiy ma’lumotlaringiz, avatar va kontaktlaringizni boshqaring.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-foreground p-5 text-white sm:p-8 lg:col-span-2">
          <Circle color="rgba(255,255,255,0.06)" width={20} className="-right-16 -top-16 size-44 sm:size-56" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div className="flex items-center gap-4">
              {profile ? <UserAvatar name={profile.full_name} src={profile.avatar_url} className="size-14 text-lg" /> : <div className="size-14 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />}
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold sm:text-lg">{profile?.full_name || 'Foydalanuvchi'}</h2>
                <p className="truncate text-xs text-white/55">{profile?.username ? `@${profile.username}` : 'Username kiritilmagan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 sm:p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground" style={{ background: LIME }}>
                <Mail aria-hidden="true" className="size-6" strokeWidth={2} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-white/70">Kontaktlar</p>
              <p className="text-5xl font-black leading-none tabular-nums sm:text-6xl" style={{ color: LIME }}>{me.loading && !me.data ? '—' : contactCount}</p>
            </div>
          </div>
        </div>
      </section>

      {err && <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">{err}</div>}

      {me.loading && !me.data ? (
        <div className="h-72 animate-pulse rounded-3xl bg-foreground/[0.06] motion-reduce:animate-none" aria-busy="true" />
      ) : me.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
          <span>{me.error.message}</span>
          <button type="button" onClick={me.reload} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700">Qayta urinish</button>
        </div>
      ) : me.data && (
        <>
          <ProfileForm me={me.data} onSaved={me.reload} />

          <section aria-labelledby="profile-contacts" className="space-y-3 sm:space-y-4">
            <h2 id="profile-contacts" className="text-xl font-black tracking-tight text-foreground sm:text-3xl">Kontaktlar</h2>

            {me.data.contacts.length === 0 && (
              <p className="rounded-3xl border border-dashed border-foreground/20 bg-white p-6 text-center text-sm text-foreground/60">Kontakt yo‘q.</p>
            )}

            <ul className="space-y-3">
              {me.data.contacts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(228,247,10,0.22)' }}>
                      {c.contact_type === 'phone' ? <Phone aria-hidden="true" className="size-5" /> : <Mail aria-hidden="true" className="size-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{c.value}</p>
                      <p className="text-xs text-foreground/55">{c.contact_type}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.is_primary && <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-white"><Star aria-hidden="true" className="size-3" /> Asosiy</span>}
                    {c.is_verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><BadgeCheck aria-hidden="true" className="size-3.5" /> Tasdiqlangan</span>}
                    {!c.is_primary && <button type="button" className={pillLight} onClick={() => void act(() => patch(`/users/me/contacts/${c.id}/primary`), me.reload)}>Asosiy qilish</button>}
                    {!c.is_primary && <button type="button" className={pillDanger} onClick={() => void act(() => del(`/users/me/contacts/${c.id}`), me.reload)}><Trash2 aria-hidden="true" className="size-4" /> O‘chirish</button>}
                  </div>
                </li>
              ))}
            </ul>

            <form
              className="flex flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-black/10 sm:flex-row sm:items-center sm:p-5"
              onSubmit={(e) => { e.preventDefault(); if (value.trim()) void act(() => post('/users/me/contacts', { contact_type: type, value: value.trim() }), () => { setValue(''); me.reload() }) }}
            >
              <Select label="Kontakt turi" value={type} onChange={setType} options={CONTACT_TYPES} className="sm:w-40" />
              <input className={`${inputCls} min-w-0 flex-1`} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'email' ? 'name@example.com' : '998901234567'} aria-label="Kontakt qiymati" />
              <button type="submit" className={pillDark}><Plus aria-hidden="true" className="size-4" /> Qo‘shish</button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}