'use client'

/**
 * Imtihon boshlanishidan oldingi qurilma tekshiruvi (har bir skill uchun).
 *  - Internet, brauzer qo'llab-quvvatlashi
 *  - Mikrofon: ruxsat + qurilma tanlash + jonli daraja; "required" bo'lsa ovoz haqiqatan eshitilishi shart
 *  - Dinamik/naushnik: test tovushi (Listening)
 *  - To'liq ekran imkoniyati (mock)
 * Tanlangan mikrofon `getPreferredMicId()` orqali yozuv komponentiga uzatiladi.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Circle, Loader2, Maximize, Mic, MicOff, Play, Volume2, Wifi, WifiOff } from 'lucide-react'

const MIC_KEY = 'steply-mic-device'
export const getPreferredMicId = (): string | null => {
  try { return localStorage.getItem(MIC_KEY) } catch { return null }
}
/** Tanlangan mikrofon bilan MediaStream; qurilma topilmasa umumiy mikrofonga qaytadi. */
export async function getMicStream(): Promise<MediaStream> {
  const id = getPreferredMicId()
  if (id) {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: id } } }) } catch { /* umumiy */ }
  }
  return navigator.mediaDevices.getUserMedia({ audio: true })
}

type Mode = 'required' | 'optional'
export interface PreflightNeeds { mic?: Mode; speaker?: boolean; fullscreen?: boolean }
type Status = 'idle' | 'busy' | 'ok' | 'warn' | 'fail'

function Row({ icon, title, desc, status, action, children }: { icon: React.ReactNode; title: string; desc: string; status: Status; action?: React.ReactNode; children?: React.ReactNode }) {
  const badge =
    status === 'ok' ? <CheckCircle2 className="size-5 text-success" aria-label="Tayyor" /> :
    status === 'fail' ? <AlertTriangle className="size-5 text-error" aria-label="Muammo" /> :
    status === 'warn' ? <AlertTriangle className="size-5 text-warning" aria-label="Ogohlantirish" /> :
    status === 'busy' ? <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Tekshirilmoqda" /> :
    <Circle className="size-5 text-border-strong" aria-label="Kutilmoqda" />
  return (
    <li className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-foreground">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className={`text-xs leading-5 ${status === 'fail' ? 'text-error' : 'text-muted-foreground'}`}>{desc}</p>
        </div>
        {action}
        {badge}
      </div>
      {children}
    </li>
  )
}

const smallBtn = 'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground'
const smallPrimary = 'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground'

