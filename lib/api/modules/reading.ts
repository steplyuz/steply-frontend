// 6/12 — READING: /reading-tests/* (talaba), /admin/reading-tests/* (admin)

import { apiRequest, apiUpload } from '../client'
import { createAdminCrud, createAttemptApi, createPaperExamApi, createTestTakingApi } from '../resource'
import { ROUTES } from '../routes'
import type {
  ReadingCreateInput, ReadingResultDetail, ReadingResultSummary, ReadingSubmitInput, ReadingTest,
  ReadingUpdateInput,
} from '../types'

const BASE = ROUTES.reading
const ADMIN = ROUTES.readingAdmin

const crud = createAdminCrud<ReadingTest, ReadingCreateInput, ReadingUpdateInput>(ADMIN, { update: 'put' })
const taking = createTestTakingApi<
  ReadingTest, ReadingSubmitInput, ReadingResultDetail, ReadingResultSummary, ReadingResultDetail
>(BASE, ADMIN)

export const readingApi = {
  uploadImage: (file: File) => apiUpload<{ url: string; filename: string; size: number }>(`${ADMIN}/images/upload`, { file }),
  // --- Resume urinish (spetsifikatsiya: /reading-tests/{id}/attempts, /reading-tests/attempts/{id}/...) ---
  ...createAttemptApi(BASE),

  // --- Admin katalogi va CRUD (adminGet — to'g'ri javoblar bilan) ---
  adminList: crud.adminList,
  create: crud.create,
  importJson: crud.importJson,
  adminGet: crud.adminGet,
  update: crud.update,
  remove: crud.remove,
  allResults: taking.allResults,

  // --- Talaba (to'g'ri javobsiz) ---
  getAll: taking.getAll,
  get: taking.get,
  submit: taking.submit,
  myResults: taking.myResults,
  resultDetail: taking.resultDetail,

  createPartMiniTests: (testId: string) => apiRequest<{ source_test_id: string; created_count: number; total_count: number; tests: Array<Pick<ReadingTest, 'id' | 'title' | 'practice_part_number'>> }>(`${ADMIN}/${encodeURIComponent(testId)}/part-mini-tests`, { method: 'POST' }),

  // --- Lock / versions / answer-key / paper PDF / OMR answer sheet (admin) ---
  ...createPaperExamApi(ADMIN),
}
