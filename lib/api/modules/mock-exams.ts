// 4/12 — MOCK EXAMS: /mock-exams/* (talaba), /admin/mock-exams/* (admin)
//
// Diqqat: haqiqiy imtihon TOPSHIRISH (start/status/submit/finish) bu modulda YO'Q — backend bu
// oqimni alohida `/exams-auth` + `/exams/*` (MK ID + SMS autentifikatsiya) tizimiga ko'chirgan.
//
// `mock-center.ts` (check-in, ball qo'yish, natijalar) — bundan alohida modul, aralashtirmang.

import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '../client'
import { apiUrl, enc } from '../config'
import { createAdminCrud } from '../resource'
import { ROUTES } from '../routes'
import type {
  ExamSession, ExamSessionCreateInput, GradeWithKeysInput, JsonObject, MockExam, MockExamCreateInput,
  MockExamPurchase, MockExamUpdateInput, RegisterForSessionInput, SessionRegistration, SkillType,
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
  deleteSession: (sessionId: number) => apiDelete<void>(`${ADMIN}/sessions/${enc(sessionId)}`), // faqat bo'sh sessiya
  adminSessions: () => apiGet<ExamSession[]>(`${ADMIN}/sessions`),
  openSessions: () => apiGet<ExamSession[]>(`${BASE}/sessions/open`),

  sessionRegistrations: (sessionId: number) =>
    apiGet<SessionRegistration[]>(`${ADMIN}/sessions/${enc(sessionId)}/registrations`),
  confirmAttendance: (registrationId: number) =>
    apiPost<SessionRegistration>(`${ADMIN}/registrations/${enc(registrationId)}/confirm-attendance`),

  myRegistrations: () => apiGet<SessionRegistration[]>(`${BASE}/me/registrations`),
  registerForSession: (input: RegisterForSessionInput) => apiPost<SessionRegistration>(`${BASE}/sessions/register`, input),

  // --- Qo'lda baholash / urinish tafsiloti (admin) ---
  adminAttempt: (attemptId: number) => apiGet<JsonObject>(`${ADMIN}/attempts/${enc(attemptId)}`),
  manualGrade: (attemptId: number, input: { skill: SkillType; scaled_score: number; raw_score?: number | null; comment?: string | null }) =>
    apiPost<JsonObject>(`${ADMIN}/attempts/${enc(attemptId)}/manual-grade`, input),

  // --- Qog'oz materiallar (admin) — yuklab olish URL'lari, authenticatedDownload bilan ishlating ---
  listeningPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/listening.pdf`),
  readingPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/reading.pdf`),
  writingPaperUrl: (mockExamId: string) => apiUrl(`${PAPERS}/${enc(mockExamId)}/writing.pdf`),
  answerSheetsBulkZipUrl: (sessionId: number) => apiUrl(`${PAPERS}/sessions/${enc(sessionId)}/answer-sheets-bulk.zip`),
  /** Bitta applicant (public /apply orqali ro'yxatdan o'tgan) javob varaqasi: GET /admin/mock-sessions/{sid}/applicants/{aid}/answer-sheet.pdf */
  applicantAnswerSheetUrl: (sessionId: number, applicantId: number) =>
    apiUrl(`/admin/mock-sessions/${enc(sessionId)}/applicants/${enc(applicantId)}/answer-sheet.pdf`),
  /** Sessiyaning barcha applicantlari uchun ZIP: GET /admin/mock-sessions/{sid}/answer-sheets-bulk.zip */
  applicantAnswerSheetsBulkZipUrl: (sessionId: number) =>
    apiUrl(`/admin/mock-sessions/${enc(sessionId)}/answer-sheets-bulk.zip`),
  sessionBundleZipUrl: (sessionId: number) => apiUrl(`${PAPERS}/sessions/${enc(sessionId)}/bundle.zip`),

  // --- AI orqali javob varaqlarini tekshirish (admin) ---
  gradeAnswerSheets: (images: File[]) => apiUpload<JsonObject>(`${GRADE}/answer-sheets`, { images }),
  gradeAnswerSheetsWithKeys: (images: File[], input: GradeWithKeysInput) =>
    apiUpload<JsonObject>(`${GRADE}/answer-sheets/with-keys`, { images, ...input }),
  saveGradedAnswerSheets: (input: JsonObject) => apiPost<JsonObject>(`${GRADE}/answer-sheets/save`, input),
  processAndSaveAnswerSheets: (images: File[], input: { exam_id: string; session_id?: number; candidate_ids?: string }) =>
    apiUpload<JsonObject>(`${GRADE}/answer-sheets/process-and-save`, { images, ...input }),
  /** OMR skan rasmi: GET /admin/mock-exams/grade/omr/{submission_id}/image/{image_index} */
  omrImageUrl: (submissionId: number, imageIndex: number) =>
    apiUrl(`${GRADE}/omr/${enc(submissionId)}/image/${enc(imageIndex)}`),
  previewAnswerSheet: (image: File) => apiUpload<JsonObject>(`${GRADE}/answer-sheets/preview`, { image }),
}
