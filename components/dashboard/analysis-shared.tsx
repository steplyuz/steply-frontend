'use client'

import { BookOpenText, Headphones, Mic, PenLine } from 'lucide-react'
import { refreshSession } from '@/lib/api/client'

export const LIME = '#E4F70A'

export type Skill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'
export type AnalysisVideo = { id: number | string; skill: Skill; test_id: string; title: string; created_at: string }
export type SkillResult = {
  id: number | string
  exam_id: string
  raw_score?: number
  correct_answers?: number
  total_questions?: number
  standard_score?: number
  cefr_level?: string | null
  percentage?: number
  created_at: string
}
export type QuestionReview = {
  question_number: number
  question_text?: string | null
  part_title?: string | null
  user_answer?: string[] | string | null
  correct_answer?: string[] | string | null
  is_correct: boolean
  type?: string
}
export type ResultDetail = { summary: SkillResult; review: QuestionReview[] }
export type Quota = {
  tier: string
  weekly_limit: number | null
  weekly_used: number
  weekly_remaining: number | null
  monthly_limit: number | null
  monthly_used: number
  monthly_remaining: number | null
}

// Dashboard'dagi ko'nikma ranglari bilan bir xil
export const SKILLS: Record<Skill, { label: string; icon: typeof Mic; tint: string; accent: string }> = {
  READING: { label: 'Reading', icon: BookOpenText, tint: '#E6EEFF', accent: '#2563EB' },
  LISTENING: { label: 'Listening', icon: Headphones, tint: '#F3E8FF', accent: '#9333EA' },
  WRITING: { label: 'Writing', icon: PenLine, tint: '#FFEDD5', accent: '#F97316' },
  SPEAKING: { label: 'Speaking', icon: Mic, tint: '#FFE4E6', accent: '#E11D48' },
}

/** URL'dagi `reading` / `LISTENING` kabi qiymatni Skill'ga aylantiradi (noto'g'ri bo'lsa null). */
export function parseSkill(value: string | string[] | undefined): Skill | null {
  const v = (Array.isArray(value) ? value[0] : value)?.toUpperCase()
  return v && v in SKILLS ? (v as Skill) : null
}

/** 401 bo'lsa sessiyani yangilab, so'rovni bir marta qaytaradi. */
export async function authFetch(url: string, signal?: AbortSignal): Promise<Response> {
  let response = await fetch(url, { credentials: 'include', signal })
  if (response.status === 401 && (await refreshSession())) response = await fetch(url, { credentials: 'include', signal })
  return response
}

export async function errorMessage(response: Response, fallback: string): Promise<string> {
  let message = response.statusText || fallback
  try {
    const data = await response.json()
    message = data?.detail || data?.error?.message || message
  } catch {}
  return message
}

export const answerText = (value: string[] | string | null | undefined) =>
  Array.isArray(value) ? value.join(', ') || '—' : value || '—'

export const scoreOf = (r: SkillResult) => Number(r.standard_score ?? r.raw_score ?? r.correct_answers ?? 0)

export const fmtDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sana ko‘rsatilmagan'

/** Dekorativ halqa — matn ostida qoladi, bosilmaydi */
export function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}

export function barColor(ratio: number) {
  if (ratio >= 1) return '#FB7185'
  if (ratio >= 0.8) return '#FB923C'
  return LIME
}