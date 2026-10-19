// Exams platformasi API moduli: /exams-auth/* va /exams/*
//
// Bu modul FAQAT exam_access_id orqali autentifikatsiya qilingan
// exam portali (examx.steply.uz) uchun. Asosiy Steply login tizimidan
// mustaqil — alohida cookie, alohida sessiya.

import { apiGet, apiPost, apiPatch, apiPut, apiUpload } from '../client'
import type {
  ExamIdLoginRequest,
  ExamIdLoginResponse,
  ExamsStudentResponse,
  ExamsStatusResponse,
  EnrolledExamResponse,
  MyExamSkillsResponse,
  MockExamStartResponse,
  MockSkillStatusResponse,
  MockSkillAutosaveRequest,
  MockExamResultResponse,
  SpeakingAssignedTestResponse,
  SpeakingSubmissionResponse,
} from '../types/exams'
import type { ReadingResultDetail, ReadingSubmitInput, ReadingTest } from '../types/reading'
import type { ListeningResultDetail, ListeningSubmitInput, ListeningTest } from '../types/listening'
import type { WritingExam, WritingResult, WritingSubmitInput } from '../types/writing'
import type { AttemptAnswerInput, AttemptAnswerResult, AttemptState, SkillType } from '../types/common'
import { apiUrl, enc } from '../config'

const BASE = '/exams-auth'
const EXAMS = '/exams'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const examsAuthApi = {
  /** Exam Access ID bilan kirish (telefon talab qilinmaydi) */
  login: (exam_id: string | null, extra?: { student_id?: string | null; phone_last4?: string | null }) =>
    apiPost<ExamIdLoginResponse>(`${BASE}/login`, { exam_id, ...extra } satisfies ExamIdLoginRequest),

  /** Joriy exam sessiyasi foydalanuvchi ma'lumotlari */
  me: () => apiGet<ExamsStudentResponse>(`${BASE}/me`),

  /** Tokenni yangilash */
  refresh: () => apiPost<ExamsStatusResponse>(`${BASE}/refresh`),

  /** Faqat exam sessiyasidan chiqish (asosiy Steply sessiyaga tegmaydi) */
  logout: () => apiPost<ExamsStatusResponse>(`${BASE}/logout`),
}

// ── Exam oqimi ────────────────────────────────────────────────────────────────

