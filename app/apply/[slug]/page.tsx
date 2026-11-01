'use client'

// Ochiq ro'yxatdan o'tish (login talab qilinmaydi): /apply/{registration_slug}
// Backend: GET /apply/{slug}, POST /apply/{slug}/photo, POST /apply/{slug}.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { SiteHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { applyApi } from '@/lib/api/modules/apply'
import { getErrorMessage } from '@/lib/api/client'
import type { ApplyInput, ApplyResult, ApplySession } from '@/lib/api/types/apply'
import { loadScriptOnce } from '@/lib/auth/script-loader'
import { FOCUS } from '@/lib/brand'
import { formatDateTime } from '@/lib/format'
import { REGIONS, REGION_LABEL } from '@/lib/exam/mock-labels'
import { btn, input, Field } from '@/components/dashboard/ui'

// Cloudflare Turnstile — faqat backend APPLY_CAPTCHA_ENABLED=true bo'lganda kerak.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string
      reset: (widgetId?: string) => void
    }
  }
}

interface FormState {
  first_name: string
  last_name: string
  patronymic: string
  gender: 'M' | 'F'
  birth_date: string
  region: string
  phone: string
  passport_series: string
  photo_url: string
  photo_name: string
}

const blankForm = (): FormState => ({
  first_name: '',
  last_name: '',
  patronymic: '',
  gender: 'M',
  birth_date: '',
  region: '',
  phone: '+998',
  passport_series: '',
  photo_url: '',
  photo_name: '',
})

const PHONE_RE = /^\+998\d{9}$/
const PASSPORT_RE = /^(AA|AD)\d{7}$/i

