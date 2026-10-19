"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import SpeakingExamContent, { type SpeakingPromptItem } from "@/components/cefr-exam/speaking/speaking-exam-content"
import SpeakingExamSidebar from "@/components/cefr-exam/speaking/speaking-exam-sidebar"
import SpeakingTopBar from "@/components/cefr-exam/speaking/speaking-top-bar"
import SpeakingFinishModal from "@/components/cefr-exam/speaking/speaking-finish-modal"
import SpeakingComplete from "@/components/cefr-exam/speaking/speaking-complete"
import { saveAttempt, type QuestionSnapshot, type RecordingRef } from "@/lib/speaking/export"
import { resolveAudioUrl } from "@/lib/api"
import { speakingApi } from "@/lib/api"
import type { SpeakingTest } from "@/lib/api/types"
import { Loader2, AlertCircle, Maximize, Mic, ShieldCheck, Headphones } from "lucide-react"
import { toast } from "sonner"
import { PreflightStart } from "@/components/exam/preflight"
import { useAuth } from "@/lib/auth/auth-context"
import { isExamLocked, lockExam } from "@/lib/exam-lock"
import { useSpeakingGrading } from "@/lib/speaking/access"
import { SpeakingLockedTest } from "@/components/dashboard/speaking-locked"

function promptsFrom(test: SpeakingTest): SpeakingPromptItem[] {
    const prompts: SpeakingPromptItem[] = []
    const p11 = test.part_1_1
    const p12 = test.part_1_2
    const p2 = test.part_2
    const p3 = test.part_3

    const add = (
        partId: string | undefined,
        partFallback: string,
        partKey: "part_1_1" | "part_1_2" | "part_2" | "part_3",
        partName: string,
        questionId: string | undefined,
        questionFallback: string,
        label: string,
        text: string,
        image?: string | string[] | null,
        prepSeconds?: number,
        answerSeconds?: number,
        forPoints?: string[],
        againstPoints?: string[]
    ) => {
        if (!text?.trim()) return
        prompts.push({
            partId: partId || partFallback,
            partKey,
            partName,
            questionId: questionId || questionFallback,
            label,
            text,
            image,
            prepSeconds,
            answerSeconds,
            forPoints,
            againstPoints,
        })
    }

    if (p11) {
        add(p11.external_id, "part_1_1", "part_1_1", "Part 1.1 · Savol-javob", p11.question_1_id, "question_1", "Part 1.1 · Savol 1", p11.question_1, undefined, 0, 30)
        add(p11.external_id, "part_1_1", "part_1_1", "Part 1.1 · Savol-javob", p11.question_2_id, "question_2", "Part 1.1 · Savol 2", p11.question_2, undefined, 0, 30)
        add(p11.external_id, "part_1_1", "part_1_1", "Part 1.1 · Savol-javob", p11.question_3_id, "question_3", "Part 1.1 · Savol 3", p11.question_3, undefined, 0, 30)
    }

    if (p12) {
        add(p12.external_id, "part_1_2", "part_1_2", "Part 1.2 · Rasm tasviri", p12.question_describe_id, "question_describe", "Part 1.2 · Rasm tasvirlash", p12.question_describe, [p12.image_1_url, p12.image_2_url].filter(Boolean) as string[], 0, 45)
        add(p12.external_id, "part_1_2", "part_1_2", "Part 1.2 · Rasm tasviri", p12.question_2_id, "question_2", "Part 1.2 · Savol 2", p12.question_2, [p12.image_1_url, p12.image_2_url].filter(Boolean) as string[], 0, 30)
        add(p12.external_id, "part_1_2", "part_1_2", "Part 1.2 · Rasm tasviri", p12.question_3_id, "question_3", "Part 1.2 · Savol 3", p12.question_3, [p12.image_1_url, p12.image_2_url].filter(Boolean) as string[], 0, 30)
    }

    if (p2) {
        // CEFR Part 2 — 1 daqiqa tayyorgarlik va bitta uzluksiz 2 daqiqalik javob.
        // Uchta yo'naltiruvchi savol bitta kartada beriladi, har biri uchun alohida audio yozilmaydi.
        add(p2.external_id, "part_2", "part_2", "Part 2 · Mavzu va savollar", p2.question_1_id, "topic", "Part 2 · Mavzu", `${p2.question_1}\n\n${p2.question_2}\n\n${p2.question_3}`, p2.image_url, 60, 120)
    }

    if (p3) {
        add(p3.external_id, "part_3", "part_3", "Part 3 · Munozara", p3.topic_id, "topic", "Part 3 · Muhokama", p3.topic, undefined, 60, 120, p3.for_points, p3.against_points)
    }

    return prompts
}

