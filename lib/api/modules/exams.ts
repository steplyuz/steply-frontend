import { apiGet, apiPost, apiPatch } from '../client'
import type { JsonObject } from './common'

// We define basic types for exams here to avoid breaking if not present in types/
export type ExamIdLoginResponse = JsonObject
export type ExamsTokenResponse = JsonObject
export type ExamsStudentResponse = JsonObject
export type ExamsStatusResponse = JsonObject
export type EnrolledExamResponse = JsonObject
export type MockExamStartResponse = JsonObject
export type MockSkillStatusResponse = JsonObject
export type MockExamResultResponse = JsonObject
export type ReadingResultDetailResponse = JsonObject
export type ListeningResultDetailResponse = JsonObject
export type WritingResultRead = JsonObject
export type SpeakingAssignedTestResponse = JsonObject
export type SpeakingSubmissionResponse = JsonObject

const BASE = '/exams-auth'
const EXAMS = '/exams'

export const examsAuthApi = {
  login: (exam_id: string) => apiPost<ExamIdLoginResponse>(`${BASE}/login`, { exam_id }),
  me: () => apiGet<ExamsStudentResponse>(`${BASE}/me`),
  refresh: () => apiPost<ExamsStatusResponse>(`${BASE}/refresh`),
  logout: () => apiPost<ExamsStatusResponse>(`${BASE}/logout`),
}

export const examsApi = {
  myExams: () => apiGet<EnrolledExamResponse[]>(EXAMS),
  
  start: (examId: string) => apiPost<MockExamStartResponse>(`${EXAMS}/${examId}/start`),
  
  attemptStatus: (attemptId: number) => apiGet<MockSkillStatusResponse[]>(`${EXAMS}/attempts/${attemptId}/status`),
  
  autosaveSkill: (attemptId: number, skill: string, data: any) => 
    apiPatch<void>(`${EXAMS}/attempts/${attemptId}/progress/${skill}`, data),
    
  submitSkill: (attemptId: number, skill: string) => 
    apiPost<void>(`${EXAMS}/attempts/${attemptId}/submit/${skill}`),
    
  finishExam: (attemptId: number) => 
    apiPost<MockExamResultResponse>(`${EXAMS}/attempts/${attemptId}/finish`),
    
  result: (attemptId: number) => 
    apiGet<MockExamResultResponse>(`${EXAMS}/attempts/${attemptId}/result`),
    
  // Submissions (returns detailed result)
  submitReading: (testId: string, answers: any) => 
    apiPost<ReadingResultDetailResponse>(`${EXAMS}/reading/${testId}/submit`, answers),
    
  submitListening: (examId: string, answers: any) => 
    apiPost<ListeningResultDetailResponse>(`${EXAMS}/listening/${examId}/submit`, answers),
    
  submitWriting: (examId: string, answers: any) => 
    apiPost<WritingResultRead>(`${EXAMS}/writing/${examId}/submit`, answers),
    
  getAssignedSpeaking: () => 
    apiGet<SpeakingAssignedTestResponse>(`${EXAMS}/speaking/me/assigned-test`),
    
  submitSpeaking: (testId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1${EXAMS}/speaking/${testId}/submit`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    }).then(res => res.json())
  }
}
