// 8/12 — WRITING: /writing-tests/* (talaba), /admin/writing-tests/* (admin)

import { apiDelete, apiGet, apiPost } from '../client'
import { apiUrl, enc } from '../config'
import { createAdminCrud, createLockApi, createTestTakingApi } from '../resource'
import { ROUTES } from '../routes'
import type {
  WritingAiEvaluateInput, WritingCreateInput, WritingExam, WritingFormat, WritingFormatCreateInput,
  WritingGradeInput, WritingResult, WritingSubmitInput, WritingUpdateInput,
} from '../types'

const BASE = ROUTES.writing
const ADMIN = ROUTES.writingAdmin

const crud = createAdminCrud<WritingExam, WritingCreateInput, WritingUpdateInput>(ADMIN, { update: 'put' })
const taking = createTestTakingApi<WritingExam, WritingSubmitInput, WritingResult, WritingResult>(BASE, ADMIN)

export const writingApi = {
  // --- Admin katalogi va CRUD ---
  adminList: crud.adminList,
  create: crud.create,
  importJson: crud.importJson,
  update: crud.update,
  remove: crud.remove,
  ...createLockApi(ADMIN),
  allResults: taking.allResults,
  paperPdfUrl: (examId: string) => apiUrl(`${ADMIN}/${enc(examId)}/paper-pdf`),

  // --- Admin/teacher: qo'lda va AI baholash (docs: /admin/writing-tests/pending, /results/{id}/grade, /ai-evaluate) ---
  pending: () => apiGet<WritingResult[]>(`${ADMIN}/pending`),
  grade: (resultId: number, input: WritingGradeInput) =>
    apiPost<WritingResult>(`${ADMIN}/results/${enc(resultId)}/grade`, input),
  aiEvaluate: (resultId: number, input: WritingAiEvaluateInput = {}) =>
    apiPost<WritingResult>(`${ADMIN}/results/${enc(resultId)}/ai-evaluate`, input),

  // --- Talaba ---
  getAll: taking.getAll,
  get: taking.get,
  submit: taking.submit,
  myResults: taking.myResults,
  /** Talaba AI tekshiruvi: POST /writing-tests/results/{id}/ai-check (answer_id ixtiyoriy) */
  aiCheck: (resultId: number, answerId?: number | null) =>
    apiPost<WritingResult>(`${BASE}/results/${enc(resultId)}/ai-check`, { answer_id: answerId ?? null }),
  /** Pullik teacher-review kreditini sarflab natijani o'qituvchi navbatiga qo'yadi: POST /writing-tests/results/{id}/request-teacher-check */
  requestTeacherCheck: (resultId: number) =>
    apiPost<WritingResult>(`${BASE}/results/${enc(resultId)}/request-teacher-check`),
  result: (resultId: number) => apiGet<WritingResult>(`${BASE}/results/${enc(resultId)}`),
  resultPdfUrl: (resultId: number) => apiUrl(`${BASE}/results/${enc(resultId)}/pdf`),

  // --- Baholash rubrikasi formatlari (o'qish ochiq, yaratish/o'chirish admin) ---
  createFormat: (input: WritingFormatCreateInput) => apiPost<WritingFormat>(`${ADMIN}/formats`, input),
  getAllFormats: () => apiGet<WritingFormat[]>(`${BASE}/formats`),
  getFormat: (formatId: number) => apiGet<WritingFormat>(`${BASE}/formats/${enc(formatId)}`),
  removeFormat: (formatId: number) => apiDelete<void>(`${ADMIN}/formats/${enc(formatId)}`),
}
