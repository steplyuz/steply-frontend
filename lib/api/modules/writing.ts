// 8/12 — WRITING: /writing-tests/* (talaba), /admin/writing-tests/* (admin)

import { apiDelete, apiGet, apiPost } from '../client'
import { apiUrl, enc } from '../config'
import { createAdminCrud, createTestTakingApi } from '../resource'
import { ROUTES } from '../routes'
import type {
  WritingCreateInput, WritingExam, WritingFormat, WritingFormatCreateInput, WritingResult, WritingSubmitInput,
  WritingUpdateInput,
} from '../types'

const BASE = ROUTES.writing
const ADMIN = ROUTES.writingAdmin

const crud = createAdminCrud<WritingExam, WritingCreateInput, WritingUpdateInput>(ADMIN, { update: 'put' })
const taking = createTestTakingApi<WritingExam, WritingSubmitInput, WritingResult, WritingResult>(BASE, ADMIN)

export const writingApi = {
  // --- Admin ---
  create: crud.create,
  importJson: crud.importJson,
  update: crud.update,
  remove: crud.remove,
  allResults: taking.allResults,
  paperPdfUrl: (examId: string) => apiUrl(`${ADMIN}/${enc(examId)}/paper-pdf`),

  // --- Talaba ---
  getAll: taking.getAll,
  get: taking.get,
  submit: taking.submit,
  myResults: taking.myResults,
  result: (resultId: number) => apiGet<WritingResult>(`${BASE}/results/${enc(resultId)}`),
  resultPdfUrl: (resultId: number) => apiUrl(`${BASE}/results/${enc(resultId)}/pdf`),

  // --- Baholash rubrikasi formatlari (o'qish ochiq, yaratish/o'chirish admin) ---
  createFormat: (input: WritingFormatCreateInput) => apiPost<WritingFormat>(`${ADMIN}/formats`, input),
  getAllFormats: () => apiGet<WritingFormat[]>(`${BASE}/formats`),
  getFormat: (formatId: number) => apiGet<WritingFormat>(`${BASE}/formats/${enc(formatId)}`),
  removeFormat: (formatId: number) => apiDelete<void>(`${ADMIN}/formats/${enc(formatId)}`),
}
