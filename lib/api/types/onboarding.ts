// ONBOARDING: /onboarding (talaba), backend: app/modules/onboarding

export type OnbCefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export type OnbTargetLevel = 'A2' | 'B1' | 'B2' | 'C1'
export type OnbVocabBand = '0-500' | '500-1500' | '1500-3000' | '3000+'
export type OnbSkill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING' | 'GRAMMAR' | 'VOCABULARY'
export type OnbDailyHours = 0.5 | 1 | 1.5 | 2
export type OnbTeacherHours = 0 | 0.5 | 1 | 1.5 | 2

/** GET/PUT /onboarding javobi */
export interface OnboardingState {
  cefr_taken: boolean | null
  cefr_level: string | null
  estimated_level: string | null
  target_level: string | null
  vocab_band: string | null
  strengths: string[] | null
  weaknesses: string[] | null
  exam_date_id: number | null
  daily_hours: number | null
  teacher_hours: number | null
  is_complete: boolean
  plan_version: number
  /** Reja yaratilgan vaqt (ISO). Kalendarda 1-kun shu sanadan hisoblanadi. */
  plan_generated_at: string | null
  plan: OnboardingPlan | null
}

/** PUT /onboarding: qisman yuborish mumkin */
export interface OnboardingUpdateInput {
  cefr_taken?: boolean
  cefr_level?: OnbCefrLevel
  estimated_level?: OnbCefrLevel
  target_level?: OnbTargetLevel
  vocab_band?: OnbVocabBand
  strengths?: OnbSkill[]
  weaknesses?: OnbSkill[]
  exam_date_id?: number
  daily_hours?: OnbDailyHours
  teacher_hours?: OnbTeacherHours
}

/** GET /onboarding/exam-dates */
export interface OnboardingExamDate {
  id: number
  title: string
  exam_date: string // YYYY-MM-DD
  register_url: string
  is_active: boolean
}

export interface OnboardingPlanMonth {
  month: string
  focus: string
  weekly_goals: string[]
}

export interface OnboardingPlan {
  summary: string
  months: OnboardingPlanMonth[]
  daily_minutes: number
  daily_breakdown: { skill: OnbSkill; minutes: number }[]
  teacher_sessions_per_week: number
  vocabulary_words_per_day: number
  milestones: string[]
  exam?: { id: number; title: string; date: string; register_url: string }
}

/** POST /onboarding/plan */
export interface OnboardingPlanResponse {
  plan_version: number
  plan: OnboardingPlan
}

/** POST /admin/exam-dates, PATCH /admin/exam-dates/{id} */
export interface OnboardingExamDateInput {
  title: string
  exam_date: string // YYYY-MM-DD
  register_url: string
  is_active?: boolean
}
