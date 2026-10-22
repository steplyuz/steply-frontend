
'use client'

export type LockSkill = 'reading' | 'listening' | 'writing' | 'speaking'

const doneKey = (
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
) => `steply:exam-done:${uid}:${skill}:${testId}`

const deadlineKey = (
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
) => `steply:exam-deadline:${uid}:${skill}:${testId}`

/** Bo'lim yakunlanganini brauzerda belgilash. */
export function lockExam(
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
) {
  try {
    localStorage.setItem(doneKey(uid, skill, testId), String(Date.now()))
  } catch {
    // localStorage mavjud bo'lmasa, davom etamiz.
  }
}

/** Bo'lim avval yakunlanganmi? */
export function isExamLocked(
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
): boolean {
  try {
    return !!localStorage.getItem(doneKey(uid, skill, testId))
  } catch {
    return false
  }
}

/** Server bergan aniq tugash muddatini saqlash. */
export function setDeadline(
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
  deadlineMs: number,
): number {
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0) {
    throw new Error('Taymer muddati noto‘g‘ri.')
  }

  try {
    localStorage.setItem(
      deadlineKey(uid, skill, testId),
      String(deadlineMs),
    )
  } catch {
    // Server muddati joriy sahifada baribir ishlatilishi mumkin.
  }

  return deadlineMs
}

/**
 * Tugash vaqti epoch millisekundlarda.
 * Saqlangan muddat mavjud bo'lsa, uni qaytaradi.
 */
export function getOrCreateDeadline(
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
  durationSec: number,
  fallbackRemainingSec?: number,
): number {
  const key = deadlineKey(uid, skill, testId)

  try {
    const raw = localStorage.getItem(key)
    const saved = raw === null ? NaN : Number(raw)

    if (Number.isFinite(saved) && saved > 0) {
      return saved
    }

    const remaining =
      fallbackRemainingSec != null &&
      Number.isFinite(fallbackRemainingSec) &&
      fallbackRemainingSec >= 0
        ? fallbackRemainingSec
        : durationSec

    const deadline = Date.now() + Math.max(0, remaining) * 1000

    localStorage.setItem(key, String(deadline))
    return deadline
  } catch {
    return Date.now() + Math.max(0, durationSec) * 1000
  }
}

/** Saqlangan taymer muddatini o'chirish. */
export function clearDeadline(
  uid: string | number,
  skill: LockSkill,
  testId: string | number,
) {
  try {
    localStorage.removeItem(deadlineKey(uid, skill, testId))
  } catch {
    // localStorage mavjud bo'lmasa, hech narsa qilinmaydi.
  }
}

/** Qolgan vaqtni soniyalarda hisoblash. */
export const remainingSeconds = (deadline: number): number =>
  Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
