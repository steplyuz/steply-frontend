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

/** PATCH/PUT body: barcha maydonlar ixtiyoriy, `id` yuborilmaydi. */
export type UpdateOf<T> = Partial<Omit<T, 'id'>>
