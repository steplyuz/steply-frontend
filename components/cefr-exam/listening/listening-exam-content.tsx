"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { CircleHelp, FolderOpen, Folder, ChevronDown, TriangleAlert } from "lucide-react"
import DOMPurify from "isomorphic-dompurify"
import { ListeningExam, ListeningQuestion } from "@/lib/cefr-types/listening"

interface ListeningExamContentProps {
  examData: ListeningExam | null
  currentQuestion: number
  answers: Record<string, string>
  onAnswer: (questionId: string | number, value: string) => void
  onSelectQuestion: (qIndex: number) => void
  activePartIndex: number
  /** Tab bosilganda. Full-audio rejimida audio o'ynayotganda tablar bloklanadi. */
  onSelectPart?: (index: number) => void
  /** Faqat refreshdan keyin partni audio vaqtiga moslash uchun (setActivePartIndex xolos). */
  onAudioPartChange?: (index: number) => void
  status: "reading" | "playing" | "ending" | "finished"
  fontSize: number
  volume: number
  onNextPart: () => void
  /** Eskirgan: "end of part" audioning ichida, alohida klip/ending bosqichi yo'q. Ixtiyoriy, ishlatilmaydi. */
  onTransitionToEnding?: () => void
  /** Butun imtihon audiosi tugaganda (full-audio rejimi). Berilmasa onNextPart ishlatiladi. */
  onFinish?: () => void
  onTimeUpdate: (current: number, duration: number) => void
  initialTime: number

  // Admin controls (hozircha ishlatilmayapti)
  isAdmin?: boolean
  onReorderParts?: (fromIndex: number, toIndex: number) => void
  onDeletePart?: (index: number) => void
  onEditPart?: (index: number) => void
}

const isShortKey = (v: string) => /^[A-Za-z0-9]{1,2}[.)]?$/.test(v.trim())

/** Backend variantni {value: "A", label: "matn"} yoki teskarisi ({label: "A", value: "matn"}) ko'rinishida berishi mumkin. */
function splitOption(opt: { value?: unknown; label?: unknown }): { key: string; text: string } {
  const a = String(opt.label ?? "").trim()
  const b = String(opt.value ?? "").trim()
  if (a && b && a !== b) {
    if (isShortKey(a) && !isShortKey(b)) return { key: a, text: b }
    if (isShortKey(b) && !isShortKey(a)) return { key: b, text: a }
    return { key: b, text: a }
  }
  const only = a || b
  return isShortKey(only) ? { key: only, text: "" } : { key: "", text: only }
}

// --- Media URL: backend nisbiy yo'l ("/media/x.png") qaytarsa, API domenini qo'shamiz ---
// .env: NEXT_PUBLIC_MEDIA_URL=https://api.example.com  (o'rnatilmasa URL o'zgarishsiz qoladi)
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "")

function resolveMedia(url?: string | null): string {
  if (!url) return ""
  const u = url.trim()
  if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:") || u.startsWith("blob:")) return u
  if (!MEDIA_BASE) return u
  return `${MEDIA_BASE}${u.startsWith("/") ? "" : "/"}${u}`
}

