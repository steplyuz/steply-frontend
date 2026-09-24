// 4/12 — MOCK EXAMS: /mock-exams/* (talaba), /admin/mock-exams/* (admin)
//
// Diqqat: haqiqiy imtihon TOPSHIRISH (start/status/submit/finish) bu modulda YO'Q — backend bu
// oqimni alohida `/exams-auth` + `/exams/*` (MK ID + SMS autentifikatsiya) tizimiga ko'chirgan.
// Bu frontend hozircha o'sha oqimni amalga oshirmaydi.
//
// `mock-center.ts` (check-in, ball qo'yish, natijalar) — bundan alohida modul, aralashtirmang.

import { apiGet, apiPatch, apiPost, apiUpload } from '../client'
import { apiUrl, enc } from '../config'
import { createAdminCrud } from '../resource'
import { ROUTES } from '../routes'
import type {
  ExamSession, ExamSessionCreateInput, GradeWithKeysInput, JsonObject, MockExam, MockExamCreateInput,
  MockExamPurchase, MockExamUpdateInput, SessionRegistration,
} from '../types'

const BASE = ROUTES.mockExams
const ADMIN = ROUTES.mockExamsAdmin
const PAPERS = ROUTES.mockExamsPapersAdmin
const GRADE = ROUTES.mockExamsGradeAdmin

const crud = createAdminCrud<MockExam, MockExamCreateInput, MockExamUpdateInput>(ADMIN, { update: 'patch' })

export const mockExamsApi = {
  // --- Admin: imtihonlar CRUD ---
  adminList: crud.adminList,
  adminGet: crud.adminGet,
  create: crud.create,
  update: crud.update,
  remove: crud.remove,

  // --- Talaba ---
  getAll: () => apiGet<MockExam[]>(BASE),
  buy: (examId: string) => apiPost<MockExamPurchase>(`${BASE}/${enc(examId)}/buy`),

  // --- Sessiyalar (qog'oz imtihon, offline) ---
  createSession: (input: ExamSessionCreateInput) => apiPost<ExamSession>(`${ADMIN}/sessions`, input),
  updateSession: (sessionId: number, input: Partial<ExamSessionCreateInput>) =>
    apiPatch<ExamSession>(`${ADMIN}/sessions/${enc(sessionId)}`, input),
  adminSessions: () => apiGet<ExamSession[]>(`${ADMIN}/sessions`),
  openSessions: () => apiGet<ExamSession[]>(`${BASE}/sessions/open`),

  sessionRegistrations: (sessionId: number) =>
    apiGet<SessionRegistration[]>(`${ADMIN}/sessions/${enc(sessionId)}/registrations`),
  confirmAttendance: (registrationId: number) =>
    apiPost<SessionRegistration>(`${ADMIN}/registrations/${enc(registrationId)}/confirm-attendance`),

  myRegistrations: () => apiGet<SessionRegistration[]>(`${BASE}/me/registrations`),

  // --- Qog'oz materiallar (admin) — yuklab olish URL'lari, authenticatedDownload bilan ishlating ---
  listeningPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/listening.pdf`),
  readingPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/reading.pdf`),
  writingPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/writing.pdf`),
  answerSheetsBulkZipUrl: (sessionId: number) => apiUrl(`${PAPERS}/sessions/${enc(sessionId)}/answer-sheets-bulk.zip`),
  sessionBundleZipUrl: (sessionId: number) => apiUrl(`${PAPERS}/sessions/${enc(sessionId)}/bundle.zip`),

  // --- AI orqali javob varaqlarini tekshirish (admin) ---
  gradeAnswerSheets: (images: File[]) => apiUpload<JsonObject>(`${GRADE}/answer-sheets`, { images }),
  gradeAnswerSheetsWithKeys: (images: File[], input: GradeWithKeysInput) =>
    apiUpload<JsonObject>(`${GRADE}/answer-sheets/with-keys`, { images, ...input }),
  saveGradedAnswerSheets: (input: JsonObject) => apiPost<JsonObject>(`${GRADE}/answer-sheets/save`, input),
  previewAnswerSheet: (image: File) => apiUpload<JsonObject>(`${GRADE}/answer-sheets/preview`, { image }),
}
