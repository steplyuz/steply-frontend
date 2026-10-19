"use client"

export default function ExamFooter({
    currentQuestion,
    totalQuestions,
    answered,
    flagged,
    onSelectQuestion,
    onFinish,
}: {
    currentQuestion: number
    totalQuestions: number
    answered: Record<number, boolean>
    flagged: Record<number, boolean>
    onSelectQuestion: (questionNum: number) => void
    onFinish: () => void
}) {
    const parts = [
        { id: 1, start: 1, end: 6, label: "Part 1" },
        { id: 2, start: 7, end: 14, label: "Part 2" },
        { id: 3, start: 15, end: 20, label: "Part 3" },
        { id: 4, start: 21, end: 29, label: "Part 4" },
        { id: 5, start: 30, end: 35, label: "Part 5" },
    ]

    const currentPart =
        parts.find(
            (p) => currentQuestion >= p.start && currentQuestion <= p.end
        ) ?? parts[0]

    return (
        <div className="sticky bottom-0 z-30 bg-white border-t shadow-lg">
            {/* ================= MAIN NAV ================= */}
            <div
                className="
          flex items-center gap-4
          px-3 py-2
          overflow-x-auto
          lg:justify-between
        "
            >
                {/* PARTS + QUESTIONS */}
                <div className="flex items-center gap-5">
                    {parts.map((part) => {
                        const qRange = part.end - part.start + 1
                        const isCurrentPart = part.id === currentPart.id

                        return (
                            <div
                                key={part.id}
                                className="flex items-center gap-3 shrink-0"
                            >
                                {/* PART LABEL */}
                                <span
                                    className={`text-xs font-semibold whitespace-nowrap ${isCurrentPart
                                        ? "text-foreground"
                                        : "text-muted-foreground/70"
                                        }`}
                                >
                                    {part.label}
                                </span>

                                {/* QUESTIONS */}
                                <div className="flex gap-1.5">
                                    {Array.from({ length: qRange }, (_, i) => part.start + i).map(
                                        (qNum) => {
                                            const isActive = qNum === currentQuestion
                                            const isAnswered = answered[qNum]
                                            const isFlagged = flagged[qNum]

                                            let style =
                                                "border border-border-strong text-foreground/80"

                                            if (isActive)
                                                style =
                                                    "bg-foreground text-white border-foreground"
                                            else if (isFlagged)
                                                style =
                                                    "bg-secondary border-foreground text-foreground"
                                            else if (isAnswered)
                                                style =
                                                    "bg-secondary border-foreground text-foreground"

                                            return (
                                                <button
                                                    key={qNum}
                                                    onClick={() => onSelectQuestion(qNum)}
                                                    className={`
                            min-w-8 h-8 px-2
                            rounded text-xs font-semibold
                            transition-all
                            ${style}
                          `}
                                                >
                                                    {qNum}
                                                </button>
                                            )
                                        }
                                    )}
                                </div>

                                {/* DIVIDER (desktop only look) */}
                                {part.id < parts.length && (
                                    <div className="hidden lg:block h-6 w-px bg-border-strong mx-1" />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* FINISH BUTTON (desktop inline) */}
                <button
                    onClick={onFinish}
                    className="
            hidden lg:flex
            ml-4 px-5 py-2
            rounded bg-foreground text-white
            text-sm font-semibold
            hover:bg-foreground
            shrink-0
          "
                >
                    ✓ Finish
                </button>
            </div>

            {/* ================= MOBILE BOTTOM BAR ================= */}
            <div className="flex lg:hidden items-center justify-between px-4 pb-2">
                <span className="text-xs text-muted-foreground">
                    {Object.keys(answered).length} / {totalQuestions} answered
                </span>

                <button
                    onClick={onFinish}
                    className="
            px-4 py-2
            rounded bg-foreground text-white
            text-sm font-semibold
          "
                >
                    Finish
                </button>
            </div>

            {/* ================= DESKTOP INFO ================= */}
            <div className="hidden lg:block px-6 pb-2 text-xs text-muted-foreground">
                {Object.keys(answered).length} of {totalQuestions} answered
            </div>
        </div>
    )
}