/** Xarita rasmini bir nechta mumkin bo'lgan maydonlardan qidiradi. */
function getMapSrc(part: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = part as Record<string, any>
  const fromQuestion = Array.isArray(p?.questions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? p.questions.map((q: any) => q?.imageUrl || q?.mapImage || q?.image).find(Boolean)
    : null
  const raw = p?.mapImage || p?.mapUrl || p?.imageUrl || p?.image || p?.diagram || fromQuestion
  return typeof raw === "string" ? resolveMedia(raw) : ""
}

// --- Audio pozitsiyasini saqlash (sahifa yangilansa ham davom ettirish uchun) ---
type SavedAudio = { part: number; time: number; ts?: number }
const SAVED_TTL_MS = 3 * 60 * 60 * 1000 // 3 soat

function readSaved(key: string | null): SavedAudio | null {
  if (!key || typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (typeof v?.ts === "number" && Date.now() - v.ts > SAVED_TTL_MS) return null
    return Number.isFinite(v?.part) && Number.isFinite(v?.time) ? v : null
  } catch {
    return null
  }
}

function writeSaved(key: string | null, value: SavedAudio | null) {
  if (!key || typeof window === "undefined") return
  try {
    if (value) localStorage.setItem(key, JSON.stringify({ ...value, ts: Date.now() }))
    else localStorage.removeItem(key)
  } catch {
    /* private mode / quota — e'tiborsiz */
  }
}

/** Admin kiritgan HTML'ni tozalab chiqaradi (XSS himoyasi). */
function Html({
  html,
  as: Tag = "span",
  className,
  style,
}: {
  html: string
  as?: "span" | "p"
  className?: string
  style?: React.CSSProperties
}) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
    [html]
  )
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: clean }} />
}

/** Xarita: yuklanmasa aniq URL bilan xato ko'rsatadi, bosilsa kattalashadi. */
function MapImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(false)
  useEffect(() => setFailed(false), [src])

  if (failed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">Xarita rasmi yuklanmadi. Administratorga xabar bering.</p>
          <p className="mt-1 break-all text-xs opacity-70">{src}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Xarita"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
        onClick={() => setZoom(true)}
        className="h-auto w-full cursor-zoom-in rounded-lg object-contain"
      />
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Xarita" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  )
}

