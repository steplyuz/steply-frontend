"use client"

// Imtihonchi ovozi (brauzer SpeechSynthesis) va "gapirishni boshlang" signali.
// Signal fayli: /sounds/chime.wav (yo'q bo'lsa WebAudio bilan oddiy signal chalinadi).

const CHIME_SRC = "/sounds/chime.wav"

let pendingResolve: (() => void) | null = null
let cachedVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
    if (cachedVoice) return cachedVoice
    const voices = window.speechSynthesis.getVoices()
    cachedVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
        null
    return cachedVoice
}

/** Imtihonchi matnini o'qiydi. Tugagach (yoki xatoda/taymautda) resolve bo'ladi. */
export function speakExaminer(text: string): Promise<void> {
    return new Promise((resolve) => {
        const clean = text.trim()
        if (!clean) return resolve()

        const supported = typeof window !== "undefined" && "speechSynthesis" in window
        if (!supported) {
            // Ovoz qo'llab-quvvatlanmasa: matn uzunligiga qarab qisqa pauza
            const ms = Math.min(6000, 1200 + clean.split(/\s+/).length * 320)
            window.setTimeout(resolve, ms)
            return
        }

        const synth = window.speechSynthesis
        synth.cancel()
        const utter = new SpeechSynthesisUtterance(clean)
        utter.lang = "en-GB"
        utter.rate = 0.95
        utter.pitch = 1
        const voice = pickVoice()
        if (voice) utter.voice = voice

        let done = false
        const finish = () => {
            if (done) return
            done = true
            if (pendingResolve === finish) pendingResolve = null
            resolve()
        }
        pendingResolve = finish
        utter.onend = finish
        utter.onerror = finish
        // Ba'zi brauzerlarda onend kelmaydi: taymaut bilan himoya
        window.setTimeout(finish, Math.min(90000, 4000 + clean.length * 90))
        synth.speak(utter)
    })
}

/** Joriy imtihonchi nutqini to'xtatadi va kutayotgan promise'ni yakunlaydi. */
export function cancelExaminer(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
    }
    const r = pendingResolve
    pendingResolve = null
    r?.()
}

/** "Gapirishni boshlang" signali. Tugagach resolve bo'ladi. */
export function playChime(): Promise<void> {
    return new Promise((resolve) => {
        let settled = false
        const done = () => {
            if (!settled) {
                settled = true
                resolve()
            }
        }
        try {
            const audio = new Audio(CHIME_SRC)
            audio.onended = done
            audio.onerror = () => fallbackBeep(done)
            audio.play().catch(() => fallbackBeep(done))
        } catch {
            fallbackBeep(done)
        }
    })
}

function fallbackBeep(done: () => void) {
    try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.85)
        window.setTimeout(() => {
            void ctx.close()
            done()
        }, 900)
    } catch {
        window.setTimeout(done, 300)
    }
}
