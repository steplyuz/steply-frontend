// PRACTICE — Listening. GET /listening-tests/{id},
// POST /listening-tests/{id}/submit  (body: { exam_id, user_answers, exam_attempt_id? })
import { listeningApi } from '@/shared/api'
import type { ListeningResultDetail, ListeningTest } from '@/shared/api/types'

export interface ListeningSubmission {
  exam_id: string
  user_answers: Record<string, string>
  exam_attempt_id?: number | null
}

export const getListeningExamByIdAPI = async (examId: string) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await listeningApi.get(examId)) as ListeningTest }
}

export const submitListeningExamAPI = async (data: ListeningSubmission) => {
  if (!data.exam_id) throw new Error('exam_id is required')
  return {
    data: (await listeningApi.submit(data.exam_id, {
      exam_id: data.exam_id,
      user_answers: data.user_answers,
      exam_attempt_id: data.exam_attempt_id ?? null,
    })) as ListeningResultDetail,
  }
}
