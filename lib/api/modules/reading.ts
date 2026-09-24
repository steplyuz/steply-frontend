// 6/12 — READING: /reading-tests/* (talaba), /admin/reading-tests/* (admin)

import { createAdminCrud, createPaperExamApi, createTestTakingApi } from '../resource'
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
  // --- Admin (adminGet — to'g'ri javoblar bilan) ---
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

  // --- Lock / versions / answer-key / paper PDF / OMR answer sheet (admin) ---
  ...createPaperExamApi(ADMIN),
}
