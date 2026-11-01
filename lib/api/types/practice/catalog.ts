// Practice katalogi: GET /practice/tests (backend: app/modules/practice/router.py)

export type PracticeSkill = 'reading' | 'listening' | 'writing' | 'speaking'

/** `free` — hamma uchun ochiq; `premium` — pullik tarif (Plus/Pro) talab qilinadi. */
export type PracticeAccess = 'free' | 'premium'

export interface PracticeCatalogItem {
  id: string
  title: string
  skill: PracticeSkill
  cefr_level: string | null
  duration_minutes: number | null
  /** Reading/Listening — savollar soni, Writing — topshiriqlar soni, Speaking — null. */
  total_questions: number | null
  is_free: boolean
  access: PracticeAccess
  /** Joriy foydalanuvchi uchun qulflangan (premium va tarifi yetarli emas). Ro'yxatda ko'rinadi, lekin boshlab bo'lmaydi. */
  is_locked: boolean
  /** Faqat Reading: part mini-test bo'lsa. */
  practice_part_number?: number | null
  parent_test_id?: string | null
}

export interface PracticeCatalog {
  items: Record<PracticeSkill, PracticeCatalogItem[]>
  total: number
}
