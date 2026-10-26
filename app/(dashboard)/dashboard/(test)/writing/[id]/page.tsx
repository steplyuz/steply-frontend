"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import WritingExamContent from "@/components/cefr-exam/writing/writing-exam-content"
import WritingExamSidebar from "@/components/cefr-exam/writing/writing-exam-sidebar"
import WritingTopBar from "@/components/cefr-exam/writing/writing-top-bar"
import WritingFinishModal from "@/components/cefr-exam/writing/writing-finish-modal"
import { writingApi } from "@/lib/api"
import type { WritingExam, WritingResult } from "@/lib/api/types"
import { Loader2, AlertCircle, PenTool } from "lucide-react"
import { toast } from "sonner"
import { PreflightStart } from "@/components/exam/preflight"
import { useAuth } from "@/lib/auth/auth-context"
import { clearDeadline, getOrCreateDeadline, isExamLocked, lockExam, remainingSeconds } from "@/lib/exam-lock"
import Link from "next/link"

const FONT_SIZE = 17
const LOW_TIME_SECONDS = 300

// mm:ss (1 soatdan ko'p bo'lsa h:mm:ss)
function formatTime(total: number) {
    const s = Math.max(0, Math.floor(total))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const mm = String(m).padStart(2, "0")
    const ss = String(sec).padStart(2, "0")
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function WritingExamComponent() {
    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const uid = user?.id ? String(user.id) : "anon"

    const testId = params?.id || searchParams.get("id")

    const [test, setTest] = useState<WritingExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [activeTaskIndex, setActiveTaskIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const answersRef = useRef<Record<number, string>>({})

    const [hasStarted, setHasStarted] = useState<boolean>(() => {
        if (typeof window !== "undefined" && testId) {
            return localStorage.getItem(`writing-${testId}-started`) === "true"
        }
        return false
    })

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<WritingResult | null>(null)

    const isExamFinished = useRef(false)
    const [finalizing, setFinalizing] = useState(false)
    const expiredRef = useRef(false)
    const timeoutSubmitAttempted = useRef(false)
    const deadlineRef = useRef<number | null>(null)
    const lowTimeWarned = useRef(false)

    // Data Fetching
    useEffect(() => {
        if (!testId) return
        let alive = true

        const fetchExam = async () => {
            setLoading(true)
            try {
                const examData = await writingApi.get(testId)
                if (!alive) return
                setTest(examData)

                const sessionStarted = localStorage.getItem(`writing-${testId}-started`) === "true"
                if (sessionStarted) {
                    setHasStarted(true)
                    const savedAnswers = localStorage.getItem(`writing-${testId}-answers`)
                    if (savedAnswers) {
                        try {
                            const parsed = JSON.parse(savedAnswers)
                            setAnswers(parsed)
                            answersRef.current = parsed
                        } catch { }
                    }
                    const savedTime = parseInt(localStorage.getItem(`writing-${testId}-time`) || "", 10)
                    const duration = (examData.duration_minutes || 45) * 60
                    const dl = getOrCreateDeadline(
                        uid,
                        "writing",
                        testId,
                        duration,
                        Number.isFinite(savedTime) ? savedTime : undefined
                    )
                    deadlineRef.current = dl
                    const remaining = remainingSeconds(dl)
                    if (remaining <= 0) expiredRef.current = true
                    if (isExamLocked(uid, "writing", testId)) {
                        expiredRef.current = true
                        setFinalizing(true)
                    }
                    setTimeLeft(remaining)
                } else {
                    setTimeLeft((examData.duration_minutes || 45) * 60)
                }
            } catch (err: any) {
                if (alive) setError(err?.message || "Writing topshirig'ini yuklab bo'lmadi")
            } finally {
                if (alive) setLoading(false)
            }
        }

        fetchExam()
        return () => {
            alive = false
        }
    }, [testId, uid])

    // Finish / Submit logic
    const handleFinish = useCallback(async () => {
        if (!testId || isExamFinished.current || isSubmitting || !test) return

        setIsSubmitting(true)
        isExamFinished.current = true
        expiredRef.current = true
        setFinalizing(true)
        lockExam(uid, "writing", testId)

        try {
            const formattedAnswers = test.tasks.map((task, i) => {
                const tId = task.id ?? i
                return {
                    task_id: tId,
                    content: (answersRef.current[tId] || "").trim(),
                }
            })

            const response = await writingApi.submit(test.id, {
                answers: formattedAnswers,
            })

            lockExam(uid, "writing", testId)
            clearDeadline(uid, "writing", testId)
            localStorage.removeItem(`writing-${testId}-started`)
            localStorage.removeItem(`writing-${testId}-answers`)
            localStorage.removeItem(`writing-${testId}-time`)

            toast.success("Writing imtihoni yakunlandi!")
            setResult(response)
            router.replace(`/dashboard/writing/results/${response.id}`)
        } catch (err: any) {
            console.error("Writing submit error:", err)
            toast.error(err?.message || "Natijani yuborishda xatolik yuz berdi")
            setIsSubmitting(false)
            isExamFinished.current = false
            setFinalizing(false)
            // Vaqt tugagan bo'lsa ham qayta urinish mumkin bo'lsin
            timeoutSubmitAttempted.current = false
        }
    }, [testId, test, isSubmitting, uid, router])

    // Timer logic
    const timerReady = timeLeft !== null
    useEffect(() => {
        if (!testId || !timerReady || !test || !hasStarted || isExamFinished.current || result) return
        const interval = setInterval(() => {
            const dl = deadlineRef.current
            const remain = dl ? remainingSeconds(dl) : 0
            setTimeLeft(remain)
            localStorage.setItem(`writing-${testId}-time`, remain.toString())

            if (remain > 0 && remain <= LOW_TIME_SECONDS && !lowTimeWarned.current) {
                lowTimeWarned.current = true
                toast.warning("Vaqt tugashiga 5 daqiqa qoldi")
            }

            if (remain <= 0) {
                clearInterval(interval)
                expiredRef.current = true
                if (!timeoutSubmitAttempted.current) {
                    timeoutSubmitAttempted.current = true
                    handleFinish()
                }
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [test, timerReady, hasStarted, testId, handleFinish, result])

    const handleStartExam = () => {
        if (!testId || !test) return
        localStorage.setItem(`writing-${testId}-started`, "true")
        const duration = (test.duration_minutes || 45) * 60
        const dl = getOrCreateDeadline(uid, "writing", testId, duration)
        deadlineRef.current = dl
        setTimeLeft(remainingSeconds(dl))
        setHasStarted(true)
    }

    const handleAnswer = useCallback(
        (taskId: number, value: string) => {
            if (expiredRef.current) return
            const next = { ...answersRef.current, [taskId]: value }
            answersRef.current = next
            setAnswers(next)
            try {
                localStorage.setItem(`writing-${testId}-answers`, JSON.stringify(next))
            } catch { }
        },
        [testId]
    )

    const tasks = useMemo(() => test?.tasks ?? [], [test])

    if (!testId) {
        return (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-background p-6">
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold">Xatolik: Test ID topilmadi</h2>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center bg-background">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-foreground" />
                <span className="font-semibold text-muted-foreground">Writing topshirig&apos;i yuklanmoqda...</span>
            </div>
        )
    }

    if (error || !test) {
        return (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-background p-6 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h2 className="mb-2 text-xl font-bold">Xatolik yuz berdi</h2>
                <p className="mb-6 text-muted-foreground">{error || "Test topilmadi"}</p>
                <button
                    onClick={() => router.back()}
                    className="rounded-xl bg-foreground px-6 py-3 font-semibold text-white transition hover:bg-black"
                >
                    Orqaga
                </button>
            </div>
        )
    }

    // Natija baholash moduliga o'tkaziladi (AI tekshiruv, PDF, o'qituvchi bahosi).
    if (result) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <Loader2 className="size-7 animate-spin text-foreground" />
                <p className="font-semibold text-foreground">Javoblaringiz qabul qilindi</p>
                <Link
                    href={`/dashboard/writing/results/${result.id}`}
                    className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                    Natijaga o&apos;tish
                </Link>
            </div>
        )
    }

    // Start / Readiness screen
    if (!hasStarted) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background p-4 sm:p-6">
                <div className="w-full max-w-xl space-y-6 rounded-3xl border border-border bg-white p-6 shadow-xl sm:p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-white shadow-lg">
                            <PenTool className="size-7" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {test.cefr_level || "CEFR"} · Yozish bo&apos;limi
                            </span>
                            <h1 className="truncate text-xl font-extrabold text-foreground sm:text-2xl" title={test.title}>
                                {test.title}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-border py-4 text-center">
                        <div className="rounded-2xl bg-background p-3">
                            <div className="text-xs font-medium text-muted-foreground">Topshiriqlar</div>
                            <div className="text-lg font-bold text-foreground">{tasks.length} ta</div>
                        </div>
                        <div className="rounded-2xl bg-background p-3">
                            <div className="text-xs font-medium text-muted-foreground">Vaqt</div>
                            <div className="text-lg font-bold text-foreground">{test.duration_minutes || 45} daqiqa</div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                        <div className="font-bold text-foreground">Imtihon haqida:</div>
                        <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                            <li>To&apos;liq ekran rejimi va kamera majburiy emas.</li>
                            <li>Javoblar yozish davomida ushbu qurilmada saqlanadi.</li>
                            <li>Vaqt tugaganda kiritilgan javoblar avtomatik yuboriladi.</li>
                            <li>Javob yozilmagan topshiriqlar bo&apos;sh javob sifatida saqlanadi.</li>
                        </ul>
                    </div>

                    <PreflightStart
                        needs={{ mic: "optional" }}
                        onBack={() => router.push("/dashboard/writing")}
                        onStart={handleStartExam}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-40 flex h-full w-full flex-col overflow-hidden bg-background">
            <WritingTopBar
                title={test.title}
                timeLeft={timeLeft === null ? "--:--" : formatTime(timeLeft)}
                isLowTime={timeLeft !== null && timeLeft <= LOW_TIME_SECONDS}
                onFinish={() => setIsFinishModalOpen(true)}
            />

            <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
                <main className="relative min-w-0 flex-1 overflow-hidden">
                    <WritingExamContent
                        tasks={tasks}
                        activeTaskIndex={activeTaskIndex}
                        onSelectTask={setActiveTaskIndex}
                        answers={answers}
                        onAnswer={handleAnswer}
                        fontSize={FONT_SIZE}
                    />
                </main>

                <WritingExamSidebar
                    tasks={tasks}
                    activeTaskIndex={activeTaskIndex}
                    onSelectTask={setActiveTaskIndex}
                    answers={answers}
                />
            </div>

            {/* Finish Modal */}
            {isFinishModalOpen && !finalizing && (
                <WritingFinishModal
                    tasks={tasks}
                    answers={answers}
                    isSubmitting={isSubmitting}
                    onConfirm={handleFinish}
                    onCancel={() => setIsFinishModalOpen(false)}
                    onJump={(idx) => {
                        setActiveTaskIndex(idx)
                        setIsFinishModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default function WritingPracticePage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full min-h-[60vh] items-center justify-center bg-background">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin text-foreground" />
                    <span className="font-semibold text-muted-foreground">Yuklanmoqda...</span>
                </div>
            }
        >
            <WritingExamComponent />
        </Suspense>
    )
}