// Barcha modullar uchun umumiy turlar.

export type Gender = 'male' | 'female'
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | string
export type SkillType = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'

export type Region =
  | 'tashkent_city' | 'tashkent_region' | 'andijan' | 'bukhara' | 'fergana'
  | 'jizzakh' | 'kashkadarya' | 'navoiy' | 'namangan' | 'samarkand'
  | 'surkhandarya' | 'syrdarya' | 'khorezm' | 'karakalpakstan'

/**
 * Backend sxemasi hali aniq yozilmagan javoblar uchun vaqtincha tur.
 * Sxema aniq bo'lgach, tegishli modul turlari faylida alohida interfeysga almashtiring.
 */
export type JsonObject = Record<string, unknown>

export interface StatusMessage {
  status: string
  message: string
  bot_link?: string
}

/** Resume qilinadigan urinish holati (spec: GET /reading-tests/attempts/{id}, /listening-tests/attempts/{id}). */
export interface AttemptState {
  attempt_id: number
  /** Mock imtihon urinishiga bog'langan bo'lsa to'ladi. */
  exam_attempt_id?: number | null
  test_id: string
  skill: string
  mode: string
  part_number?: number | null
  status: string
  started_at: string
  submitted_at?: string | null
  expires_at: string
  server_time: string
  last_saved_at?: string | null
  duration_minutes: number
  remaining_seconds: number
  total_questions: number
  answered_count: number
  result_id?: number | null
  answers: Array<Record<string, unknown>>
}

/** PUT .../answers body (spec: question_id, question_number, answers, answer). */
export interface AttemptAnswerInput {
  question_id?: number | null
  question_number?: number | null
  answers?: string[] | null
  answer?: string | null
}

export interface AttemptAnswerResult extends AttemptAnswerInput {
  updated_at: string
}

/** PATCH/PUT body: barcha maydonlar ixtiyoriy, `id` yuborilmaydi. */
export type UpdateOf<T> = Partial<Omit<T, 'id'>>
