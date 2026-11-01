// PRACTICE — Writing. GET /writing-tests, GET /writing-tests/{id},
// POST /writing-tests/{id}/submit. Natija is_finalized=false bilan qaytadi;
// baholashni o'qituvchi/admin keyin amalga oshiradi.
import { writingApi } from '@/lib/api'
import type { WritingExam, WritingResult } from '@/lib/api/types'

export interface WritingAnswerItem {
  task_id: number
  content: string
}

export interface WritingSubmission {
  answers: WritingAnswerItem[]
  exam_attempt_id?: number | null
}

export const getAllWritingExamsAPI = async () => {
  return { data: (await writingApi.getAll()) as WritingExam[] }
}

export const getWritingExamByIdAPI = async (examId: string) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await writingApi.get(examId)) as WritingExam }
}

export const submitWritingExamAPI = async (examId: string, payload: WritingSubmission) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await writingApi.submit(examId, payload)) as WritingResult }
}