export default function ListeningExamContent({
  examData,
  currentQuestion,
  answers,
  onAnswer,
  onSelectQuestion,
  activePartIndex,
  status,
  fontSize,
  volume,
  onNextPart,
  onFinish,
  onTimeUpdate,
  initialTime,
  onSelectPart,
  onAudioPartChange,
}: ListeningExamContentProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null) // asosiy audio (full yoki part)
  const lastSaveRef = useRef(0)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const isFullAudio = examData?.audioMode === "EXAM" && !!examData.audioUrl
  const storageKey = examData?.id ? `listening-audio:${examData.id}` : null

  // Eng so'nggi holat (unmount paytida DOM ref null bo'lib qoladi, shuning uchun pozitsiyani alohida ref'da ushlaymiz)
  const statusRef = useRef(status)
  statusRef.current = status
  const partRef = useRef(activePartIndex)
  partRef.current = activePartIndex
  const lastPosRef = useRef<{ part: number; time: number } | null>(null)

  // Oxirgi pozitsiyani yozib qo'yamiz: refresh/yopish (pagehide, beforeunload), tab yashirilganda
  // va SPA ichida boshqa sahifaga chiqib ketganda (komponent unmount — pagehide bunda ISHLAMAYDI).
  useEffect(() => {
    const save = () => {
      if (statusRef.current !== "playing") return
      const a = audioRef.current
      const pos =
        a && a.currentTime > 0 ? { part: partRef.current, time: a.currentTime } : lastPosRef.current
      // Part almashayotgan paytdagi eski pozitsiya yangi partning saqlangan joyini buzmasligi kerak
      if (!pos || pos.part !== partRef.current || !(pos.time > 0)) return
      writeSaved(storageKey, pos)
    }
    const onHidden = () => { if (document.visibilityState === "hidden") save() }
    window.addEventListener("pagehide", save)
    window.addEventListener("beforeunload", save)
    document.addEventListener("visibilitychange", onHidden)
    return () => {
      window.removeEventListener("pagehide", save)
      window.removeEventListener("beforeunload", save)
      document.removeEventListener("visibilitychange", onHidden)
      save() // unmount (sahifadan chiqib ketish)
    }
  }, [storageKey])

  // Backend savollarni id bo'yicha saralab beradi (Part 2: 10,11,12,13,14,9) — questionNumber bo'yicha saralaymiz.
  const parts = useMemo(
    () =>
      (examData?.parts ?? []).map((p) => ({
        ...p,
        questions: [...(p.questions ?? [])].sort(
          (a, b) => Number(a.questionNumber) - Number(b.questionNumber)
        ),
      })),
    [examData]
  )

  // EXAM rejimida audio segmentlari (start/end) berilganmi?
  const isSegmented = useMemo(
    () => isFullAudio && parts.some((p) => p.audioStartSeconds != null),
    [isFullAudio, parts]
  )

  // Har bir part boshlanadigan audio vaqti. Start yo'q bo'lsa oldingi partning end'i, birinchi part uchun 0.
  const partStarts = useMemo(
    () => parts.map((p, i) => Number(p.audioStartSeconds ?? parts[i - 1]?.audioEndSeconds ?? 0)),
    [parts]
  )

  // Imtihon yakunlanganda saqlangan audio joyini tozalaymiz
  useEffect(() => {
    if (status === "finished") writeSaved(storageKey, null)
  }, [status, storageKey])

  const isPartDone = useMemo(
    () => (partIdx: number) => {
      const part = parts[partIdx]
      if (!part) return false
      return part.questions.every((q) => {
        const v = answers[String(q.id)]
        return v && v.trim() !== ""
      })
    },
    [parts, answers]
  )

  // Eng so'nggi qiymatlar (effect deps'ga qo'shmasdan o'qish uchun)
  const onNextPartRef = useRef(onNextPart)
  onNextPartRef.current = onNextPart
  const activePartRef = useRef(activePartIndex)
  activePartRef.current = activePartIndex
  const partStartsRef = useRef(partStarts)
  partStartsRef.current = partStarts
  const emitTimeRef = useRef<(a: HTMLAudioElement) => void>(() => {})

  const targetPart = parts[activePartIndex]
  const nextPart = parts[activePartIndex + 1]
  // Part qachon tugaydi: o'z end'i, bo'lmasa keyingi partning start'i, bo'lmasa fayl oxiri (null)
  const segmentEnd = targetPart?.audioEndSeconds ?? nextPart?.audioStartSeconds ?? null

  const fullSrc = resolveMedia(examData?.audioUrl)
  const partSrc = resolveMedia(targetPart?.audioLabel)

  const initialTimeRef = useRef(initialTime)
  const lastPartRef = useRef(activePartIndex)
  if (lastPartRef.current !== activePartIndex) {
    lastPartRef.current = activePartIndex
    initialTimeRef.current = initialTime
  }

  // --- VOLUME (ikkala audio uchun) ---
  useEffect(() => {
    const v = (volume ?? 80) / 100
    if (audioRef.current) audioRef.current.volume = v
  }, [volume])

  // Part yoki status o'zgarganda eski xatoni tozalaymiz
  useEffect(() => setAudioError(null), [activePartIndex, status])

  // --- A) FULL-AUDIO (EXAM): bitta fayl. activePartIndex deps'da YO'Q: part almashganda
  // effect qayta ishlamaydi. Status ending -> playing bo'lganda esa qayta ishlaydi va
  // yangi partning matn boshlanadigan joyiga seek qiladi (10 soniyalik pauza yo'q).
  useEffect(() => {
    if (!isFullAudio || status !== "playing") return
    const audio = audioRef.current
    if (!audio) return
    if (!fullSrc) {
      setAudioError("Imtihon audiosi manzili yo'q")
      return
    }

    let cancelled = false

    const run = async () => {
      if (audio.getAttribute("src") !== fullSrc) {
        audio.src = fullSrc
        audio.load()
      }
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => { cleanup(); resolve() }
          const onError = () => {
            cleanup()
            reject(new Error(`Audio yuklanmadi (code=${audio.error?.code}) ${fullSrc}`))
          }
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", onReady)
            audio.removeEventListener("error", onError)
          }
          audio.addEventListener("loadedmetadata", onReady, { once: true })
          audio.addEventListener("error", onError, { once: true })
        })
      }
      if (cancelled) return

      const idx = activePartRef.current
      const s = partStartsRef.current[idx] ?? 0
      const saved = readSaved(storageKey)
      const savedHere = saved && saved.part === idx ? saved.time : null
      const target = savedHere ?? Math.max(s, isSegmented ? 0 : initialTimeRef.current)
      if (Number.isFinite(target) && Math.abs(audio.currentTime - target) > 0.75) {
        audio.currentTime = target
      }
      emitTimeRef.current(audio) // sidebar play'dan oldin ham to'g'ri qolgan vaqtni ko'rsatadi
      initialTimeRef.current = 0
      await audio.play()
      if (!cancelled) setNeedsGesture(false)
    }

    run().catch((error) => {
      if (cancelled) return
      if (error?.name === "NotAllowedError") {
        setNeedsGesture(true)
        return
      }
      console.error("[listening] full audio error", error)
      setAudioError(String(error?.message ?? error))
    })

    return () => {
      cancelled = true
      audio.pause()
    }
  }, [isFullAudio, isSegmented, status, fullSrc, storageKey])

  // --- B) PART-BY-PART: har part alohida fayl. Audio ichida o'qish pauzasi bor, shuning uchun
  // part almashishi bilan darhol o'ynaydi (parent status'ni to'g'ridan-to'g'ri "playing" qiladi).
  useEffect(() => {
    if (isFullAudio) return
    const audio = audioRef.current
    if (!audio) return

    if (status !== "playing") {
      audio.pause()
      return
    }
    if (!partSrc) {
      console.warn("[listening] part audio manzili yo'q", {
        part: activePartIndex + 1,
        audioMode: examData?.audioMode,
        partKeys: Object.keys(targetPart ?? {}),
      })
      setAudioError(`${activePartIndex + 1}-qism: audio manzili yo'q`)
      audio.pause()
      return
    }

    let cancelled = false
    const saved = readSaved(storageKey)
    const savedHere = saved && saved.part === activePartIndex ? saved.time : null
    const startAt = Math.max(0, initialTimeRef.current, savedHere ?? 0)

    const run = async () => {
      const sourceChanged = (audio.getAttribute("src") || "") !== partSrc
      if (sourceChanged) {
        audio.src = partSrc
        audio.load()
      }
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => { cleanup(); resolve() }
          const onError = () => {
            cleanup()
            reject(new Error(`Audio yuklanmadi (code=${audio.error?.code}) ${partSrc}`))
          }
          const cleanup = () => {
            audio.removeEventListener("loadedmetadata", onReady)
            audio.removeEventListener("error", onError)
          }
          audio.addEventListener("loadedmetadata", onReady, { once: true })
          audio.addEventListener("error", onError, { once: true })
        })
      }
      if (cancelled) return
      if (sourceChanged && Number.isFinite(startAt) && Math.abs(audio.currentTime - startAt) > 0.75) {
        audio.currentTime = startAt
      }
      emitTimeRef.current(audio)
      initialTimeRef.current = 0
      await audio.play()
      if (!cancelled) setNeedsGesture(false)
    }

    run().catch((error) => {
      if (cancelled) return
      if (error?.name === "NotAllowedError") {
        setNeedsGesture(true)
        return
      }
      console.error("[listening] part audio error", error)
      setAudioError(String(error?.message ?? error))
    })

    return () => {
      cancelled = true
      audio.pause()
    }
  }, [isFullAudio, status, activePartIndex, partSrc, storageKey])

  // --- Savol tanlanganda (sidebar'dan) o'sha kartaga o'tish ---
  useEffect(() => {
    document.getElementById(`q-${currentQuestion}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [currentQuestion])

  // Audio vaqtiga qarab qaysi part ekanini topadi (partStarts o'sish tartibida bo'lishi shart)
  const partIndexAt = (t: number) => {
    let idx = 0
    for (let i = 0; i < partStarts.length; i++) if (t >= partStarts[i] - 0.05) idx = i
    return idx
  }

  // PART-BY-PART rejimida umumiy vaqtni hisoblash uchun hamma part audiolarining davomiyligini
  // (faqat metadata) oldindan o'qib olamiz.
  const partDurationsRef = useRef<number[]>([])
  useEffect(() => {
    if (isFullAudio) return
    const ds: number[] = []
    partDurationsRef.current = ds
    const els = parts.map((p, i) => {
      const src = resolveMedia(p.audioLabel)
      if (!src) return null
      const a = new Audio()
      a.preload = "metadata"
      a.onloadedmetadata = () => { ds[i] = a.duration }
      a.src = src
      return a
    })
    return () => {
      els.forEach((a) => {
        if (!a) return
        a.onloadedmetadata = null
        a.removeAttribute("src")
        a.load()
      })
    }
  }, [isFullAudio, parts])

  // Parent/sidebar'ga UMUMIY audio vaqtini beradi: current 0 dan duration gacha o'sadi,
  // sidebar `duration - current` bilan butun audio tugashigacha orqaga sanaydi.
  //  - Full-audio (EXAM): bitta fayl, current = audio.currentTime, duration = audio.duration.
  //  - Part-by-part: current = oldingi partlar davomiyligi + joriy vaqt, duration = barcha partlar yig'indisi.
  //    Davomiyliklar hali yuklanmagan bo'lsa, vaqtincha joriy part bo'yicha ko'rsatadi.
  const emitTime = (audio: HTMLAudioElement) => {
    const t = audio.currentTime
    lastPosRef.current = { part: activePartIndex, time: t }
    if (isFullAudio) {
      onTimeUpdate(t, audio.duration)
      return
    }
    const ds = partDurationsRef.current
    const allKnown = parts.length > 0 && parts.every((_, i) => Number.isFinite(ds[i]) && ds[i] > 0)
    if (allKnown) {
      const before = ds.slice(0, activePartIndex).reduce((a, b) => a + b, 0)
      const total = ds.reduce((a, b) => a + b, 0)
      onTimeUpdate(before + t, total)
    } else {
      onTimeUpdate(t, audio.duration)
    }
  }
  emitTimeRef.current = emitTime

  // Full rejimida audio o'ynayotganda tablar audio bilan sinxron: bosish pozitsiyani buzmasligi uchun bloklanadi
  const tabsLocked = isFullAudio && status === "playing"

  if (!parts.length) return null

  const currentPart = parts[activePartIndex]
  if (!currentPart) return <div className="p-10 text-center">Part not found</div>

  const mapSrc = getMapSrc(currentPart)
  const isGapFill = currentPart.taskType === "GAP_FILL"
  const isMapLayout = currentPart.taskType === "MAP_DIAGRAM" || !!mapSrc
  const hasPassage = !isGapFill && !!currentPart.passage && currentPart.passage.length > 0
  const sectionLabel = `${currentPart.partNumber || activePartIndex + 1}-qism`

  const cardShell = "rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
  const activeRing = (on: boolean) => (on ? "ring-2 ring-foreground/40 border-foreground/40" : "")

  const optionsFor = (q: ListeningQuestion) =>
    q.options && q.options.length > 0 ? q.options : currentPart.options || []

  // --- GAP FILL: har bir savol o'z matnida "____" o'rniga input oladi ---
  const renderGapFill = () => {
    const input = (q: ListeningQuestion) => {
      const qId = String(q.id)
      const qNum = Number(q.questionNumber)
      return (
        <input
          type="text"
          autoComplete="off"
          value={answers[qId] ?? ""}
          onChange={(e) => onAnswer(qId, e.target.value)}
          onFocus={() => onSelectQuestion(qNum)}
          placeholder={String(qNum)}
          aria-label={`${qNum}-savol javobi`}
          className={`mx-1 h-9 w-28 rounded-t-md border-0 border-b-2 bg-background px-2 text-center font-semibold text-foreground outline-none transition-colors placeholder:text-[#9ca3af] focus:border-foreground focus:bg-white md:w-36
            ${currentQuestion === qNum ? "border-foreground" : "border-foreground/40"}`}
        />
      )
    }

    return (
      <div className={`${cardShell} min-w-0 p-5 md:p-8`}>
        {currentPart.passage && (
          <Html
            as="p"
            html={currentPart.passage}
            className="mb-5 block font-bold text-foreground"
            style={{ fontSize: `${fontSize}px`, overflowWrap: "anywhere" }}
          />
        )}
        <ol className="space-y-3">
          {currentPart.questions.map((q) => {
            const qNum = Number(q.questionNumber)
            const [before = "", ...rest] = (q.question || "").split(/(?:\(\d+\)\s*)?_{3,}/)
            const hasGap = rest.length > 0
            const after = rest.join(" ")
            return (
              <li
                key={q.id}
                id={`q-${qNum}`}
                className="leading-[2.6] text-foreground"
                style={{ fontSize: `${fontSize}px`, overflowWrap: "anywhere" }}
              >
                <Html html={before} />
                {input(q)}
                {hasGap && after && <Html html={after} />}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  // Dropdown ("Select Answer") — Matching / Map
  const renderSelectCard = (q: ListeningQuestion) => {
    const qId = String(q.id)
    const qNum = Number(q.questionNumber)
    const opts = optionsFor(q)
    return (
      <div key={qId} id={`q-${qNum}`} className={`${cardShell} ${activeRing(currentQuestion === qNum)} min-w-0 transition-shadow`}>
        <div className="flex items-center gap-2 rounded-t-xl border-b border-border bg-white px-4 py-3 font-semibold text-foreground">
          <ChevronDown className="size-4 shrink-0 text-foreground" />
          <span style={{ fontSize: `${fontSize}px`, overflowWrap: "anywhere" }}>
            S{qNum}. {q.question ? <Html html={q.question} /> : null}
          </span>
        </div>
        <div className="p-4">
          <div className="relative">
            <select
              value={answers[qId] || ""}
              onChange={(e) => { onAnswer(qId, e.target.value); onSelectQuestion(qNum) }}
              onFocus={() => onSelectQuestion(qNum)}
              aria-label={`${qNum}-savol javobi`}
              className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-border bg-white px-4 pr-10 font-medium text-foreground outline-none transition focus:border-foreground focus:ring-[3px] focus:ring-foreground/25"
            >
              <option value="" disabled>Select Answer</option>
              {opts.map((o) => {
                const { key, text } = splitOption(o)
                return (
                  <option key={String(o.value)} value={o.value}>
                    {key && text ? `${key} — ${text}` : text || key}
                  </option>
                )
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  // Radio kartasi — Multiple choice
  const renderChoiceCard = (q: ListeningQuestion) => {
    const qId = String(q.id)
    const qNum = Number(q.questionNumber)
    const opts = optionsFor(q)
    return (
      <div
        key={qId}
        id={`q-${qNum}`}
        onClick={() => onSelectQuestion(qNum)}
        className={`${cardShell} ${activeRing(currentQuestion === qNum)} min-w-0 transition-shadow`}
      >
        <div className="flex items-start gap-2 rounded-t-xl border-b border-border bg-background px-4 py-3 font-semibold text-foreground">
          <CircleHelp className="mt-0.5 size-4 shrink-0 text-foreground" />
          <span style={{ fontSize: `${fontSize}px`, overflowWrap: "anywhere" }}>
            {qNum}. {q.question ? <Html html={q.question} /> : `${qNum}-savol`}
          </span>
        </div>
        <div className="px-4 pb-4 pt-3">
          {opts.length > 0 ? (
            opts.map((opt) => {
              const selected = answers[qId] === opt.value
              const { key, text } = splitOption(opt)
              return (
                <label
                  key={String(opt.value)}
                  className={`my-2 flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-200
                    ${selected
                      ? "border-transparent bg-foreground/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      : "border-border bg-white hover:border-foreground/40"}`}
                >
                  <input
                    type="radio"
                    name={`q-${qId}`}
                    checked={selected}
                    onChange={() => { onAnswer(qId, opt.value); onSelectQuestion(qNum) }}
                    className="sr-only"
                  />
                  {/* Variant harfi (A/B/C) doira ichida; tanlanganda doira to'ladi */}
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
                      ${selected ? "bg-foreground text-background" : "bg-[#d9d9d9] text-foreground"}`}
                    aria-hidden
                  >
                    {key ? key.replace(/[.)]$/, "") : <span className={`size-2.5 rounded-full bg-foreground transition-transform ${selected ? "scale-100" : "scale-0"}`} />}
                  </span>
                  {text && (
                    <span
                      className="min-w-0 text-foreground"
                      style={{ fontSize: `${fontSize - 2}px`, overflowWrap: "anywhere" }}
                    >
                      {text}
                    </span>
                  )}
                </label>
              )
            })
          ) : (
            <input
              type="text"
              autoComplete="off"
              value={answers[qId] ?? ""}
              onChange={(e) => onAnswer(qId, e.target.value)}
              onFocus={() => onSelectQuestion(qNum)}
              placeholder="Javobingiz..."
              className="h-12 w-full rounded-xl border border-border bg-white px-4 font-semibold text-foreground outline-none focus:border-foreground focus:ring-[3px] focus:ring-foreground/25"
            />
          )}
        </div>
      </div>
    )
  }

  const renderQuestion = (q: ListeningQuestion) => {
    const t = String(q.type)
    return t === "MATCHING" || t === "MAP_DIAGRAM" || t === "MAP_LABELING" || isMapLayout
      ? renderSelectCard(q)
      : renderChoiceCard(q)
  }

  const instructionText = currentPart.instruction || currentPart.context
  const instructionBlock = instructionText ? (
    <div className="mb-3 min-w-0">
      <p className="font-bold text-foreground" style={{ fontSize: `${fontSize}px` }}>{sectionLabel}</p>
      <Html
        as="p"
        html={instructionText}
        className="mt-1 block text-[#374151]"
        style={{ fontSize: `${fontSize - 2}px`, overflowWrap: "anywhere" }}
      />
    </div>
  ) : null

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden bg-background">
      {/* PART TABS */}
      <div className="shrink-0 px-4 pt-3 md:px-6">
        <div className="rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-3">
            {parts.map((_, idx) => {
              const done = isPartDone(idx)
              const active = activePartIndex === idx
              const clickable = !!onSelectPart && !tabsLocked
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPart?.(idx)}
                  disabled={!clickable}
                  aria-current={active ? "true" : undefined}
                  aria-label={`${idx + 1}-qismga o'tish`}
                  className={`inline-flex min-w-12 items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2
                    ${clickable && !active ? "cursor-pointer hover:border-foreground/50" : ""}
                    ${active
                      ? "border-transparent bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      : done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong bg-white text-muted-foreground"}`}
                >
                  {active || done ? <FolderOpen className="size-3.5" /> : <Folder className="size-3.5" />}
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Asosiy audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget
          if (status !== "playing") return
          const t = audio.currentTime

          const now = Date.now()
          if (now - lastSaveRef.current > 1000 && t > 0) {
            lastSaveRef.current = now
            writeSaved(storageKey, { part: activePartIndex, time: t })
          }

          emitTime(audio)

          // "End of part" audioning ichida: audio to'xtamaydi. Part chegarasidan o'tilganda
          // faqat partni (tab + savollar) almashtiramiz; effect qayta ishlamaydi, audio davom etadi.
          if (isFullAudio && isSegmented) {
            let idx = activePartIndex
            if (segmentEnd != null && t >= Number(segmentEnd)) idx += 1
            idx = Math.max(Math.min(idx, parts.length - 1), partIndexAt(t))
            if (idx > activePartIndex) onAudioPartChange?.(idx)
          }
        }}
        onEnded={() => {
          if (status !== "playing") return
          if (isFullAudio) {
            // Butun audio tugadi: imtihonni yakunlaymiz
            if (onFinish) onFinish()
            else onNextPart()
            return
          }
          // Part-by-part: keyingi part darhol boshlanadi (oxirgi partda onNextPart imtihonni yakunlaydi)
          if (activePartIndex < parts.length - 1) {
            writeSaved(storageKey, { part: activePartIndex + 1, time: 0 })
          }
          onNextPart()
        }}
      />

      {/* Yangilashdan keyin brauzer autoplay'ni bloklaydi: bitta bosish kerak */}
      {needsGesture && status === "playing" && (
        <div className="shrink-0 px-4 pt-3 md:px-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-sm font-semibold text-amber-800">
              Audio to&apos;xtatildi. Davom ettirish uchun tugmani bosing.
            </span>
            <button
              type="button"
              onClick={() => {
                audioRef.current
                  ?.play()
                  .then(() => setNeedsGesture(false))
                  .catch(() => {})
              }}
              className="shrink-0 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background"
            >
              Davom ettirish
            </button>
          </div>
        </div>
      )}

      {/* Audio xatosi: part jim o'tib ketmaydi, foydalanuvchi ko'radi */}
      {audioError && status === "playing" && (
        <div className="shrink-0 px-4 pt-3 md:px-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="min-w-0 break-all text-sm font-semibold text-red-800">{audioError}</span>
            <button
              type="button"
              onClick={() => { setAudioError(null); onNextPart() }}
              className="shrink-0 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background"
            >
              Audio&apos;siz davom etish
            </button>
          </div>
        </div>
      )}

      {/* ASOSIY MAYDON */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-28 md:p-6 lg:pb-6">
        {isGapFill ? (
          <div className="mx-auto max-w-5xl">
            {instructionBlock}
            {renderGapFill()}
          </div>
        ) : isMapLayout ? (
          // Xarita layout hasPassage'dan OLDIN tekshiriladi, aks holda passage bor partda xarita chiqmay qolardi
          <div className="mx-auto grid max-w-6xl items-start gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className={`${cardShell} min-w-0 p-4 md:p-5 xl:sticky xl:top-0`}>
              {instructionBlock}
              {hasPassage && (
                <Html
                  as="p"
                  html={currentPart.passage || ""}
                  className="mb-3 block leading-relaxed text-foreground"
                  style={{ fontSize: `${fontSize - 2}px`, overflowWrap: "anywhere" }}
                />
              )}
              {mapSrc ? (
                <MapImage src={mapSrc} />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                  <TriangleAlert className="size-5 shrink-0" />
                  <span className="text-sm font-semibold">
                    Xarita rasmi yuklanmagan. Administratorga xabar bering.
                  </span>
                </div>
              )}
              <h3 className="mt-4 font-bold text-foreground" style={{ fontSize: `${fontSize}px` }}>Savollar:</h3>
              <ul className="mt-1 space-y-1 text-foreground" style={{ fontSize: `${fontSize - 2}px` }}>
                {currentPart.questions.map((q) => (
                  <li key={q.id} className="font-semibold" style={{ overflowWrap: "anywhere" }}>
                    S{q.questionNumber}. {q.question ? <Html html={q.question} /> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 space-y-3">{currentPart.questions.map(renderQuestion)}</div>
          </div>
        ) : hasPassage ? (
          <div className="mx-auto max-w-5xl">
            {instructionBlock}
            <div className={`${cardShell} mb-4 min-w-0 p-5 md:p-8`}>
              <Html
                as="p"
                html={currentPart.passage || ""}
                className="block leading-relaxed text-foreground"
                style={{ fontSize: `${fontSize}px`, overflowWrap: "anywhere" }}
              />
            </div>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              {currentPart.questions.map(renderQuestion)}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            {instructionBlock}
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              {currentPart.questions.map(renderQuestion)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}