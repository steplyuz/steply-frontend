"use client"

import { useState } from "react"

interface AnswerPanelProps {
    questionNumber: number
    questionText: string
    isOpen: boolean
    onClose: () => void
    answer: string
    onSaveAnswer: (answer: string) => void
}

export default function AnswerPanel({
    questionNumber,
    questionText,
    isOpen,
    onClose,
    answer,
    onSaveAnswer,
}: AnswerPanelProps) {
    const [localAnswer, setLocalAnswer] = useState(answer)

    const handleSave = () => {
        onSaveAnswer(localAnswer)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-border-strong bg-white px-6 py-4">
                    <h2 className="text-lg font-bold text-foreground">Question {questionNumber}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground/80 text-2xl leading-none">
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-foreground/80 mb-4">
                            <span className="font-semibold">Question:</span> {questionText}
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-foreground/80 mb-2">Write your answer:</label>
                        <textarea
                            value={localAnswer}
                            onChange={(e) => setLocalAnswer(e.target.value)}
                            placeholder="Type or paste your answer here..."
                            className="w-full p-3 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/30 focus:border-transparent text-sm min-h-[200px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Word count:{" "}
                            {
                                localAnswer
                                    .trim()
                                    .split(/\s+/)
                                    .filter((w) => w.length > 0).length
                            }
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 justify-end border-t border-border-strong pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-border-strong text-foreground/80 text-sm font-medium rounded hover:bg-background transition"
                        >
                            Cancelw-8 h-8
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-foreground text-white text-sm font-medium rounded hover:bg-foreground transition"
                        >
                            Save Answer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
