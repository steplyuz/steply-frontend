// Bir xil shakldagi backend resurslari uchun umumiy "fabrikalar".
//
// Reading, Listening, Writing va Speaking practice modullari umumiy CRUD / topshirish / lock oqimidan foydalanadi —
// ularni har modulda qayta yozish o'rniga shu yerda bir marta yozilgan. Modullar kerakli
// metodlarni destrukturlab oladi (backendda yo'q endpoint "yaratilib" qolmasligi uchun).

import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from './client'
import { apiUrl, enc, type QueryParams } from './config'
import type {
  AnswerKeyResponse, AttemptAnswerInput, AttemptAnswerResult, AttemptState, ExamVersion, LockError, LockResult, UpdateOf,
} from './types'

/** Lock xatosini ko'rsatish uchun matnga aylantiradi (React'da obyektni to'g'ridan-to'g'ri render qilib bo'lmaydi). */
export function formatLockError(e: LockError): string {
  if (typeof e === 'string') return e
  const prefix = e.question_number != null ? `Savol #${e.question_number}: ` : ''
  return `${prefix}${e.message}`
}

/**
 * Admin CRUD: `{adminBase}`, `{adminBase}/{id}`.
 * T — to'liq resurs, C — create body, U — update body, TItem — ro'yxat elementi (odatda T).
 *
 * Diqqat: `importJson` alohida yo'lga emas, xuddi `create` bilan bir xil
 * `POST {adminBase}` ga boradi — backend shu bitta endpointda ham JSON fayl
 * (multipart `file`), ham oddiy body qabul qiladi (bitta admin_router.post("")).
 * Alohida "/import-json" yo'li backendda mavjud emas.
 */
export function createAdminCrud<T, C, U = UpdateOf<C>, TItem = T>(adminBase: string, opts: { update: 'put' | 'patch' }) {
  const send = opts.update === 'put' ? apiPut : apiPatch
  return {
    adminList: (query?: QueryParams) => apiGet<TItem[]>(adminBase, { query }),
    adminGet: (id: string) => apiGet<T>(`${adminBase}/${enc(id)}`),
    create: (input: C) => apiPost<T>(adminBase, input),
    importJson: (file: File) => apiUpload<T>(adminBase, { file }),
    update: (id: string, input: U) => send<T>(`${adminBase}/${enc(id)}`, input),
    remove: (id: string) => apiDelete<void>(`${adminBase}/${enc(id)}`),
  }
}

/**
 * Talaba tomoni: ro'yxat, bitta test, topshirish, natijalar.
 * `{base}`, `{base}/{id}`, `{base}/{id}/submit`, `{base}/me/results[/{rid}]`, `{adminBase}/results`.
 */
export function createTestTakingApi<T, SubmitIn, SubmitOut, Summary, Detail = Summary>(base: string, adminBase: string) {
  return {
    getAll: () => apiGet<T[]>(base),
    get: (id: string) => apiGet<T>(`${base}/${enc(id)}`),
    submit: (id: string, input: SubmitIn) => apiPost<SubmitOut>(`${base}/${enc(id)}/submit`, input),
    myResults: () => apiGet<Summary[]>(`${base}/me/results`),
    resultDetail: (resultId: number) => apiGet<Detail>(`${base}/me/results/${enc(resultId)}`),
    allResults: () => apiGet<Summary[]>(`${adminBase}/results`),
  }
}

/**
 * Qayta davom etadigan urinish (resume) oqimi — spetsifikatsiya:
 * POST {base}/{id}/attempts, GET {base}/attempts/{attempt_id}, PUT .../answers, POST .../finish, GET .../result.
 */
export function createAttemptApi(base: string) {
  return {
    startAttempt: (testId: string, partNumber?: number | null) =>
      apiPost<AttemptState>(`${base}/${enc(testId)}/attempts`, undefined, { query: { part_number: partNumber ?? undefined } }),
    getAttempt: (attemptId: number) => apiGet<AttemptState>(`${base}/attempts/${enc(attemptId)}`),
    saveAttemptAnswer: (attemptId: number, input: AttemptAnswerInput) =>
      apiPut<AttemptAnswerResult>(`${base}/attempts/${enc(attemptId)}/answers`, input),
    finishAttempt: (attemptId: number) => apiPost<unknown>(`${base}/attempts/${enc(attemptId)}/finish`),
    attemptResult: (attemptId: number) => apiGet<unknown>(`${base}/attempts/${enc(attemptId)}/result`),
  }
}

/** Qog'oz imtihon oqimi (Reading/Listening, admin): answer-key, versions, lock, paper PDF, OMR answer sheet. */
export function createPaperExamApi(adminBase: string) {
  return {
    answerKey: (id: string, version?: number) =>
      apiGet<AnswerKeyResponse>(`${adminBase}/${enc(id)}/answer-key`, { query: { version } }),
    versions: (id: string) => apiGet<ExamVersion[]>(`${adminBase}/${enc(id)}/versions`),
    lock: (id: string) => apiPost<LockResult>(`${adminBase}/${enc(id)}/lock`),
    paperPdfUrl: (id: string) => apiUrl(`${adminBase}/${enc(id)}/paper-pdf`),
    answerSheetUrl: (id: string) => apiUrl(`${adminBase}/${enc(id)}/answer-sheet`),
  }
}
