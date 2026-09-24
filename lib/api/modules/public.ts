// 3/12 — PUBLIC: /public/*  (token shart emas, hamma ko'ra oladi)

import { apiGet } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  MockExam, PublicExamDetail, PublicExamSession, PublicSessionDetail, PublicStats, VerifiedResult,
} from '../types'

const BASE = ROUTES.public
const anon = { anonymous: true } as const

export const publicApi = {
  mockExams: () => apiGet<MockExam[]>(`${BASE}/mock-exams`, anon),
  mockExam: (examId: string) => apiGet<PublicExamDetail>(`${BASE}/mock-exams/${enc(examId)}`, anon),
  examSessions: (examId: string) => apiGet<PublicExamSession[]>(`${BASE}/mock-exams/${enc(examId)}/sessions`, anon),

  sessions: (region?: string) => apiGet<PublicExamSession[]>(`${BASE}/sessions`, { ...anon, query: { region } }),
  session: (sessionId: number) => apiGet<PublicSessionDetail>(`${BASE}/sessions/${enc(sessionId)}`, anon),

  stats: () => apiGet<PublicStats>(`${BASE}/stats`, anon),
  resultByQr: (token: string) => apiGet<VerifiedResult>(`${BASE}/results/by-qr/${enc(token)}`, anon),
}