export const examsApi = {
  /** Talabaga biriktirilgan imtihonlar (myExams bilan bir xil endpoint) */
  list: () => apiGet<EnrolledExamResponse[]>(EXAMS),
  /** Attempt skill holati */
  status: (attemptId: number) => apiGet<MockSkillStatusResponse[]>(`${EXAMS}/attempts/${attemptId}/status`),
  /** Imtihonni yakunlash */
  finish: (attemptId: number) => apiPost<MockExamResultResponse>(`${EXAMS}/attempts/${attemptId}/finish`),
  /** Mavjud skill natijasini urinishga olish */
  pullSkillFromExistingResult: (attemptId: number, skill: SkillType) =>
    apiGet<unknown>(`${EXAMS}/attempts/${attemptId}/results/${skill}`),
  /** Speaking: talabaga biriktirilgan test */
  myAssignedSpeakingTest: () => apiGet<SpeakingAssignedTestResponse>(`${EXAMS}/speaking/me/assigned-test`),
  /**
   * Token ga biriktirilgan yagona imtihon ma'lumotlari (4 skill ID bilan).
   * Exam ID bilan kirgan talaba faqat O'SHA imtihonni ko'radi.
   */
  myExams: () => apiGet<EnrolledExamResponse[]>(EXAMS),

  /**
   * Faqat joriy imtihonga biriktirilgan 4 skill test IDlari va ularning holati.
   * Frontend bu endpoint orqali qaysi reading/listening/writing/speaking
   * testini ko'rsatishni aniqlaydi — boshqa testlar ko'rsatilmaydi.
   */
  mySkills: () => apiGet<MyExamSkillsResponse>(`${EXAMS}/my-skills`),

  /** Imtihonni boshlash (attempt yaratish yoki mavjudini qaytarish) */
  start: (examId: string) =>
    apiPost<MockExamStartResponse>(`${EXAMS}/${examId}/start`),

  /** Attempt holati: 4 skill ham topshirilganmi? */
  attemptStatus: (attemptId: number) =>
    apiGet<MockSkillStatusResponse[]>(`${EXAMS}/attempts/${attemptId}/status`),

  /** Skill progressini saqlash (autosave — har 30 sekundda) */
  autosaveSkill: (attemptId: number, skill: SkillType, data: MockSkillAutosaveRequest) =>
    apiPatch<void>(`${EXAMS}/attempts/${enc(attemptId)}/progress/${skill}`, data),

  /** Skillni tugatganlik belgisi (submit) */
  submitSkill: (attemptId: number, skill: SkillType) =>
    apiPost<void>(`${EXAMS}/attempts/${enc(attemptId)}/submit/${skill}`),

  /** Barcha 4 skill topshirilgandan so'ng imtihonni yakunlash */
  finishExam: (attemptId: number) =>
    apiPost<MockExamResultResponse>(`${EXAMS}/attempts/${attemptId}/finish`),

  /** Yakunlangan imtihon natijasi */
  result: (attemptId: number) =>
    apiGet<MockExamResultResponse>(`${EXAMS}/attempts/${attemptId}/result`),

  // ── Skill javoblari (resume) va natija ─────────────────────────────────────
  /** GET /exams/attempts/{id}/answers/{skill} — saqlangan javoblar */
  savedAnswers: (attemptId: number, skill: SkillType) =>
    apiGet<AttemptState>(`${EXAMS}/attempts/${enc(attemptId)}/answers/${skill}`),
  /** PUT /exams/attempts/{id}/answers/{skill} — bitta javobni saqlash (idempotent) */
  saveAnswer: (attemptId: number, skill: SkillType, input: AttemptAnswerInput) =>
    apiPut<AttemptAnswerResult>(`${EXAMS}/attempts/${enc(attemptId)}/answers/${skill}`, input),
  /** GET /exams/attempts/{id}/results/{skill} — bitta skill natijasi */
  skillResult: (attemptId: number, skill: SkillType) =>
    apiGet<unknown>(`${EXAMS}/attempts/${enc(attemptId)}/results/${skill}`),
  /** Speaking audio (imtihon sessiyasi): GET /exams/speaking/submissions/{id}/audio */
  speakingAudioUrl: (submissionId: number) => apiUrl(`${EXAMS}/speaking/submissions/${enc(submissionId)}/audio`),

  // ── Test KONTENTI (faqat biriktirilgan test) ────────────────────────────────
  // Imtihon sessiyasi bilan umumiy /reading-tests/{id}, /listening-tests/{id},
  // /writing-tests/{id} ga murojaat qilmang — ular 401/403 qaytarishi mumkin.
  // Docs: GET /exams/reading|listening|writing/{id} — "Faqat biriktirilgan ... test kontenti".

  readingContent: (testId: string) => apiGet<ReadingTest>(`${EXAMS}/reading/${enc(testId)}`),
  listeningContent: (examId: string) => apiGet<ListeningTest>(`${EXAMS}/listening/${enc(examId)}`),
  writingContent: (examId: string) => apiGet<WritingExam>(`${EXAMS}/writing/${enc(examId)}`),

  // ── Skill javoblarini yuborish ──────────────────────────────────────────────
  // Har bir submit: exam sessiyasining faqat biriktirilgan test IDiga ruxsat beriladi.
  // Boshqa test ID bilan yuborilsa backend 403 qaytaradi.

  /** Reading javoblarini yuborish */
  submitReading: (testId: string, input: ReadingSubmitInput) =>
    apiPost<ReadingResultDetail>(`${EXAMS}/reading/${testId}/submit`, input),

  /** Listening javoblarini yuborish */
  submitListening: (examId: string, input: ListeningSubmitInput) =>
    apiPost<ListeningResultDetail>(`${EXAMS}/listening/${examId}/submit`, input),

  /** Writing javoblarini yuborish */
  submitWriting: (examId: string, input: WritingSubmitInput) =>
    apiPost<WritingResult>(`${EXAMS}/writing/${examId}/submit`, input),

  /** Biriktirilgan Speaking testini olish */
  getAssignedSpeaking: () =>
    apiGet<SpeakingAssignedTestResponse>(`${EXAMS}/speaking/me/assigned-test`),

  /**
   * Speaking audio faylini yuborish.
   * `mockSkillAttemptId` — getAssignedSpeaking().skill_attempt_id (docs: query `mock_skill_attempt_id`).
   */
  submitSpeaking: (speakingTestId: string, audioFile: File, mockSkillAttemptId?: number | null) =>
    apiUpload<SpeakingSubmissionResponse>(
      `${EXAMS}/speaking/${enc(speakingTestId)}/submit`,
      { file: audioFile },
      { query: { mock_skill_attempt_id: mockSkillAttemptId ?? undefined } },
    ),
}
