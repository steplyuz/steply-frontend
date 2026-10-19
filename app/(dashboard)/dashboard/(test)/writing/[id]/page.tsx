"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import WritingExamContent from "@/components/cefr-exam/writing/writing-exam-content"
import WritingExamSidebar from "@/components/cefr-exam/writing/writing-exam-sidebar"
import WritingTopBar from "@/components/cefr-exam/writing/writing-top-bar"
import WritingFinishModal from "@/components/cefr-exam/writing/writing-finish-modal"
import { writingApi } from "@/lib/api"
import type { WritingExam, WritingResult } from "@/lib/api/types"
import { Loader2, AlertCircle, PenTool, Sparkles, ArrowLeft, FileDown } from "lucide-react"
import { toast } from "sonner"
import { PreflightStart } from "@/components/exam/preflight"
import { useAuth } from "@/lib/auth/auth-context"
import { clearDeadline, getOrCreateDeadline, isExamLocked, lockExam, remainingSeconds } from "@/lib/exam-lock"
import Link from "next/link"

function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${String(sec).padStart(2, "0")}s`
}

function WritingExamComponent() {
    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()
    const uid = user?.id ? String(user.id) : "anon"

    const testId = params?.id || searchParams.get("id")
    const mode = searchParams.get("mode")

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

    const [fontSize, setFontSize] = useState(17)
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
                        } catch {}
                    }
                    const savedTime = parseInt(localStorage.getItem(`writing-${testId}-time`) || "", 10)
                    const duration = (examData.duration_minutes || 45) * 60
                    const dl = getOrCreateDeadline(uid, "writing", testId, duration, Number.isFinite(savedTime) ? savedTime : undefined)
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
                    task_id: task.id ?? i,
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
        }
    }, [testId, test, isSubmitting, uid])

    // Timer logic
    const timerReady = timeLeft !== null
    useEffect(() => {
        if (!testId || !timerReady || !test || !hasStarted || isExamFinished.current || result) return
        const interval = setInterval(() => {
            const dl = deadlineRef.current
            const remain = dl ? remainingSeconds(dl) : 0
            setTimeLeft(remain)
            localStorage.setItem(`writing-${testId}-time`, remain.toString())
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

    const handleAnswer = (taskId: number, value: string) => {
        if (expiredRef.current) return
        setAnswers((prev) => {
            const next = { ...prev, [taskId]: value }
            answersRef.current = next
            localStorage.setItem(`writing-${testId}-answers`, JSON.stringify(next))
            return next
        })
    }

    const tasks = useMemo(() => test?.tasks ?? [], [test])

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
                <span className="font-semibold text-muted-foreground">Writing topshirig&apos;i yuklanmoqda...</span>
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

    // Natija baholash moduliga o'tkaziladi (AI tekshiruv, PDF, o'qituvchi bahosi).
    if (result) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <Loader2 className="size-7 animate-spin text-foreground" />
                <p className="font-semibold text-foreground">Javoblaringiz qabul qilindi</p>
                <Link href={`/dashboard/writing/results/${result.id}`} className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Natijaga o&apos;tish
                </Link>
            </div>
        )
    }

    // Start / Readiness screen
    if (!hasStarted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
                <div className="w-full max-w-xl bg-white border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-foreground text-white flex items-center justify-center shadow-lg shrink-0">
                            <PenTool className="size-7" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {test.cefr_level || "CEFR"} · Yozish bo&apos;limi
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate" title={test.title}>
                                {test.title}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-border text-center">
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Topshiriqlar</div>
                            <div className="text-lg font-bold text-foreground">{tasks.length} ta</div>
                        </div>
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Vaqt</div>
                            <div className="text-lg font-bold text-foreground">{test.duration_minutes || 45} daqiqa</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground bg-background p-4 rounded-2xl border border-border">
                        <div className="font-bold text-foreground">Imtihon haqida:</div>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                            <li>To&apos;liq ekran rejimi va kamera majburiy emas.</li>
                            <li>Javoblar yozish davomida ushbu qurilmada saqlanadi.</li>
                            <li>Vaqt tugaganda kiritilgan javoblar avtomatik yuboriladi.</li>
                            <li>Javob yozilmagan topshiriqlar bo&apos;sh javob sifatida saqlanadi.</li>
                        </ul>
                    </div>

                    <PreflightStart needs={{ mic: 'optional' }} onBack={() => router.push("/dashboard/writing")} onStart={handleStartExam} />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-40 flex h-full w-full flex-col overflow-hidden bg-background">
            <WritingTopBar title={test.title} />
            <div className="flex flex-1 min-h-0 flex-row overflow-hidden">
                <main className="flex-1 min-w-0 overflow-hidden relative">
                    <WritingExamContent
                        tasks={tasks}
                        activeTaskIndex={activeTaskIndex}
                        onSelectTask={setActiveTaskIndex}
                        answers={answers}
                        onAnswer={handleAnswer}
                        fontSize={fontSize}
                        onIncreaseFontSize={() => setFontSize((s) => Math.min(s + 2, 26))}
                        onDecreaseFontSize={() => setFontSize((s) => Math.max(s - 2, 13))}
                    />
                </main>
                <WritingExamSidebar
                    tasks={tasks}
                    activeTaskIndex={activeTaskIndex}
                    onSelectTask={setActiveTaskIndex}
                    answers={answers}
                    timeLeft={formatTime(timeLeft || 0)}
                    isLowTime={timeLeft !== null && timeLeft <= 300}
                    onFinish={() => setIsFinishModalOpen(true)}
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
                <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-foreground mr-2" />
                    <span className="font-semibold text-muted-foreground">Yuklanmoqda...</span>
                </div>
            }
        >
            <WritingExamComponent />
        </Suspense>
    )
}