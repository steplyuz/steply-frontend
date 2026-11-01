// Bo'lim bir marta topshirilgach (yoki Reading'da vaqt tugagach) qayta ishlash mumkin emas.
// Bu brauzer tomonidagi qulf: qurilma umumiy bo'lishi mumkin (bir xil test ID turli
// nomzodlarga), shuning uchun kalit nomzod ID'si bilan ajratiladi.
// ESLATMA: asosiy himoya baribir backendda bo'lishi kerak (is_submitted / start rad etilishi).

export type LockSkill = 'reading' | 'listening' | 'writing' | 'speaking'

const doneKey = (uid: string | number, skill: LockSkill, testId: string | number) => `steply:exam-done:${uid}:${skill}:${testId}`
const deadlineKey = (uid: string | number, skill: LockSkill, testId: string | number) => `steply:exam-deadline:${uid}:${skill}:${testId}`

/** Bo'lim yakunlangan — qayta kirish yopiladi. */
export function lockExam(uid: string | number, skill: LockSkill, testId: string | number) {
  try { localStorage.setItem(doneKey(uid, skill, testId), String(Date.now())) } catch {}
}

export function isExamLocked(uid: string | number, skill: LockSkill, testId: string | number): boolean {
  try { return !!localStorage.getItem(doneKey(uid, skill, testId)) } catch { return false }
}

/**
 * Tugash vaqti (epoch ms). Birinchi chaqiruvda `durationSec` bo'yicha yoziladi va keyin
 * o'zgarmaydi: sahifa yopilsa yoki yangilansa ham soat to'xtamaydi.
 */
export function getOrCreateDeadline(uid: string | number, skill: LockSkill, testId: string | number, durationSec: number, fallbackRemainingSec?: number): number {
  const k = deadlineKey(uid, skill, testId)
  try {
    const saved = Number(localStorage.getItem(k))
    if (saved > 0) return saved
    const remaining = fallbackRemainingSec != null && fallbackRemainingSec >= 0 ? fallbackRemainingSec : durationSec
    const dl = Date.now() + remaining * 1000
    localStorage.setItem(k, String(dl))
    return dl
  } catch {
    return Date.now() + durationSec * 1000
  }
}

export function clearDeadline(uid: string | number, skill: LockSkill, testId: string | number) {
  try { localStorage.removeItem(deadlineKey(uid, skill, testId)) } catch {}
}

export const remainingSeconds = (deadline: number) => Math.max(0, Math.ceil((deadline - Date.now()) / 1000))

/** Server vaqtini epoch ms ga o'giradi. Zona belgisi (Z / +05:00) bo'lmasa UTC deb qabul qilinadi. */
export function parseServerDate(v?: string | null): number {
  if (!v) return NaN
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v)
  return Date.parse(hasTz ? v : `${v}Z`)
}

/** Urinishning serverdagi qolgan vaqti (soniya). Avval `remaining_seconds`, bo'lmasa `expires_at - server_time`. */
export function serverRemainingSeconds(st: {
  remaining_seconds?: number | null
  expires_at?: string | null
  server_time?: string | null
}): number | null {
  if (typeof st.remaining_seconds === 'number') return Math.max(0, st.remaining_seconds)
  const exp = parseServerDate(st.expires_at)
  if (!Number.isFinite(exp)) return null
  const srv = parseServerDate(st.server_time)
  return Math.max(0, Math.floor((exp - (Number.isFinite(srv) ? srv : Date.now())) / 1000))
}

/** Reading practice davomiyligi (daqiqa): to'liq test — 60, alohida part (mini-test) — 20. Backend bilan bir xil qoida. */
export function readingPracticeMinutes(t?: { practice_part_number?: number | null; parent_test_id?: string | null } | null): number {
  return t && (t.practice_part_number != null || t.parent_test_id != null) ? 20 : 60
}
