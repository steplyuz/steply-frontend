"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import ReadingExamContent from "@/components/cefr-exam/reading/reading-exam-content"
import ReadingExamSidebar from "@/components/cefr-exam/reading/reading-exam-sidebar"
import ReadingTopBar from "@/components/cefr-exam/reading/reading-top-bar"
import ReadingFinishModal, { type NavGroup } from "@/components/cefr-exam/reading/reading-finish-modal"
import {
    attemptAnswersToMap,
    finishReadingAttemptAPI,
    getReadingAttemptAPI,
    getReadingExamByIdAPI,
    saveReadingAnswerAPI,
    startReadingAttemptAPI,
    submitReadingExamAPI,
} from "@/lib/cefr-api/reading"
import { pullMockSkillResultAPI } from "@/lib/cefr-api/mock"
import type { ReadingExam } from "@/lib/cefr-types/reading"
import { Loader2, AlertCircle, Maximize, BookOpen, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PreflightStart } from "@/components/exam/preflight"
import { useAuth } from "@/lib/auth/auth-context"
import { clearDeadline, getOrCreateDeadline, isExamLocked, lockExam, readingPracticeMinutes, remainingSeconds, serverRemainingSeconds } from "@/lib/exam-lock"

const SAVE_DEBOUNCE_MS = 600

