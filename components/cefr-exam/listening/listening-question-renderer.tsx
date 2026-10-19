"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import { Map, Type, ListChecks, HelpCircle, Check, X, ChevronDown } from "lucide-react"
import { createPortal } from "react-dom"

// Tipni kengaytiramiz (35 ta savol va 6 tur uchun)
type ListeningQuestionType =
    | "MULTIPLE_CHOICE"     // Part 1: Rasm yoki matnli
    | "GAP_FILL"           // Part 2: Note completion
    | "MATCHING"           // Part 3: Fikrlar/Xususiyatlar
    | "MAP_DIAGRAM"        // Part 4: Xarita/Diagramma
    | "SENTENCE_COMPLETION"// Part 5: Akademik qismlar
    | "SHORT_ANSWER"       // Part 6: Qisqa javob/Guruhlash

interface Question {
    id: number
    type: ListeningQuestionType
    text?: string
    options?: { label: string; value: string }[]
    imageUrl?: string // Xarita yoki diagramma uchun
}

interface QuestionRendererProps {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    onInputChange: (value: string) => void
    fontSize?: number
}

// 1. MULTIPLE CHOICE (Part 1 - Rasm yoki Matnli)
export function MultipleChoiceRenderer({ question, answer, onAnswer, fontSize = 16 }: any) {
    return (
        <div className="space-y-3">
            {question.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-border">
                    <img src={question.imageUrl} alt="Context" className="w-full h-auto" />
                </div>
            )}
            <div className="grid grid-cols-1 gap-2">
                {question.options?.map((option: any) => {
                    // isSelected tekshiruvi: User matnni bosgan bo'lsa ham, harfni bosgan bo'lsa ham ishlaydi
                    const isSelected = answer === option.value || answer === option.label;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onAnswer(option.value)} // Javob sifatida MATNNI yuboramiz
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                                ${isSelected
                                    ? "bg-secondary border-foreground ring-1 ring-border"
                                    : "bg-white border-border hover:border-border-strong"}`}
                        >

                            <div className="flex items-center gap-3">
                                {/* Variant HARFI o'ng tomonda alohida turadi */}

                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center 
                                    ${isSelected ? "border-foreground" : "border-border-strong"}`}>
                                    {/* {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-foreground" />} */}
                                    <span className={`text-sm font-bold ${isSelected ? "text-foreground" : "text-muted-foreground/70"}`}>
                                        {option.value}
                                    </span>
                                </div>
                                <span style={{ fontSize: `${fontSize}px` }} className="font-medium text-foreground/80">
                                    {option.label} {/* Bu yerda MATN chiqadi */}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// 2, 5 & 6. INPUT ASOSIDAGI SAVOLLAR (Gap-fill, Sentence, Short Answer)
export function TextEntryRenderer({ answer, onInputChange, fontSize = 16, placeholder }: any) {
    return (
        <div className="relative group">
            <input
                type="text"
                placeholder={placeholder}
                value={answer}
                onChange={(e) => onInputChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-foreground focus:bg-white transition-all shadow-sm"
                style={{ fontSize: `${fontSize}px` }}
            />
            <Type className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-foreground" />
        </div>
    )
}


export function MatchingDropdown({ q, qId, answer, onAnswer, onSelect, isActive }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);

    const updatePosition = () => {
        if (!buttonRef.current || !isOpen) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const menuHeight = 250; // Taxminiy max-balandlik
        const opensUpwards = viewportHeight - rect.bottom < menuHeight;

        setMenuStyle({
            position: "fixed",
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            top: opensUpwards ? "auto" : `${rect.bottom + 4}px`,
            bottom: opensUpwards ? `${viewportHeight - rect.top + 4}px` : "auto",
            zIndex: 9999,
        });
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener("scroll", updatePosition, { capture: true });
        }
        return () => window.removeEventListener("scroll", updatePosition, { capture: true });
    }, [isOpen]);

    const selectedOption = q.options?.find((opt: any) => opt.value === answer);

    return (
        <div
            onClick={() => onSelect(Number(q.questionNumber))}
            className={`p-6 rounded-[24px] border-2 transition-all bg-white flex flex-col justify-between h-full relative
                ${isActive ? "border-foreground ring-4 ring-foreground/30/5 shadow-md" : "border-border hover:border-border"}`}
        >
            <div className="flex items-center gap-3 mb-5">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black
                    ${answer ? "bg-foreground text-white" : "bg-muted text-muted-foreground/70"}`}>
                    {q.questionNumber}
                </span>
                <h3 className="font-bold text-foreground text-sm md:text-base">
                    {q.question || `Speaker ${q.questionNumber}`}
                </h3>
            </div>

            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                        ${answer ? "border-border bg-secondary/30" : "border-border bg-background"}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {selectedOption ? (
                            <>
                                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded bg-foreground text-white text-[10px] font-bold">
                                    {selectedOption.value}
                                </span>
                                <span className="font-semibold text-foreground truncate text-sm">
                                    {selectedOption.label}
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground/70 text-sm font-medium">Select Paragraph...</span>
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {answer && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAnswer(qId, ""); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-border rounded-full flex items-center justify-center text-red-500 shadow-sm"
                    >
                        <X size={10} strokeWidth={3} />
                    </button>
                )}
            </div>

            {isOpen && createPortal(
                <div
                    className="bg-white border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={menuStyle}
                >
                    <div className="overflow-y-auto max-h-[250px] p-1.5 custom-scrollbar">
                        {q.options?.map((opt: any) => (
                            <div
                                key={opt.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAnswer(qId, opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors
                                    ${answer === opt.value ? "bg-secondary" : "hover:bg-background"}`}
                            >
                                <span className={`shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded border text-[10px] font-black
                                    ${answer === opt.value ? "bg-foreground text-white border-foreground" : "bg-white text-muted-foreground/70 border-border"}`}>
                                    {opt.value}
                                </span>
                                <span className={`text-sm leading-tight ${answer === opt.value ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                                    {opt.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// 4. MAP / DIAGRAM LABELING (Part 4 - Xarita)
export function MapLabelingRenderer({ question, answer, onInputChange, fontSize = 16 }: any) {
  return (
    <div className="space-y-4">
      {question?.imageUrl && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <img
            src={question.imageUrl}
            alt="Map / Diagram"
            className="w-full h-auto max-h-[60vh] object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      <div className="bg-background p-6 rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
        <div className="bg-white p-3 rounded-full shadow-sm mb-4">
          <Map className="w-8 h-8 text-foreground" />
        </div>
        <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest mb-4">
          Harf kiritish (A-H)
        </p>
        <input
          type="text"
          maxLength={1}
          value={answer}
          onChange={(e) => onInputChange(e.target.value.toUpperCase())}
          className="w-20 h-20 text-center text-3xl font-black border-4 border-white shadow-xl rounded-2xl focus:ring-4 focus:ring-border outline-none text-foreground uppercase"
          style={{ fontSize }}
        />
      </div>
    </div>
  )
}

// --- ASOSIY RENDERER ---
export default function ListeningQuestionRenderer({
    question,
    answer = "",
    onAnswer,
    onInputChange,
    fontSize = 16
}: QuestionRendererProps) {

    if (!question) return null

    const props = { question, answer, onAnswer, onInputChange, fontSize }

    switch (question.type) {
        case "MULTIPLE_CHOICE":
            return <MultipleChoiceRenderer {...props} />

        case "GAP_FILL":
            return <TextEntryRenderer {...props} placeholder="Note completion..." />

        case "MATCHING":
            return <MatchingDropdown {...props} />

        case "MAP_DIAGRAM":
            return <MapLabelingRenderer {...props} />

        case "SENTENCE_COMPLETION":
            return <TextEntryRenderer {...props} placeholder="Complete the sentence..." />

        case "SHORT_ANSWER":
            return <TextEntryRenderer {...props} placeholder="Short answer (max 3 words)..." />

        default:
            return (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700">
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Noma'lum tur: {question.type}</span>
                </div>
            )
    }
}