export default function ApplyPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [session, setSession] = useState<ApplySession | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(blankForm)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<ApplyResult | null>(null)

  const captchaRef = useRef<HTMLDivElement>(null)
  const captchaId = useRef<string | null>(null)
  const captchaToken = useRef<string | null>(null)

  useEffect(() => {
    if (!slug) return
    applyApi
      .session(slug)
      .then(setSession)
      .catch(err => setLoadError(getErrorMessage(err, 'Sessiya topilmadi yoki ro‘yxatdan o‘tish yopiq')))
  }, [slug])

  // Captcha: kalit sozlangan bo'lsa widget'ni chizamiz. Token har bir so'rovdan keyin bir martalik.
  useEffect(() => {
    // Forma sessiya yuklangandan keyin chiqadi — shu sabab effekt `session` ga bog'liq.
    if (!TURNSTILE_SITE_KEY || !session || !captchaRef.current) return
    let cancelled = false
    loadScriptOnce(TURNSTILE_SCRIPT, () => !!window.turnstile, {
      loadFailed: 'Tasdiqlash skripti yuklanmadi',
      notReady: 'Tasdiqlash tayyor emas',
    })
      .then(() => {
        if (cancelled || !captchaRef.current || !window.turnstile) return
        captchaId.current = window.turnstile.render(captchaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: token => { captchaToken.current = token },
          'expired-callback': () => { captchaToken.current = null },
        })
      })
      .catch(() => setFormError('Tasdiqlash yuklanmadi. Sahifani yangilang.'))
    return () => { cancelled = true }
  }, [session])

  const resetCaptcha = () => {
    captchaToken.current = null
    if (TURNSTILE_SITE_KEY && window.turnstile) window.turnstile.reset(captchaId.current ?? undefined)
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file || !slug) return
    if (TURNSTILE_SITE_KEY && !captchaToken.current) {
      return setFormError('Avval tasdiqlashni bajaring, so‘ng rasm yuklang.')
    }
    setUploading(true)
    setFormError(null)
    try {
      const res = await applyApi.uploadPhoto(slug, file, captchaToken.current)
      setForm(f => ({ ...f, photo_url: res.photo_url, photo_name: file.name }))
    } catch (err) {
      setFormError(getErrorMessage(err, 'Rasm yuklanmadi'))
    } finally {
      resetCaptcha()
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!slug) return
    const required: Array<[boolean, string]> = [
      [form.first_name.trim().length < 2, 'Ismni kiriting.'],
      [form.last_name.trim().length < 2, 'Familiyani kiriting.'],
      [!form.birth_date, 'Tug‘ilgan sanani kiriting.'],
      [!form.region, 'Viloyatni tanlang.'],
      [!PHONE_RE.test(form.phone), 'Telefon +998XXXXXXXXX formatda bo‘lishi kerak.'],
      [!!form.passport_series && !PASSPORT_RE.test(form.passport_series), 'Pasport seriyasi AA yoki AD + 7 raqam bo‘lishi kerak.'],
      [!form.photo_url, '3x4 rasm yuklang.'],
      [!!TURNSTILE_SITE_KEY && !captchaToken.current, 'Avval tasdiqlashni bajaring.'],
    ]
    const bad = required.find(([fail]) => fail)
    if (bad) return setFormError(bad[1])

    const payload: ApplyInput = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      patronymic: form.patronymic.trim() || null,
      address: form.region,
      gender: form.gender,
      birth_date: form.birth_date,
      phone: form.phone,
      passport_series: form.passport_series.trim().toUpperCase() || null,
      photo_url: form.photo_url,
      captcha_token: captchaToken.current,
    }

    setSubmitting(true)
    setFormError(null)
    try {
      setResult(await applyApi.register(slug, payload))
    } catch (err) {
      setFormError(getErrorMessage(err, 'Ro‘yxatdan o‘tishda xatolik'))
      resetCaptcha()
    } finally {
      setSubmitting(false)
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        {loadError ? (
          <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-black/10">
            <h1 className="text-xl font-black">Sessiya topilmadi</h1>
            <p className="mt-2 text-sm text-foreground/70">{loadError}</p>
          </div>
        ) : !session ? (
          <div className="flex items-center gap-3 text-sm text-foreground/60"><Loader2 className="size-4 animate-spin" /> Yuklanmoqda…</div>
        ) : result ? (
          <div className="rounded-3xl bg-white p-8 ring-1 ring-black/10">
            <CheckCircle2 className="size-10 text-emerald-600" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-black">Arizangiz qabul qilindi</h1>
            <p className="mt-2 text-sm text-foreground/70">
              {result.first_name} {result.last_name} — {session.name}. Sana: {formatDateTime(session.scheduled_at)}.
            </p>
            <p className="mt-4 text-sm text-foreground/70">
              Imtihon kuni pasport va to‘lov kvitansiyasini olib keling. MK ID va ruxsatnoma ma’lumotlari
              to‘lov tasdiqlangandan keyin yuboriladi.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">Mock Exam ro‘yxatdan o‘tish</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{session.name}</h1>
              <p className="mt-3 text-sm text-foreground/70">
                {formatDateTime(session.scheduled_at)} · {session.location} · {session.duration_minutes} daqiqa
              </p>
            </header>

            {session.payment_details && (
              <section className="mb-8 rounded-2xl bg-white p-5 ring-1 ring-black/10">
                <h2 className="font-bold">To‘lov rekvizitlari</h2>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground/80">{session.payment_details}</pre>
              </section>
            )}

            <form onSubmit={submit} className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-black/10 sm:grid-cols-2 sm:p-8">
              <Field label="Familiya">
                <input className={input} value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </Field>
              <Field label="Ism">
                <input className={input} value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </Field>
              <Field label="Otasining ismi (ixtiyoriy)">
                <input className={input} value={form.patronymic} onChange={e => set('patronymic', e.target.value)} />
              </Field>
              <Field label="Tug‘ilgan sana">
                <input type="date" className={input} max={new Date().toISOString().slice(0, 10)} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
              </Field>
              <Field label="Jins">
                <div className="flex gap-4 pt-2 text-sm">
                  {(['M', 'F'] as const).map(g => (
                    <label key={g} className="flex items-center gap-2">
                      <input type="radio" name="gender" checked={form.gender === g} onChange={() => set('gender', g)} />
                      {g === 'M' ? 'Erkak' : 'Ayol'}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Viloyat">
                <select className={input} value={form.region} onChange={e => set('region', e.target.value)}>
                  <option value="">Tanlang</option>
                  {REGIONS.map(r => <option key={r} value={r}>{REGION_LABEL[r]}</option>)}
                </select>
              </Field>
              <Field label="Telefon">
                <input type="tel" className={input} inputMode="tel" placeholder="+998901234567" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\s/g, ''))} />
              </Field>
              <Field label="Pasport seriyasi (ixtiyoriy)">
                <input className={input} placeholder="AA1234567" value={form.passport_series} onChange={e => set('passport_series', e.target.value.toUpperCase())} />
              </Field>
              <Field label="3x4 rasm">
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`${btn.outline} cursor-pointer ${FOCUS}`}>
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => void onPhoto(e.target.files?.[0])} />
                    {uploading ? 'Yuklanmoqda…' : form.photo_url ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                  </label>
                  {form.photo_name && <span className="truncate text-xs text-foreground/60">{form.photo_name}</span>}
                </div>
              </Field>

              {TURNSTILE_SITE_KEY && <div ref={captchaRef} className="sm:col-span-2" />}

              {formError && <p className="sm:col-span-2 text-sm font-semibold text-red-700" role="alert">{formError}</p>}

              <div className="sm:col-span-2">
                <button type="submit" disabled={submitting || uploading} className={`${btn.primary} w-full sm:w-auto`}>
                  {submitting ? 'Yuborilmoqda…' : 'Arizani yuborish'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
