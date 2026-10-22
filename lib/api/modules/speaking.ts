// 9/12 — SPEAKING: /speaking-tests/* (talaba), /admin/speaking-tests/* (admin va speaking_evaluator)

import { apiGet, apiPost, apiUpload } from '../client'
import { apiUrl, enc } from '../config'
import { createAdminCrud, createLockApi } from '../resource'
import { ROUTES } from '../routes'
import type {
  JsonObject, SpeakingRecordingDraft, SpeakingRecordingSubmission,
  SpeakingResult, SpeakingResultInput, SpeakingSubmission, SpeakingTest, SpeakingTestCreateInput,
  SpeakingTestSummary, SpeakingTestUpdateInput,
} from '../types'

const BASE = ROUTES.speaking
const ADMIN = ROUTES.speakingAdmin

const crud = createAdminCrud<SpeakingTest, SpeakingTestCreateInput, SpeakingTestUpdateInput, SpeakingTestSummary>(
  ADMIN,
  { update: 'put' },
)

export const speakingApi = {
  // --- Admin: testlar CRUD (adminList — qisqa ro'yxat) ---
  uploadImage: (file: File) => apiUpload<{ url: string; filename: string; size: number }>(`${ADMIN}/images/upload`, { file }),
  adminList: crud.adminList,
  adminGet: crud.adminGet,
  create: crud.create,
  importJson: crud.importJson,
  update: crud.update,
  remove: crud.remove,
  ...createLockApi(ADMIN),

  // --- Baholash (admin yoki speaking_evaluator) ---
  pendingSubmissions: (query?: { limit?: number; offset?: number }) =>
    apiGet<SpeakingSubmission[]>(`${ADMIN}/pending`, { query }),
  submitResult: (submissionId: number, input: SpeakingResultInput) =>
    apiPost<SpeakingResult>(`${ADMIN}/submissions/${enc(submissionId)}/result`, input),

  // --- Practice javobi va audio (spetsifikatsiya: /speaking-tests/{id}/practice/submit, /submissions/{id}/audio) ---
  practiceSubmit: (speakingTestId: string, questionExternalId: string, audio: Blob, partExternalId?: string | null) =>
    apiUpload<SpeakingRecordingSubmission>(`${BASE}/${enc(speakingTestId)}/practice/submit`, { file: audio }, {
      query: { part_external_id: partExternalId ?? undefined, question_external_id: questionExternalId },
    }),
  submissionAudioUrl: (submissionId: number) => apiUrl(`${BASE}/submissions/${enc(submissionId)}/audio`),

  // --- Talaba ---
  /** Talabaning speaking natijalari: GET /speaking-tests/me/results */
  myResults: () => apiGet<SpeakingResult[]>(`${BASE}/me/results`),
  practiceTests: () => apiGet<SpeakingTestSummary[]>(`${BASE}/practice`),
  practiceTest: (testId: string) => apiGet<SpeakingTest>(`${BASE}/practice/${enc(testId)}`),
  /** Savollar PDF: GET /speaking-tests/practice/{id}/paper.pdf (authenticatedDownload bilan oching). */
  practicePaperUrl: (testId: string) => apiUrl(`${BASE}/practice/${enc(testId)}/paper.pdf`),

  // --- Ovoz yozuvi (chunk bilan yuklash) ---
  // Backend endi bitta faylni emas, mikrofon yozuvini bo'lak-bo'lak (chunk) qabul qiladi:
  // har chunk /recording-draft/chunk ga ketadi, oxirida /recording-draft/{id}/finalize
  // qoralamani yakuniy submissionga aylantiradi. Brauzer crash bo'lsa ham
  // getRecordingDraft orqali qayerdan davom etishni (next_chunk_index) bilish mumkin.
  getRecordingDraft: (params: RecordingDraftQuery) =>
    apiGet<SpeakingRecordingDraft>(`${BASE}/recording-draft`, { query: params }),

  uploadRecordingChunk: (speakingTestId: string, params: RecordingChunkQuery, chunk: Blob) =>
    apiUpload<SpeakingRecordingDraft>(`${BASE}/${enc(speakingTestId)}/recording-draft/chunk`, { file: chunk }, {
      query: params,
    }),

  finalizeRecording: (draftId: number) =>
    apiPost<SpeakingRecordingSubmission>(`${BASE}/recording-draft/${enc(draftId)}/finalize`),
}

interface RecordingDraftQuery extends Record<string, string | number | boolean | undefined | null> {
  skill_attempt_id: number
  part_external_id: string
  question_external_id: string
}

interface RecordingChunkQuery extends RecordingDraftQuery {
  chunk_index: number
  duration_seconds?: number
}