function SpeakingExamComponent() {
    const access = useSpeakingGrading()
    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()

    const testId = params?.id || searchParams.get("id")
    const mode = searchParams.get("mode")
    const lockUid = user?.id || "guest"

    const [test, setTest] = useState<SpeakingTest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    const [uploadedStatus, setUploadedStatus] = useState<Record<string, boolean>>({})
    const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
    // Har bir savol uchun serverdagi submission id (yuklab olish uchun) va fayl kengaytmasi.
    const [recordings, setRecordings] = useState<Record<string, RecordingRef>>({})
    const [finished, setFinished] = useState(false)

    const [hasStarted, setHasStarted] = useState<boolean>(() => {
        if (typeof window !== "undefined" && testId) {
            return localStorage.getItem(`speaking-${testId}-started`) === "true"
        }
        return false
    })

    const [fontSize, setFontSize] = useState(17)
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
    const [speakingBusy, setSpeakingBusy] = useState(false)
    const [fsLost, setFsLost] = useState(false)
    const isExamFinished = useRef(false)

    // Data fetching & local recovery
    useEffect(() => {
        if (!testId) return
        let alive = true

        const fetchExam = async () => {
            setLoading(true)
            try {
                const examData = await speakingApi.practiceTest(testId)
                if (!alive) return
                setTest(examData)

                if (mode === "mock" && isExamLocked(lockUid, "speaking", testId)) {
                    setError("Bu Speaking imtihoni allaqachon yakunlangan va qayta ochilmaydi.")
                    return
                }
                const sessionStarted = localStorage.getItem(`speaking-${testId}-started`) === "true"
                if (sessionStarted) {
                    setHasStarted(true)
                    const savedStatus = localStorage.getItem(`speaking-${testId}-status`)
                    if (savedStatus) {
                        try {
                            setUploadedStatus(JSON.parse(savedStatus))
                        } catch {}
                    }
                    const savedRecs = localStorage.getItem(`speaking-${testId}-recordings`)
                    if (savedRecs) {
                        try {
                            setRecordings(JSON.parse(savedRecs))
                        } catch {}
                    }
                }
            } catch (err: any) {
                if (alive) setError(err?.message || "Speaking topshirig'ini yuklab bo'lmadi")
            } finally {
                if (alive) setLoading(false)
            }
        }

        fetchExam()
        return () => {
            alive = false
        }
    }, [testId, mode, lockUid])

    const prompts = useMemo(() => (test ? promptsFrom(test) : []), [test])
    const currentPrompt = prompts[currentIndex]

    // Handle recording upload
    const handleRecordComplete = useCallback(
        async (prompt: SpeakingPromptItem, file: File, audioUrl: string) => {
            if (!testId) return
            const saved = await speakingApi.practiceSubmit(testId, prompt.questionId, file, prompt.partId)

            const key = `${prompt.partId}-${prompt.questionId}`
            const rawId = (saved as { id?: unknown; submission_id?: unknown } | null)?.id ?? (saved as { submission_id?: unknown } | null)?.submission_id
            const submissionId = Number.isFinite(Number(rawId)) && rawId != null ? Number(rawId) : undefined
            const ext = file.name.split(".").pop() || "webm"
            setRecordings((prev) => {
                const next = { ...prev, [key]: { submissionId, blobUrl: audioUrl, ext } }
                // blob URL sahifa yopilganda o'ladi — faqat serverga tegishli qismini saqlaymiz
                const persist = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, { submissionId: v.submissionId, ext: v.ext }]))
                localStorage.setItem(`speaking-${testId}-recordings`, JSON.stringify(persist))
                return next
            })
            setUploadedStatus((prev) => {
                const next = { ...prev, [key]: true }
                localStorage.setItem(`speaking-${testId}-status`, JSON.stringify(next))
                return next
            })
            setAudioUrls((prev) => ({ ...prev, [key]: audioUrl }))
            toast.success("Audio javobingiz qabul qilindi!")
        },
        [testId]
    )

    // Fullscreen tracking
    useEffect(() => {
        if (!hasStarted || mode !== "mock") return
        const onFs = () => {
            if (!document.fullscreenElement && !isExamFinished.current) setFsLost(true)
            else setFsLost(false)
        }
        if (!document.fullscreenElement) setFsLost(true)
        document.addEventListener("fullscreenchange", onFs)
        return () => document.removeEventListener("fullscreenchange", onFs)
    }, [hasStarted, mode])

    const returnToFullscreen = () => {
        document.documentElement.requestFullscreen?.().then(() => setFsLost(false)).catch(() => setFsLost(false))
    }

    const handleStartExam = () => {
        if (!testId || !test) return
        localStorage.setItem(`speaking-${testId}-started`, "true")
        setHasStarted(true)
        if (mode === "mock" && typeof document !== "undefined") {
            document.documentElement.requestFullscreen?.().then(() => setFsLost(false)).catch(() => {})
        }
    }

    const snapshot = useMemo<QuestionSnapshot[]>(
        () =>
            prompts.map((p) => ({
                key: `${p.partId}-${p.questionId}`,
                partName: p.partName,
                label: p.label,
                text: p.text,
                images: (Array.isArray(p.image) ? p.image : p.image ? [p.image] : []).filter(Boolean).map((u) => resolveAudioUrl(u)),
                prepSeconds: p.prepSeconds,
                answerSeconds: p.answerSeconds,
                forPoints: p.forPoints,
                againstPoints: p.againstPoints,
            })),
        [prompts]
    )

    const handleFinish = () => {
        if (!testId || !test) return
        isExamFinished.current = true
        if (mode === "mock") lockExam(lockUid, "speaking", testId)
        if (mode === "mock" && typeof document !== "undefined" && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
        }
        // Arxivga yozamiz: keyin ham savollar va audiolarni yuklab olish mumkin bo'lsin.
        const serverRecs = Object.fromEntries(
            Object.entries(recordings)
                .filter(([, r]) => r.submissionId != null)
                .map(([k, r]) => [k, { submissionId: r.submissionId as number, ext: r.ext }])
        )
        saveAttempt(String(user?.id ?? "guest"), {
            id: `${testId}-${Date.now()}`,
            testId,
            title: test.title,
            finishedAt: new Date().toISOString(),
            questions: snapshot,
            recordings: serverRecs,
        })
        localStorage.removeItem(`speaking-${testId}-started`)
        localStorage.removeItem(`speaking-${testId}-status`)
        localStorage.removeItem(`speaking-${testId}-recordings`)
        setIsFinishModalOpen(false)
        setFinished(true)
        toast.success("Speaking imtihoni yakunlandi!")
    }

    // Obunasiz foydalanuvchi imtihonni topshira olmaydi; PDF yuklab olish sahifada qoladi.
    if (access.loading) {
        return (
            <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
        )
    }
    if (!access.canGrade) {
        return <SpeakingLockedTest testId={testId} />
    }

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
                <span className="font-semibold text-muted-foreground">Speaking topshirig&apos;i yuklanmoqda...</span>
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

    // Yakunlandi: baholash holati + savol/audio yuklab olish
    if (finished) {
        return (
            <SpeakingComplete
                title={test.title}
                questions={snapshot}
                recordings={recordings}
                onExit={() => router.push("/dashboard/speaking")}
            />
        )
    }

    // Start / Readiness screen
    if (!hasStarted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
                <div className="w-full max-w-xl bg-white border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-foreground text-white flex items-center justify-center shadow-lg shrink-0">
                            <Mic className="size-7 text-[#E4F70A]" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                CEFR · Gapirish bo&apos;limi
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate" title={test.title}>
                                {test.title}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-border text-center">
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Savollar soni</div>
                            <div className="text-lg font-bold text-foreground">{prompts.length} ta</div>
                        </div>
                        <div className="p-3 bg-background rounded-2xl">
                            <div className="text-xs text-muted-foreground font-medium">Taxminiy vaqt</div>
                            <div className="text-lg font-bold text-foreground">~15 daqiqa</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground bg-background p-4 rounded-2xl border border-border">
                        <div className="font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="size-4 text-foreground" />
                            Imtihon qoidalari:
                        </div>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                            <li>Mikrofoningiz sozligiga va atrofda begona shovqinlar yo&apos;qligiga ishonch hosil qiling.</li>
                            <li>Imtihon boshlanganidan keyin mikrofon ruxsatini bering. Tayyorgarlik va audio yozuvi har bir savolda avtomatik boshlanadi.</li>
                            <li>Yozib olingan javobingizni eshitib ko&apos;rish va kerak bo&apos;lsa qayta yozish imkoniyati bor.</li>
                            <li>Barcha audio javoblar saqlanadi. Baholash faqat obunada ishlaydi; savollar va audiolarni yakunda yuklab olishingiz mumkin.</li>
                            {mode === "mock" ? <li>Mock imtihon to&apos;liq ekran rejimida o&apos;tkaziladi.</li> : <li>Practice rejimida to&apos;liq ekran majburiy emas.</li>}
                        </ul>
                    </div>

                    <PreflightStart needs={{ mic: 'required', fullscreen: mode === "mock" }} onBack={() => router.push("/dashboard/speaking")} onStart={handleStartExam} />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-40 flex h-dvh min-h-dvh w-full flex-col overflow-hidden select-none bg-background">
            <SpeakingTopBar title={test.title} currentPartName={currentPrompt?.partName || "Speaking"} onFinish={() => setIsFinishModalOpen(true)} finishDisabled={speakingBusy} />
            <div className="flex flex-1 min-h-0 flex-row overflow-hidden">
                <main className="flex-1 min-w-0 overflow-hidden relative">
                    <SpeakingExamContent
                        prompts={prompts}
                        currentIndex={currentIndex}
                        onSelectIndex={setCurrentIndex}
                        uploadedStatus={uploadedStatus}
                        audioUrls={audioUrls}
                        onRecordComplete={handleRecordComplete}
                        fontSize={fontSize}
                        onIncreaseFontSize={() => setFontSize((s) => Math.min(s + 2, 26))}
                        onDecreaseFontSize={() => setFontSize((s) => Math.max(s - 2, 13))}
                        onBusyChange={setSpeakingBusy}
                        autoStart
                    />
                </main>
                <SpeakingExamSidebar
                    cameraEnabled={mode === "mock"}
                    prompts={prompts}
                    currentIndex={currentIndex}
                    onSelectIndex={setCurrentIndex}
                    uploadedStatus={uploadedStatus}
                    onFinish={() => setIsFinishModalOpen(true)}
                    busy={speakingBusy}
                />
            </div>

            {/* Fullscreen Alert Modal */}
            {mode === "mock" && fsLost && !isFinishModalOpen && !isExamFinished.current && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                            <Maximize className="size-7" />
                        </div>
                        <h2 className="mt-4 text-xl font-extrabold text-foreground">To&apos;liq ekran rejimi o&apos;chdi</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Imtihon to&apos;liq ekran rejimida o&apos;tkaziladi. Davom etish uchun to&apos;liq ekranga qayting.
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

            {/* Finish Modal */}
            {isFinishModalOpen && (
                <SpeakingFinishModal
                    prompts={prompts}
                    uploadedStatus={uploadedStatus}
                    onConfirm={handleFinish}
                    onCancel={() => setIsFinishModalOpen(false)}
                    onJump={(idx) => {
                        setCurrentIndex(idx)
                        setIsFinishModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}

export default function SpeakingPracticePage() {
    return (
        <Suspense
            fallback={
                <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-foreground mr-2" />
                    <span className="font-semibold text-muted-foreground">Yuklanmoqda...</span>
                </div>
            }
        >
            <SpeakingExamComponent />
        </Suspense>
    )
}