function ReadingExamComponent() {
    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const uid = user?.id ? String(user.id) : "anon"

    // --- URL PARAMETERS ---
    const testId = params?.id || searchParams.get("id")
    const mode = searchParams.get("mode") // "mock" yoki null
    const attemptId = searchParams.get("attemptId") // Mock urinish ID si
    const isPractice = mode !== "mock"
    const attemptKey = testId ? `reading-${testId}-attempt` : ""

    // --- STATE ---
    const [test, setTest] = useState<ReadingExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [currentVirtualId, setCurrentVirtualId] = useState<number>(1)
    const [idMap, setIdMap] = useState<Record<number, number>>({})
    const [revMap, setRevMap] = useState<Record<number, number>>({})
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [answered, setAnswered] = useState<Record<number, boolean>>({})
    const [starting, setStarting] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)

    const [hasStarted, setHasStarted] = useState<boolean>(() => {
        if (typeof window !== "undefined" && testId) {
            return localStorage.getItem(`reading-${testId}-started`) === "true"
        }
        return false
    })

    const answersRef = useRef<Record<number, string>>({})
    const [fontSize, setFontSize] = useState(18)
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
    const isExamFinished = useRef(false)
    const [finalizing, setFinalizing] = useState(false)
    const expiredRef = useRef(false)
    const serverExpiredRef = useRef(false)
    const deadlineRef = useRef<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fsLost, setFsLost] = useState(false)
    const lowTimeWarned = useRef(false)
    // Vaqt tugaganda avtomatik yuborish faqat BIR marta (xato bo'lsa, tugma orqali qo'lda qayta uriniladi)
    const autoSubmitRef = useRef(false)

    // --- Practice: serverdagi urinish va javoblarni saqlash navbati ---
    const attemptIdRef = useRef<number | null>(null)
    const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
    const pendingSaves = useRef<Record<number, string>>({})
    const saveErrorShown = useRef(false)

    const clearLocalSession = useCallback(() => {
        if (!testId) return
        clearDeadline(uid, "reading", testId)
        localStorage.removeItem(`reading-${testId}-started`)
        localStorage.removeItem(`reading-${testId}-answers`)
        localStorage.removeItem(`reading-${testId}-time`)
        localStorage.removeItem(`reading-${testId}-attempt`)
    }, [testId, uid])

    const flushOne = useCallback(async (qid: number) => {
        const aid = attemptIdRef.current
        const value = pendingSaves.current[qid]
        if (!aid || value === undefined) return
        delete pendingSaves.current[qid]
        try {
            await saveReadingAnswerAPI(aid, qid, value)
            saveErrorShown.current = false
        } catch (err: any) {
            // Muvaffaqiyatsiz bo'lsa, qiymat navbatda qoladi (keyingi saqlash yoki yakunlashda qayta uriniladi)
            if (pendingSaves.current[qid] === undefined) pendingSaves.current[qid] = value
            console.error("Reading save answer error:", err)
            if (!saveErrorShown.current) {
                saveErrorShown.current = true
                toast.error(err?.message || "Javob serverga saqlanmadi. Internetni tekshiring.")
            }
        }
    }, [])

    const scheduleSave = useCallback((qid: number, value: string) => {
        if (!attemptIdRef.current) return
        pendingSaves.current[qid] = value
        if (saveTimers.current[qid]) clearTimeout(saveTimers.current[qid])
        saveTimers.current[qid] = setTimeout(() => {
            delete saveTimers.current[qid]
            void flushOne(qid)
        }, SAVE_DEBOUNCE_MS)
    }, [flushOne])

    const flushAllSaves = useCallback(async () => {
        Object.values(saveTimers.current).forEach(clearTimeout)
        saveTimers.current = {}
        await Promise.all(Object.keys(pendingSaves.current).map((k) => flushOne(Number(k))))
    }, [flushOne])

    useEffect(() => {
        const timers = saveTimers
        return () => {
            Object.values(timers.current).forEach(clearTimeout)
        }
    }, [])

    // --- 🏁 FINISH LOGIC (MOCK & PRACTICE) ---
    const handleFinish = useCallback(async () => {
        if (!testId || isExamFinished.current || isSubmitting) return

        const timeUp = deadlineRef.current ? remainingSeconds(deadlineRef.current) <= 0 : false

        setIsSubmitting(true)
        isExamFinished.current = true
        expiredRef.current = true
        setFinalizing(true)

        try {
            if (isPractice) {
                const aid = attemptIdRef.current
                if (!aid) throw new Error("Urinish topilmadi. Sahifani yangilab, testni qaytadan boshlang.")
                await flushAllSaves()
                if (Object.keys(pendingSaves.current).length > 0 && !timeUp && !serverExpiredRef.current) {
                    throw new Error("Ba'zi javoblar serverga saqlanmadi. Internetni tekshirib, qayta urinib ko'ring.")
                }
                await finishReadingAttemptAPI(aid)
            } else {
                const finalAnswers = { ...answersRef.current }
                const formattedAnswersArray = Object.entries(finalAnswers).map(([dbId, value]) => ({
                    question_id: Number(dbId),
                    question_number: revMap[Number(dbId)] ?? undefined,
                    answers: Array.isArray(value) ? (value as string[]).map(String) : [String(value)],
                }))
                await submitReadingExamAPI(String(testId), {
                    answers: formattedAnswersArray,
                    exam_attempt_id: attemptId ? Number(attemptId) : null,
                })
            }

            if (mode === "mock" && typeof document !== "undefined" && document.fullscreenElement) {
                await document.exitFullscreen().catch(() => {})
            }
            if (mode === "mock") lockExam(uid, "reading", testId)
            clearLocalSession()

            if (mode === "mock" && attemptId) {
                try {
                    await pullMockSkillResultAPI(Number(attemptId), "READING")
                } catch (e) {
                    console.error("Reading pull error:", e)
                }
            }
            toast.success("Reading imtihoni yakunlandi!")
            router.push(mode === "mock" ? "/dashboard" : "/dashboard/reading")
        } catch (err: any) {
            console.error("Reading submit error:", err)
            toast.error(err?.message || "Natijani saqlashda xatolik yuz berdi")
            setIsSubmitting(false)
            isExamFinished.current = false
            // Vaqt hali tugamagan bo'lsa, javoblarni tahrirlashga ruxsat beramiz
            expiredRef.current = timeUp || serverExpiredRef.current
            setFinalizing(false)
        }
    }, [testId, mode, attemptId, isSubmitting, isPractice, router, uid, revMap, flushAllSaves, clearLocalSession])

    // --- 📥 DATA FETCHING ---
    useEffect(() => {
        if (!testId) return

        let alive = true
        const fetchExam = async () => {
            setLoading(true)
            try {
                const response = await getReadingExamByIdAPI(testId)
                if (!alive) return
                const examData = response.data
                setTest(examData)

                const mapping: Record<number, number> = {}
                const reverseMapping: Record<number, number> = {}
                let counter = 1

                examData.parts.forEach((part: any) => {
                    part.questions.forEach((q: any) => {
                        const dbId = Number(q.id)
                        mapping[counter] = dbId
                        reverseMapping[dbId] = counter
                        counter++
                    })
                })

                setIdMap(mapping)
                setRevMap(reverseMapping)

                const duration = (mode === "mock" ? (examData.duration_minutes || 60) : readingPracticeMinutes(examData)) * 60
                const sessionStarted = localStorage.getItem(`reading-${testId}-started`) === "true"

                // Practice: serverdagi urinish bo'lmasa, eski mahalliy sessiya yaroqsiz — boshidan boshlaymiz
                let serverAnswers: Record<number, string> = {}
                let serverLeft: number | null = null
                let resumeOk = sessionStarted
                if (sessionStarted && mode !== "mock") {
                    const savedAttempt = Number(localStorage.getItem(`reading-${testId}-attempt`))
                    if (!savedAttempt) {
                        resumeOk = false
                    } else {
                        try {
                            const st = await getReadingAttemptAPI(savedAttempt)
                            if (!alive) return
                            if (st.status === "SUBMITTED") {
                                resumeOk = false
                            } else {
                                attemptIdRef.current = savedAttempt
                                serverAnswers = attemptAnswersToMap(st)
                                if (st.status === "EXPIRED") serverExpiredRef.current = true
                                serverLeft = serverRemainingSeconds(st)
                            }
                        } catch {
                            resumeOk = false
                        }
                    }
                    if (!resumeOk) {
                        clearLocalSession()
                        setHasStarted(false)
                    }
                }

                if (resumeOk) {
                    setHasStarted(true)
                    let local: Record<number, string> = {}
                    const savedAnswers = localStorage.getItem(`reading-${testId}-answers`)
                    if (savedAnswers) {
                        try {
                            local = JSON.parse(savedAnswers)
                        } catch {}
                    }
                    const merged: Record<number, string> = { ...local, ...serverAnswers }
                    answersRef.current = merged
                    setAnswers(merged)
                    const newAnswered: Record<number, boolean> = {}
                    Object.keys(merged).forEach((id) => (newAnswered[Number(id)] = !!merged[Number(id)]?.trim()))
                    setAnswered(newAnswered)
                    // Faqat mahalliy bo'lgan javoblarni serverga yuboramiz
                    if (mode !== "mock" && attemptIdRef.current) {
                        Object.entries(local).forEach(([id, v]) => {
                            if (serverAnswers[Number(id)] === undefined && v?.trim()) {
                                pendingSaves.current[Number(id)] = v
                            }
                        })
                        void flushAllSaves()
                    }

                    const savedTime = parseInt(localStorage.getItem(`reading-${testId}-time`) || "", 10)
                    if (mode !== "mock" && serverLeft !== null) clearDeadline(uid, "reading", testId)
                    const dl = getOrCreateDeadline(
                        uid, "reading", testId, duration,
                        serverLeft !== null ? serverLeft : Number.isFinite(savedTime) ? savedTime : undefined,
                    )
                    deadlineRef.current = dl
                    const remaining = serverExpiredRef.current ? 0 : remainingSeconds(dl)
                    if (remaining <= 0) expiredRef.current = true
                    if (mode === "mock" && isExamLocked(uid, "reading", testId)) {
                        expiredRef.current = true
                        setFinalizing(true)
                    }
                    setTimeLeft(remaining)
                } else {
                    setTimeLeft(duration)
                }
                setCurrentVirtualId(1)
            } catch (err: any) {
                if (alive) setError(err.message || "Xatolik yuz berdi")
            } finally {
                if (alive) setLoading(false)
            }
        }
        fetchExam()
        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testId, uid, mode])

    // --- ⏱️ TIMER ---
    const timerReady = timeLeft !== null
    useEffect(() => {
        if (!testId || !timerReady || !test || !hasStarted || isExamFinished.current) return
        const interval = setInterval(() => {
            const dl = deadlineRef.current
            const remain = serverExpiredRef.current ? 0 : dl ? remainingSeconds(dl) : 0
            setTimeLeft(remain)
            localStorage.setItem(`reading-${testId}-time`, remain.toString())
            if (remain <= 0) {
                clearInterval(interval)
                expiredRef.current = true
                // Faqat bir marta avtomatik yuboramiz: aks holda xato bo'lsa effekt qayta ishga tushib,
                // har soniyada submit takrorlanadi.
                if (!autoSubmitRef.current) {
                    autoSubmitRef.current = true
                    handleFinish()
                }
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [test, timerReady, hasStarted, testId, handleFinish])

    // --- 🛡️ BROWSER PROTECTION ---
    useEffect(() => {
        if (!hasStarted || mode !== "mock") return
        const preventDefault = (e: BeforeUnloadEvent) => {
            if (!isExamFinished.current) {
                e.preventDefault()
                e.returnValue = ""
            }
        }
        window.history.pushState(null, "", window.location.href)
        const handlePopState = () => {
            if (!isExamFinished.current) window.history.pushState(null, "", window.location.href)
        }
        window.addEventListener("beforeunload", preventDefault)
        window.addEventListener("popstate", handlePopState)
        return () => {
            window.removeEventListener("beforeunload", preventDefault)
            window.removeEventListener("popstate", handlePopState)
        }
    }, [hasStarted, mode])

    // --- 🖥️ TO'LIQ EKRAN NAZORATI ---
    useEffect(() => {
        if (!hasStarted || mode !== "mock") return
        const onFs = () => {
            if (!document.fullscreenElement && !isExamFinished.current) setFsLost(true)
            else setFsLost(false)
        }
        const onVisibility = () => {
            if (document.visibilityState === "hidden" && !isExamFinished.current) {
                toast.warning("Imtihon oynasidan chiqmang! Bu qoidabuzarlik hisoblanadi.", { id: "visibility-warning" })
            }
        }
        if (!document.fullscreenElement) setFsLost(true)
        document.addEventListener("fullscreenchange", onFs)
        document.addEventListener("visibilitychange", onVisibility)
        return () => {
            document.removeEventListener("fullscreenchange", onFs)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [hasStarted, mode])

    // Vaqt tugashiga 5 daqiqa qolganda ogohlantirish
    useEffect(() => {
        if (timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && hasStarted && !lowTimeWarned.current) {
            lowTimeWarned.current = true
            toast.warning("Vaqt tugashiga 5 daqiqa qoldi!")
        }
    }, [timeLeft, hasStarted])

    const returnToFullscreen = () => {
        document.documentElement.requestFullscreen?.().then(() => setFsLost(false)).catch(() => setFsLost(false))
    }

    const handleStartExam = async () => {
        if (!testId || !test || starting) return

        const baseDuration = (mode === "mock" ? (test.duration_minutes || 60) : readingPracticeMinutes(test)) * 60
        let duration = baseDuration

        if (isPractice) {
            // Practice: urinish serverda boshlanadi. Test/tarif/limit xatolari ENDI shu yerda chiqadi,
            // imtihon tugagandan keyin emas.
            setStarting(true)
            setStartError(null)
            try {
                const st = await startReadingAttemptAPI(String(testId))
                attemptIdRef.current = st.attempt_id
                localStorage.setItem(attemptKey, String(st.attempt_id))
                serverExpiredRef.current = false

                const serverAnswers = attemptAnswersToMap(st)
                if (Object.keys(serverAnswers).length) {
                    answersRef.current = { ...answersRef.current, ...serverAnswers }
                    setAnswers((prev) => ({ ...prev, ...serverAnswers }))
                    setAnswered((prev) => {
                        const next = { ...prev }
                        Object.entries(serverAnswers).forEach(([id, v]) => (next[Number(id)] = !!v.trim()))
                        return next
                    })
                    localStorage.setItem(`reading-${testId}-answers`, JSON.stringify(answersRef.current))
                }
                const left = serverRemainingSeconds(st)
                if (left !== null) duration = Math.max(1, left)
            } catch (err: any) {
                const msg = err?.message || "Testni boshlab bo'lmadi"
                setStartError(msg)
                toast.error(msg)
                setStarting(false)
                return
            }
            setStarting(false)
        }

        localStorage.setItem(`reading-${testId}-started`, "true")
        // Practice: vaqtning manbai — server. Oldingi urinishdan qolgan mahalliy deadline ishlatilmasin.
        if (isPractice) clearDeadline(uid, "reading", testId)
        const dl = getOrCreateDeadline(uid, "reading", testId, duration)
        deadlineRef.current = dl
        setTimeLeft(remainingSeconds(dl))
        setHasStarted(true)
        if (mode === "mock" && typeof document !== "undefined") {
            document.documentElement.requestFullscreen?.().then(() => setFsLost(false)).catch(() => {})
        }
    }

    // Muddati o'tgan / yuborib bo'lmaydigan practice sessiyadan chiqish (mock'da ishlatilmaydi)
    const leavePractice = () => {
        if (!testId) return
        clearLocalSession()
        attemptIdRef.current = null
        router.push("/dashboard/reading")
    }

    // --- ⌨️ HANDLERS ---
    const handleAnswer = (questionId: number, value: string) => {
        if (!testId || expiredRef.current) return
        setAnswers((prev) => {
            const newAnswers = { ...prev, [questionId]: value }
            answersRef.current = newAnswers
            localStorage.setItem(`reading-${testId}-answers`, JSON.stringify(newAnswers))
            return newAnswers
        })
        setAnswered((prev) => ({ ...prev, [questionId]: !!value.trim() }))
        if (isPractice) scheduleSave(questionId, value)
    }

    const virtualAnswered = useMemo(() => {
        const result: Record<number, boolean> = {}
        Object.entries(answered).forEach(([dbId, status]) => {
            const vId = revMap[Number(dbId)]
            if (vId) result[vId] = status
        })
        return result
    }, [answered, revMap])

    const totalQuestions = Object.keys(idMap).length

    const navGroups = useMemo<NavGroup[]>(() => {
        if (!test) return []
        return test.parts.map((part, i) => ({
            label: `${i + 1}-qism`,
            numbers: part.questions.map((q) => revMap[Number(q.id)]).filter(Boolean),
        }))
    }, [test, revMap])

    const isLowTime = timeLeft !== null && timeLeft <= 300

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = s % 60
        return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`
    }

    const virtualAnswerTexts = useMemo(() => {
        const result: Record<number, string> = {}
        Object.entries(answers).forEach(([dbId, value]) => {
            const vId = revMap[Number(dbId)]
            if (vId && typeof value === "string" && value.trim()) result[vId] = value
        })
        return result
    }, [answers, revMap])

    // --- RENDER LOGIC ---
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
                            <BookOpen className="size-7" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {test.cefr_level || "CEFR"} · O&apos;qib tushunish
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
                            <div className="text-lg font-bold text-foreground">{mode === "mock" ? (test.duration_minutes || 60) : readingPracticeMinutes(test)} daqiqa</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground bg-background p-4 rounded-2xl border border-border">
                        <div className="font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="size-4 text-foreground" />
                            Imtihon qoidalari:
                        </div>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                            {mode === "mock" ? <li>Mock imtihon to&apos;liq ekran rejimida o&apos;tkaziladi.</li> : <li>Practice rejimida to&apos;liq ekran majburiy emas.</li>}
                            <li>Matnni belgilash (highlighter) va shrift o&apos;lchamini o&apos;zgartirish mumkin.</li>
                            {mode === "mock" ? <li>Sahifadan chiqib ketish yoki oynani almashtirish qat&apos;iyan taqiqlanadi.</li> : <li>Practice natijangiz saqlanadi; mashqni keyin davom ettirishingiz mumkin.</li>}
                            <li>Belgilangan vaqt tugashi bilan javoblaringiz avtomatik qabul qilinadi.</li>
                        </ul>
                    </div>

                    {startError && (
                        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <p>{startError}</p>
                        </div>
                    )}

                    {starting ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> Test boshlanmoqda...
                        </div>
                    ) : (
                        <PreflightStart needs={{ mic: 'optional', fullscreen: mode === "mock" }} onBack={() => router.push(mode === "mock" ? "/dashboard" : "/dashboard/reading")} onStart={handleStartExam} />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-40 flex h-full w-full flex-col overflow-hidden select-none bg-background">
            <ReadingTopBar title={test.title} />
            <div className="flex flex-1 min-h-0 flex-row overflow-hidden">
                <main className="flex-1 min-w-0 overflow-hidden relative">
                    <ReadingExamContent
                        examData={test}
                        currentQuestion={idMap[currentVirtualId]}
                        answered={answered}
                        answers={answers}
                        revMap={revMap}
                        onAnswer={handleAnswer}
                        onSelectQuestion={(dbId) => {
                            const vId = revMap[dbId]
                            if (vId) setCurrentVirtualId(vId)
                        }}
                        fontSize={fontSize}
                        onIncreaseFontSize={() => setFontSize((s) => Math.min(s + 2, 30))}
                        onDecreaseFontSize={() => setFontSize((s) => Math.max(s - 2, 12))}
                        onPrev={() => setCurrentVirtualId((v) => Math.max(1, v - 1))}
                        onNext={() => setCurrentVirtualId((v) => Math.min(totalQuestions, v + 1))}
                        canPrev={currentVirtualId > 1}
                        canNext={currentVirtualId < totalQuestions}
                        currentNumber={currentVirtualId}
                        totalQuestions={totalQuestions}
                    />
                </main>
                <ReadingExamSidebar
                    cameraEnabled={mode === "mock"}
                    currentQuestion={currentVirtualId}
                    totalQuestions={totalQuestions}
                    answered={virtualAnswered}
                    groups={navGroups}
                    timeLeft={formatTime(timeLeft || 0)}
                    isLowTime={isLowTime}
                    onSelectQuestion={(vId) => setCurrentVirtualId(vId)}
                    onFinish={() => setIsFinishModalOpen(true)}
                />
            </div>

            {mode === "mock" && fsLost && !isFinishModalOpen && !isExamFinished.current && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                            <Maximize className="size-7" />
                        </div>
                        <h2 className="mt-4 text-xl font-extrabold text-foreground">To&apos;liq ekran rejimi o&apos;chdi</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Imtihon to&apos;liq ekran rejimida o&apos;tkaziladi. Taymer to&apos;xtamaydi — davom etish uchun to&apos;liq ekranga qayting.
                        </p>
                        <button
                            onClick={returnToFullscreen}
                            className="mt-6 w-full rounded-full bg-foreground hover:bg-black py-3 text-sm font-bold text-white shadow-md transition"
                        >
                            To&apos;liq ekranga qaytish
                        </button>
                    </div>
                </div>
            )}

            {(timeLeft === 0 || finalizing) && hasStarted && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                            <AlertCircle className="size-7" />
                        </div>
                        <h2 className="mt-4 text-xl font-extrabold text-foreground">
                            {timeLeft === 0 ? "Vaqt tugadi" : "Bo'lim yakunlandi"}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {timeLeft === 0 ? "Bo'lim vaqti yakunlandi. " : ""}Javoblar yuboriladi, bo&apos;limni qayta ishlab bo&apos;lmaydi. Yuborilmasa, tugma orqali qayta urinib ko&apos;ring.
                        </p>
                        <button
                            onClick={() => handleFinish()}
                            disabled={isSubmitting}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground hover:bg-black py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Yuborilmoqda...
                                </>
                            ) : (
                                "Javoblarni yuborish"
                            )}
                        </button>
                        {isPractice && (
                            <button
                                onClick={leavePractice}
                                disabled={isSubmitting}
                                className="mt-3 w-full rounded-full border border-border py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Chiqish (natijasiz)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isFinishModalOpen && timeLeft !== 0 && !finalizing && (
                <ReadingFinishModal
                    groups={navGroups}
                    answered={virtualAnswered}
                    answerTexts={virtualAnswerTexts}
                    isSubmitting={isSubmitting}
                    onConfirm={() => handleFinish()}
                    onCancel={() => setIsFinishModalOpen(false)}
                    onJump={(vId) => {
                        setCurrentVirtualId(vId)
                        setIsFinishModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default function ReadingPracticePage() {
    return (
        <Suspense
            fallback={
                <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-foreground mr-2" />
                    <span className="font-semibold text-muted-foreground">Yuklanmoqda...</span>
                </div>
            }
        >
            <ReadingExamComponent />
        </Suspense>
    )
}