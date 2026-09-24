// 9/12 — SPEAKING: /speaking-tests/* (talaba), /admin/speaking-tests/* (admin va speaking_evaluator)

import { apiGet, apiPost, apiUpload } from '../client'
import { enc } from '../config'
import { createAdminCrud } from '../resource'
import { ROUTES } from '../routes'
import type {
  AssignedSpeakingTest, SpeakingMockAccessInput, SpeakingMockAccessResult, SpeakingResult, SpeakingResultInput,
  SpeakingSubmission, SpeakingTest, SpeakingTestCreateInput, SpeakingTestSummary, SpeakingTestUpdateInput,
} from '../types'

const BASE = ROUTES.speaking
const ADMIN = ROUTES.speakingAdmin

const crud = createAdminCrud<SpeakingTest, SpeakingTestCreateInput, SpeakingTestUpdateInput, SpeakingTestSummary>(
  ADMIN,
  { update: 'put' },
)

export const speakingApi = {
  // --- Admin: testlar CRUD (adminList — qisqa ro'yxat) ---
  adminList: crud.adminList,
  adminGet: crud.adminGet,
  create: crud.create,
  update: crud.update,
  remove: crud.remove,

  // --- Baholash (admin yoki speaking_evaluator) ---
  pendingSubmissions: () => apiGet<SpeakingSubmission[]>(`${ADMIN}/pending`),
  submitResult: (submissionId: number, input: SpeakingResultInput) =>
    apiPost<SpeakingResult>(`${ADMIN}/submissions/${enc(submissionId)}/result`, input),

  // --- Talaba ---
  practiceTests: () => apiGet<SpeakingTestSummary[]>(`${BASE}/practice`),
  practiceTest: (testId: string) => apiGet<SpeakingTest>(`${BASE}/practice/${enc(testId)}`),
  mockAccess: (input: SpeakingMockAccessInput) => apiPost<SpeakingMockAccessResult>(`${BASE}/mock-access`, input),

  assignedTest: (mockSkillAttemptId: number) =>
    apiGet<AssignedSpeakingTest>(`${BASE}/attempts/${enc(mockSkillAttemptId)}/assigned-test`),
  myAssignedTest: () => apiGet<AssignedSpeakingTest>(`${BASE}/me/assigned-test`),
  submitAudio: (speakingTestId: string, audio: File | Blob, mockSkillAttemptId?: number) =>
    apiUpload<SpeakingSubmission>(
      `${BASE}/${enc(speakingTestId)}/submit`,
      { file: new File([audio], 'answer.webm', { type: audio.type }) },
      { query: { mock_skill_attempt_id: mockSkillAttemptId } },
    ),
}
