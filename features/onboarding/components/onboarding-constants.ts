import type { OnbCefrLevel, OnbDailyHours, OnbSkill, OnbTargetLevel, OnbTeacherHours, OnbVocabBand } from '@/shared/api/types'

export const CEFR_LEVELS: OnbCefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
export const TARGET_LEVELS: OnbTargetLevel[] = ['A2', 'B1', 'B2', 'C1']

export const VOCAB_BANDS: { value: OnbVocabBand; label: string }[] = [
  { value: '0-500', label: '0 – 500 so‘z' },
  { value: '500-1500', label: '500 – 1 500 so‘z' },
  { value: '1500-3000', label: '1 500 – 3 000 so‘z' },
  { value: '3000+', label: '3 000 dan ko‘p' },
]

export const SKILLS: { value: OnbSkill; label: string }[] = [
  { value: 'READING', label: 'Reading' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
]

export const SKILL_LABEL: Record<OnbSkill, string> = Object.fromEntries(SKILLS.map((s) => [s.value, s.label])) as Record<OnbSkill, string>

export const DAILY_OPTIONS: { value: OnbDailyHours; label: string }[] = [
  { value: 0.5, label: '30 daqiqa' },
  { value: 1, label: '1 soat' },
  { value: 1.5, label: '1.5 soat' },
  { value: 2, label: '2 soat' },
]

export const TEACHER_OPTIONS: { value: OnbTeacherHours; label: string }[] = [
  { value: 0, label: 'Yo‘q, o‘zim' },
  { value: 0.5, label: '30 daqiqa' },
  { value: 1, label: '1 soat' },
  { value: 1.5, label: '1.5 soat' },
  { value: 2, label: '2 soat' },
]

/** Sana: YYYY-MM-DD -> DD.MM.YYYY (locale'ga bog'liq bo'lmasligi uchun) */
export function formatExamDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}