export function PreflightCheck({ mic = 'required', speaker = false, fullscreen = false, onReadyChange }: PreflightNeeds & { onReadyChange: (ready: boolean) => void }) {
  const [online, setOnline] = useState(true)
  const [micState, setMicState] = useState<'idle' | 'busy' | 'live' | 'denied' | 'missing'>('idle')
  const [heard, setHeard] = useState(false)
  const [level, setLevel] = useState(0)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string>('')
  const [tone, setTone] = useState<'idle' | 'played' | 'ok'>('idle')

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const heardRef = useRef(false)

  const browserOk = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  const AudioCtx = () => window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) }
  }, [])

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    setLevel(0)
  }, [])
  useEffect(() => stopMic, [stopMic])

  const startMic = useCallback(async (id?: string) => {
    stopMic()
    heardRef.current = false
    setHeard(false)
    setMicState('busy')
    try {
      const stream = id
        ? await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: id } } })
        : await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const usedId = stream.getAudioTracks()[0]?.getSettings().deviceId
      if (usedId) { setDeviceId(usedId); try { localStorage.setItem(MIC_KEY, usedId) } catch {} }
      setDevices((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput'))

      const ctx = new (AudioCtx())()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128))
        const lv = Math.min(1, peak / 64)
        setLevel(lv)
        if (lv > 0.12 && !heardRef.current) { heardRef.current = true; setHeard(true) }
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
      setMicState('live')
    } catch (e) {
      stopMic()
      const name = (e as DOMException)?.name
      setMicState(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'missing' : 'denied')
    }
  }, [stopMic])

  const playTone = async () => {
    try {
      const ctx = new (AudioCtx())()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 440
      gain.gain.value = 0.12
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      setTone('played')
      setTimeout(() => { osc.stop(); void ctx.close() }, 1200)
    } catch { setTone('idle') }
  }

  // ---- holatlar ----
  const micRequired = mic === 'required'
  const micOk = micState === 'live' && (!micRequired || heard)
  const micStatus: Status =
    micState === 'busy' ? 'busy' :
    micState === 'denied' || micState === 'missing' ? (micRequired ? 'fail' : 'warn') :
    micState === 'live' ? (heard ? 'ok' : 'warn') : 'idle'
  const micDesc =
    micState === 'idle' ? 'Tekshirish tugmasini bosing, brauzer ruxsat so‘rasa “Ruxsat berish”ni tanlang.' :
    micState === 'busy' ? 'Mikrofon yoqilmoqda…' :
    micState === 'denied' ? 'Ruxsat berilmadi. Brauzer manzil satridagi qulf belgisi orqali mikrofonga ruxsat bering, so‘ng qayta urining.' :
    micState === 'missing' ? 'Mikrofon topilmadi. Qurilmani ulang yoki boshqa mikrofon tanlang.' :
    heard ? 'Ovoz eshitildi — mikrofon ishlayapti.' : 'Mikrofon yoqilgan. Biror narsa deb ko‘ring: indikator harakatlanishi kerak.'

  const netStatus: Status = online ? 'ok' : 'fail'
  const browserStatus: Status = browserOk ? 'ok' : micRequired ? 'fail' : 'warn'
  const checks: boolean[] = [online]
  if (micRequired) checks.push(browserOk, micOk)
  if (speaker) checks.push(tone === 'ok')
  const ready = checks.every(Boolean)

  const onReadyRef = useRef(onReadyChange)
  onReadyRef.current = onReadyChange
  useEffect(() => { onReadyRef.current(ready) }, [ready])

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        <Row
          icon={online ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
          title="Internet aloqasi"
          desc={online ? 'Ulanish bor.' : 'Internet uzilgan. Ulanishni tiklang — javoblar yuborilmaydi.'}
          status={netStatus}
        />

        {(micRequired || mic === 'optional') && (
          <Row
            icon={micState === 'denied' || micState === 'missing' ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            title={`Mikrofon${micRequired ? '' : ' (ixtiyoriy)'}`}
            desc={micDesc}
            status={micStatus}
            action={
              micState === 'live'
                ? <button type="button" className={smallBtn} onClick={() => { stopMic(); setMicState('idle'); setHeard(false) }}>To‘xtatish</button>
                : <button type="button" className={smallPrimary} disabled={micState === 'busy' || (!browserOk && micRequired)} onClick={() => void startMic(deviceId || undefined)}>
                    {micState === 'denied' || micState === 'missing' ? 'Qayta urinish' : 'Tekshirish'}
                  </button>
            }
          >
            {micState === 'live' && (
              <div className="mt-3 space-y-2.5">
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label="Mikrofon darajasi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                  <div className={`h-full rounded-full transition-[width] duration-75 ${heard ? 'bg-foreground' : 'bg-muted-foreground'}`} style={{ width: `${Math.round(level * 100)}%` }} />
                </div>
                {devices.length > 1 && (
                  <select aria-label="Mikrofon qurilmasi" value={deviceId} onChange={(e) => { setDeviceId(e.target.value); void startMic(e.target.value) }}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20">
                    {devices.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Mikrofon ${i + 1}`}</option>)}
                  </select>
                )}
              </div>
            )}
          </Row>
        )}

        {micRequired && (
          <Row
            icon={<Mic className="size-5" />}
            title="Brauzer audio yozuvini qo‘llaydi"
            desc={browserOk ? 'MediaRecorder mavjud.' : 'Bu brauzer audio yozishni qo‘llamaydi. Chrome, Edge yoki Safari’ning yangi versiyasidan foydalaning.'}
            status={browserStatus}
          />
        )}

        {speaker && (
          <Row
            icon={<Volume2 className="size-5" />}
            title="Ovoz chiqishi (naushnik / dinamik)"
            desc={tone === 'ok' ? 'Ovoz eshitildi.' : tone === 'played' ? 'Test tovushini eshitdingizmi?' : 'Test tovushini ijro eting va ovoz balandligini sozlang.'}
            status={tone === 'ok' ? 'ok' : 'idle'}
            action={
              tone === 'played' ? (
                <div className="flex gap-1.5">
                  <button type="button" className={smallPrimary} onClick={() => setTone('ok')}>Eshitdim</button>
                  <button type="button" className={smallBtn} onClick={() => void playTone()}>Qayta</button>
                </div>
              ) : <button type="button" className={smallPrimary} onClick={() => void playTone()}><Play className="size-3.5 fill-current" /> {tone === 'ok' ? 'Qayta ijro' : 'Tovushni ijro etish'}</button>
            }
          />
        )}

        {fullscreen && (
          <Row
            icon={<Maximize className="size-5" />}
            title="To‘liq ekran rejimi"
            desc={typeof document !== 'undefined' && document.fullscreenEnabled ? 'Imtihon boshlanganda to‘liq ekranga o‘tadi. Undan chiqmang.' : 'Brauzeringiz to‘liq ekranni cheklagan. Mock imtihon uchun boshqa brauzer sinab ko‘ring.'}
            status={typeof document !== 'undefined' && document.fullscreenEnabled ? 'ok' : 'warn'}
          />
        )}
      </ul>
    </div>
  )
}

/** Tekshiruv paneli + "Orqaga" / "Imtihonni boshlash" tugmalari: tayyor bo'lmaguncha boshlash o'chiq. */
export function PreflightStart({ needs, onBack, onStart, starting = false, startLabel = 'Imtihonni boshlash' }: {
  needs: PreflightNeeds
  onBack: () => void
  onStart: () => void
  starting?: boolean
  startLabel?: string
}) {
  const [ready, setReady] = useState(false)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-bold text-foreground">Boshlashdan oldin tekshiruv</h2>
        <PreflightCheck {...needs} onReadyChange={setReady} />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={onBack} className="flex-1 rounded-2xl border border-border-strong py-3.5 text-center font-bold text-foreground/80 transition hover:bg-muted">Orqaga</button>
        <button type="button" onClick={onStart} disabled={!ready || starting}
          className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 font-bold text-background shadow-lg transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40">
          {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />} {startLabel}
        </button>
      </div>
      {!ready && <p className="text-center text-xs text-muted-foreground">Barcha majburiy tekshiruvlar o‘tgach, imtihonni boshlash mumkin bo‘ladi.</p>}
    </div>
  )
}
