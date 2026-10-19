// 5/12 — MOCK CENTER (paper-based): /mock-exams/center/me/* (talaba), /admin/mock-exams/center/* (admin)
//
// `mock-exams.ts` dagi sessiya oqimidan alohida "mock center" moduli. Ro'yxatdan o'tishning o'zi
// umumiy `/mock-exams/sessions/register` orqali amalga oshadi, natija va ro'yxatlarni ko'rish esa
// `/mock-exams/center/me/*` orqali.

import { apiGet, apiPost } from '../client'
import { apiUrl, enc } from '../config'
import { ROUTES } from '../routes'
import type {
  CheckInResult, FinalizeResult, MockAttemptDetail, MockCenterRegistrationDetail, MockFinalResult,
  RegisterForSessionInput, SessionRegistration, SkillScoreResult, SkillType, WritingPendingItem,
  WritingPendingStatus,
} from '../types'

const ME = ROUTES.mockCenter
const ADMIN = ROUTES.mockCenterAdmin

export const mockCenterApi = {
  // --- Talaba (registered) ---
  registerForSession: (input: RegisterForSessionInput) => apiPost<SessionRegistration>(`${ROUTES.mockExams}/sessions/register`, input),
  myRegistrations: () => apiGet<SessionRegistration[]>(`${ME}/registrations`),
  registration: (id: number) => apiGet<MockCenterRegistrationDetail>(`${ME}/registrations/${enc(id)}`),
  permitUrl: (id: number) => apiUrl(`${ME}/registrations/${enc(id)}/permit.pdf`),
  myResults: () => apiGet<MockFinalResult[]>(`${ME}/results`),
  result: (id: number) => apiGet<MockFinalResult>(`${ME}/results/${enc(id)}`),
  resultPdfUrl: (id: number) => apiUrl(`${ME}/results/${enc(id)}/pdf`),

  // --- Admin (require_role ADMIN) ---
  checkInSearch: (studentId: string, sessionId?: number) =>
    apiGet<CheckInResult>(`${ADMIN}/check-in/search`, { query: { student_id: studentId, session_id: sessionId } }),
  checkIn: (studentId: string, sessionId?: number) =>
    apiPost<CheckInResult>(`${ADMIN}/check-in`, { student_id: studentId, session_id: sessionId }),
  attempt: (attemptId: number) => apiGet<MockAttemptDetail>(`${ADMIN}/attempts/${enc(attemptId)}`),
  scoreSkill: (attemptId: number, skill: SkillType, scaled_score: number, raw_score?: number) =>
    apiPost<SkillScoreResult>(`${ADMIN}/attempts/${enc(attemptId)}/skills/${skill}/score`, { scaled_score, raw_score }),
  finalizeAttempt: (attemptId: number, send_sms = false) =>
    apiPost<FinalizeResult>(`${ADMIN}/attempts/${enc(attemptId)}/finalize`, { send_sms }),
  writingPending: (status: WritingPendingStatus = 'pending') =>
    apiGet<WritingPendingItem[]>(`${ADMIN}/writing/pending`, { query: { status } }),
}
