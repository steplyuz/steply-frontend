"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import ListeningExamContent from "@/components/cefr-exam/listening/listening-exam-content"
import ListeningExamSidebar from "@/components/cefr-exam/listening/listening-exam-sidebar"
import ListeningFinishModal from "@/components/cefr-exam/listening/listening-finish-modal"
import ListeningTopBar from "@/components/cefr-exam/listening/listening-top-bar"
import { Loader2, AlertCircle, Headphones, ShieldCheck, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { PreflightStart } from "@/components/exam/preflight"
import { useAuth } from "@/lib/auth/auth-context"
import { isExamLocked, lockExam } from "@/lib/exam-lock"
import { resolveAudioUrl } from "@/lib/api"

// API
import { getListeningExamByIdAPI, submitListeningExamAPI } from "@/lib/cefr-api/listening"
import { pullMockSkillResultAPI } from "@/lib/cefr-api/mock"
import type { ListeningExam } from "@/lib/cefr-types/listening"

/** Variantlar [{label,value}] yoki ["matn", ...] ko'rinishida kelishi mumkin. */
function normalizeOptions(raw: unknown): { value: string; label: string }[] {
    if (!Array.isArray(raw)) return []
    return raw
        .map((o: any, i: number) => {
            if (o == null) return null
            if (typeof o === "string" || typeof o === "number") {
                const text = String(o)
                return { value: String.fromCharCode(65 + i), label: text }
            }
            return { value: String(o.value ?? o.key ?? o.label ?? ""), label: String(o.label ?? o.text ?? o.value ?? "") }
        })
        .filter((o): o is { value: string; label: string } => !!o && (!!o.value || !!o.label))
}

// listening-exam-content.tsx audio pozitsiyasini shu kalitda saqlaydi: { part, time, ts }
const AUDIO_SAVED_TTL_MS = 3 * 60 * 60 * 1000 // 3 soat
const audioKey = (examId: string | number) => `listening-audio:${examId}`

/** Saqlangan audio qaysi partda qolganini qaytaradi (refresh / sahifadan chiqib qaytish uchun). */
function readSavedAudioPart(examId: string | number, totalParts: number): number | null {
    try {
        const raw = localStorage.getItem(audioKey(examId))
        if (!raw) return null
        const v = JSON.parse(raw)
        if (typeof v?.ts === "number" && Date.now() - v.ts > AUDIO_SAVED_TTL_MS) return null
        if (!Number.isFinite(v?.part)) return null
        return Math.min(Math.max(0, v.part), Math.max(0, totalParts - 1))
    } catch {
        return null
    }
}

function ListeningExamComponent() {
    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const uid = user?.id ? String(user.id) : "anon"

    // --- URL PARAMETERS ---
    const testId = params?.id || searchParams.get("id")
    const mode = searchParams.get("mode") // "mock" yoki null
    const attemptId = searchParams.get("attemptId") // Mock urinish ID si

    // --- STATE ---
    const [test, setTest] = useState<ListeningExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [hasStarted, setHasStarted] = useState<boolean>(() => {
        if (typeof window !== "undefined" && testId) {
            return (
                localStorage.getItem(`listening-${testId}-started`) === "true" ||
                !!localStorage.getItem(`listening-session-${testId}`)
            )
        }
        return false
    })

    const [currentQuestion, setCurrentQuestion] = useState<number>(1)
    const [activePartIndex, setActivePartIndex] = useState(0)

    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [answered, setAnswered] = useState<Record<string, boolean>>({})
    const answersRef = useRef<Record<string, string>>({})
    const lockedRef = useRef(false)

    // "reading" fazasi YO'Q: o'qish vaqti audioning ichida. "ending" ham yo'q: "end of part" ham audio ichida.
    const [status, setStatus] = useState<"reading" | "playing" | "ending" | "finished">("playing")
    const [fontSize, setFontSize] = useState(18)
    const [volume, setVolume] = useState(80)
    // UMUMIY audio vaqti: sidebar `duration - current` bilan orqaga sanaydi (oxirgi 15 soniya qizil)
    const [audioTime, setAudioTime] = useState({ current: 0, duration: 0 })
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)

    // ----------------------------------------------------
    // 1. DATA FETCHING & SESSION RECOVERY
    // ----------------------------------------------------
    useEffect(() => {
        if (!testId) {
            setLoading(false)
            return
        }

        let alive = true
        const fetchExam = async () => {
            try {
                setLoading(true)
                const response: any = await getListeningExamByIdAPI(testId)
                if (!alive) return
                const rawData = response?.data || response

                if (!rawData) throw new Error("Ma'lumot topilmadi")

                const formattedData: ListeningExam = {
                    id: String(rawData.id || rawData._id),
                    title: rawData.title || "Listening Test",
                    isDemo: rawData.is_demo ?? false,
                    isFree: rawData.is_free ?? false,
                    sections: rawData.sections || "Listening",
                    level: rawData.level || "Medium",
                    duration: rawData.duration || 30,
                    totalQuestions: rawData.total_questions || 0,
                    audioMode: rawData.audio_mode === "EXAM" ? "EXAM" : "PARTS",
                    audioUrl: resolveAudioUrl(rawData.audio_url || "") || null,
                    parts: Array.isArray(rawData.parts)
                        ? rawData.parts.map((p: any) => ({
                              id: String(p.id),
                              partNumber: p.part_number,
                              title: p.title,
                              instruction: p.instruction,
                              taskType: p.task_type,
                              audioLabel: resolveAudioUrl(p.audio_url || p.audio_label || "") || "",
                              audioStartSeconds: p.audio_start_seconds ?? null,
                              audioEndSeconds: p.audio_end_seconds ?? null,
                              context: p.context,
                              passage: p.passage,
                              mapImage: p.map_image ? resolveAudioUrl(p.map_image) : undefined,
                              options: normalizeOptions(p.options),
                              questions: Array.isArray(p.questions)
                                  ? p.questions.map((q: any) => ({
                                        id: String(q.id),
                                        questionNumber: q.question_number,
                                        type: q.type,
                                        question: q.question ?? q.text ?? q.prompt ?? q.question_text ?? q.title ?? q.content ?? "",
                                        correctAnswer: q.correct_answer || "",
                                        options: normalizeOptions(q.options),
                                    }))
                                  : [],
                          }))
                        : [],
                }

                setTest(formattedData)

                const savedSession = localStorage.getItem(`listening-session-${testId}`)
                const pendingRetry = mode === "mock" && isExamLocked(uid, "listening", testId)
                if (pendingRetry) lockedRef.current = true
                if (savedSession) {
                    try {
                        const parsed = JSON.parse(savedSession)
                        setAnswers(parsed.answers || {})
                        setAnswered(parsed.answered || {})
                        answersRef.current = parsed.answers || {}
                        setActivePartIndex(parsed.activePartIndex || 0)
                        setHasStarted(true)
                        if (pendingRetry) {
                            setStatus("finished")
                            setIsFinishModalOpen(true)
                        }
                    } catch {}
                }

                // Audio qaysi partda qolgan bo'lsa, shu partdan davom etamiz (session'dagi activePartIndex'dan aniqroq:
                // u har soniyada va sahifadan chiqib ketganda ham yoziladi). Audio pozitsiyasini content o'zi tiklaydi.
                const wasStarted = localStorage.getItem(`listening-${testId}-started`) === "true"
                if (savedSession || wasStarted) {
                    const savedPart = readSavedAudioPart(formattedData.id, formattedData.parts.length)
                    if (savedPart != null) {
                        setActivePartIndex(savedPart)
                        const first = Number(formattedData.parts[savedPart]?.questions?.[0]?.questionNumber)
                        if (first) setCurrentQuestion(first)
                    }
                }
            } catch (err: any) {
                if (alive) setError(err?.message || "Testni yuklab bo'lmadi.")
            } finally {
                if (alive) setLoading(false)
            }
        }
        fetchExam()
        return () => {
            alive = false
        }
    }, [testId, uid, mode])

    // ----------------------------------------------------
    // 2. FINISH LOGIC (MOCK & SINGLE)
    // ----------------------------------------------------
    const handleFinish = useCallback(async () => {
        if (!testId || isSubmitting || !test) return

        setIsSubmitting(true)
        lockedRef.current = true

        try {
            if (mode === "mock" && typeof document !== "undefined" && document.fullscreenElement) {
                await document.exitFullscreen().catch(() => {})
            }

            // Map question id -> question_number for backend compatibility
            const formattedUserAnswers: Record<string, string> = {}
            for (const part of test.parts) {
                for (const q of part.questions) {
                    const val = answersRef.current[String(q.id)]
                    if (val !== undefined && val.trim() !== "") {
                        formattedUserAnswers[String(q.questionNumber)] = val.trim()
                    }
                }
            }
            for (const [k, v] of Object.entries(answersRef.current) as [string, string][]) {
                if (v && v.trim() !== "" && !formattedUserAnswers[k]) {
                    formattedUserAnswers[k] = v.trim()
                }
            }

            await submitListeningExamAPI({
                exam_id: testId,
                user_answers: formattedUserAnswers,
                exam_attempt_id: attemptId ? Number(attemptId) : null,
            })

            if (mode === "mock") lockExam(uid, "listening", testId)
            // Avval "finished": content unmount bo'lganda audio pozitsiyasini qayta yozib yubormasligi uchun
            setStatus("finished")
            localStorage.removeItem(`listening-session-${testId}`)
            localStorage.removeItem(`listening-${testId}-started`)
            localStorage.removeItem(audioKey(test.id))

            if (mode === "mock" && attemptId) {
                try {
                    await pullMockSkillResultAPI(Number(attemptId), "LISTENING")
                } catch (e) {
                    console.error("Listening pull error:", e)
                }
            }
            toast.success("Listening imtihoni yakunlandi!")
            router.push(mode === "mock" ? "/dashboard" : "/dashboard/listening")
        } catch (err: any) {
            console.error("Listening submit error:", err)
            toast.error(err?.message || "Natijani saqlashda xatolik yuz berdi.")
            lockedRef.current = false
            setIsSubmitting(false)
            setStatus("playing")
        }
    }, [testId, test, mode, attemptId, isSubmitting, router, uid])

    // Javoblar va joriy part session'ga yoziladi (audio pozitsiyasini content o'zi `listening-audio` kalitida saqlaydi)
    useEffect(() => {
        if (!testId || !hasStarted || status === "finished") return
        const timer = setTimeout(() => {
            localStorage.setItem(
                `listening-session-${testId}`,
                JSON.stringify({
                    answers,
                    answered,
                    activePartIndex,
                })
            )
        }, 500)
        return () => clearTimeout(timer)
    }, [answers, answered, activePartIndex, status, hasStarted, testId])

    // Content soniyasiga ~4 marta chaqiradi: faqat soniya o'zgarganda render qilamiz
    const handleTimeUpdate = useCallback((current: number, duration: number) => {
        const d = Number.isFinite(duration) ? duration : 0
        setAudioTime((p) => (Math.floor(p.current) === Math.floor(current) && p.duration === d ? p : { current, duration: d }))
    }, [])

    const firstQuestionOf = useCallback(
        (index: number) => Number(test?.parts?.[index]?.questions?.[0]?.questionNumber) || 1,
        [test]
    )

    // Audio o'zi partni almashtirdi (full-audio rejimida part chegarasidan o'tildi): audio DAVOM etadi, faqat tab/savollar o'zgaradi
    const handleAudioPartChange = useCallback(
        (index: number) => {
            if (!test || index < 0 || index >= test.parts.length) return
            setActivePartIndex(index)
            setCurrentQuestion(firstQuestionOf(index))
        },
        [test, firstQuestionOf]
    )

    // Part-by-part rejimida part audiosi tugadi: keyingi part darhol boshlanadi (o'qish pauzasi audio ichida)
    const handleNextPart = useCallback(() => {
        if (!test) return
        if (activePartIndex < test.parts.length - 1) {
            const next = activePartIndex + 1
            setActivePartIndex(next)
            setCurrentQuestion(firstQuestionOf(next))
            setStatus("playing")
        } else {
            setIsFinishModalOpen(true)
        }
    }, [test, activePartIndex, firstQuestionOf])

    // Butun imtihon audiosi tugadi (full-audio rejimi)
    const handleAudioFinished = useCallback(() => setIsFinishModalOpen(true), [])

    // Qismlar orasida erkin o'tish (faqat part-by-part rejimida; full-audio'da content tablarni bloklaydi)
    const handleSelectPart = useCallback((index: number) => {
        if (!test || index === activePartIndex || index < 0 || index >= test.parts.length) return
        setActivePartIndex(index)
        setStatus("playing")
        setCurrentQuestion(firstQuestionOf(index))
    }, [test, activePartIndex, firstQuestionOf])

    const handleAnswer = useCallback((questionId: string | number, value: string) => {
        if (lockedRef.current) return
        const idStr = String(questionId)
        setAnswers((prev) => ({ ...prev, [idStr]: value }))
        setAnswered((prev) => ({ ...prev, [idStr]: !!value.trim() }))
        answersRef.current[idStr] = value
    }, [])

    const handleStartExam = () => {
        if (!testId || !test) return
        // Yangi urinish: oldingi urinishdan qolgan audio pozitsiyasi bilan o'rtada boshlanib qolmasin
        try { localStorage.removeItem(audioKey(test.id)) } catch {}
        localStorage.setItem(`listening-${testId}-started`, "true")
        setStatus("playing")
        setHasStarted(true)
    }

    // ----------------------------------------------------
    // 3. RENDER LOGIC
    // ----------------------------------------------------
    const activePart = test?.parts?.[activePartIndex]
    const sidebarQuestions = useMemo(
        () => (activePart?.questions || []).map((q) => ({ id: String(q.id), number: Number(q.questionNumber) })),
        [activePart]
    )

    const totalQuestions = useMemo(() => {
        if (!test) return 0
        return test.parts.reduce((sum, p) => sum + (p.questions?.length || 0), 0)
    }, [test])

    if (!testId) {
        return (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-6 bg-background">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold">Xatolik: Test ID topilmadi</h2>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-foreground mr-2" />
                <span className="font-semibold text-muted-foreground">Test yuklanmoqda...</span>
            </div>
        )
    }

    if (error || !test) {
        return (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center bg-background text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Xatolik yuz berdi</h2>
                <p className="text-muted-foreground mb-6">{error || "Test topilmadi"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-foreground text-white rounded-xl font-semibold hover:bg-black transition"
                >
                    Orqaga
                </button>
            </div>
        )
    }

    // --- INTRO / START SCREEN ---
    if (!hasStarted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
                <div className="w-full max-w-xl bg-white border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-foreground text-white flex items-center justify-center shadow-lg shrink-0">
                            <Headphones className="size-7" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {test.level || "CEFR"} · Tinglab tushunish
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate" title={test.title}>
                                {test.title}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-border text-center">
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Qismlar</div>
                            <div className="text-lg font-bold text-foreground">{test.parts.length} ta</div>
                        </div>
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Savollar</div>
                            <div className="text-lg font-bold text-foreground">{totalQuestions} ta</div>
                        </div>
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Vaqt</div>
                            <div className="text-lg font-bold text-foreground">{test.duration || 35} daqiqa</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground bg-background p-4 rounded-2xl border border-border">
                        <div className="font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="size-4 text-foreground" />
                            Imtihon qoidalari:
                        </div>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                            <li>Quloqchinlarni (naushnik) taqib, ovoz yaxshi eshitilayotganini tekshiring.</li>
                            <li>Har bir qism boshlanishidan oldin savollarni ko&apos;rib chiqish uchun vaqt ajratiladi.</li>
                            <li>Audio yakunlangandan so&apos;ng javoblarni kiritish uchun qo&apos;shimcha vaqt beriladi.</li>
                            <li>Imtihon to&apos;liq ekran rejimida o&apos;tkaziladi. Sahifadan chiqmang.</li>
                        </ul>
                    </div>

                    <PreflightStart needs={{ mic: 'optional', speaker: true, fullscreen: mode === "mock" }} onBack={() => router.push(mode === "mock" ? "/dashboard" : "/dashboard/listening")} onStart={handleStartExam} />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-40 flex h-dvh min-h-dvh w-full flex-col overflow-hidden select-none bg-background">
            <ListeningTopBar partNumber={activePart?.partNumber || activePartIndex + 1} />
            <div className="flex flex-1 min-h-0 flex-row overflow-hidden">
                <main className="flex-1 min-w-0 overflow-hidden relative">
                    <ListeningExamContent
                        examData={test}
                        currentQuestion={currentQuestion}
                        answers={answers}
                        status={status}
                        activePartIndex={activePartIndex}
                        fontSize={fontSize}
                        volume={volume}
                        onAnswer={handleAnswer}
                        onSelectQuestion={setCurrentQuestion}
                        onTimeUpdate={handleTimeUpdate}
                        onNextPart={handleNextPart}
                        onFinish={handleAudioFinished}
                        onSelectPart={handleSelectPart}
                        onAudioPartChange={handleAudioPartChange}
                        initialTime={0}
                    />
                </main>
                <ListeningExamSidebar
                    cameraEnabled={mode === "mock"}
                    questions={sidebarQuestions}
                    answered={answered}
                    currentQuestion={currentQuestion}
                    partNumber={activePart?.partNumber || activePartIndex + 1}
                    timeLeft="--:--"
                    audioCurrent={audioTime.current}
                    audioDuration={audioTime.duration}
                    volume={volume}
                    onVolumeChange={setVolume}
                    onSelectQuestion={setCurrentQuestion}
                    onFinish={() => setIsFinishModalOpen(true)}
                    onIncreaseFontSize={() => setFontSize((s) => Math.min(s + 2, 30))}
                    onDecreaseFontSize={() => setFontSize((s) => Math.max(s - 2, 12))}
                />
            </div>

            {/* FINISH MODAL */}
            {isFinishModalOpen && test && (
                <ListeningFinishModal
                    parts={test.parts}
                    answers={answers}
                    activePartIndex={activePartIndex}
                    isSubmitting={isSubmitting}
                    onConfirm={handleFinish}
                    onCancel={() => {
                        if (!lockedRef.current) setIsFinishModalOpen(false)
                    }}
                    onJump={(n) => {
                        setCurrentQuestion(n)
                        setIsFinishModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default function ListeningPracticePage() {
    return (
        <Suspense
            fallback={
                <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-foreground mr-2" />
                    <span className="font-semibold text-muted-foreground">Yuklanmoqda...</span>
                </div>
            }
        >
            <ListeningExamComponent />
        </Suspense>
    )
}