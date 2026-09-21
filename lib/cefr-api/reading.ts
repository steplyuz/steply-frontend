import api from './axios'
import {
  ReadingExam,
  ReadingExamUpdate,
  ResultSummary,
  ReadingResultDetail,
} from '../cefr-types/reading'

/**
 * Backend prefix: /v1/api/cefr/all/reading
 */
const BASE_URL = '/reading-test'

// 1. GET ALL TESTS
export const getAllReadingExamsAPI = () => {
  return api.get<ReadingExam[]>(`${BASE_URL}/get_all`)
}

// 2. GET SINGLE TEST
export const getReadingExamByIdAPI = (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return api.get<ReadingExam>(`${BASE_URL}/get/${testId}`)
}

// 3. SUBMIT ANSWERS (⚠️ Tuzatildi: Swagger'dagi "answers" massiviga moslandi)
export interface AnswerItem {
  question_id: number
  answers: string[]
}

export interface ReadingSubmission {
  answers: AnswerItem[]
  exam_attempt_id: number | null
}

export const submitReadingExamAPI = (testId: string, data: ReadingSubmission) => {
  // Xatolikni oldini olish uchun tekshiruv
  if (!testId || typeof testId !== 'string') {
    console.error("XATO: testId noto'g'ri formatda:", testId)
    throw new Error('testId is required and must be a string')
  }

  return api.post<ReadingResultDetail>(`${BASE_URL}/answer/${testId}/submit`, data)
}

// 4. MY RECENT RESULT (By Test ID)
// ⚠️ Backendda bu endpoint YO'Q ("/{test_id}/my-result" mavjud emas — faqat
// "/my-results/all" va "/results/{result_id}" bor). Shu funksiya chaqirilsa
// 404 qaytaradi. Hozircha hech qayerda ishlatilmayapti; kerak bo'lsa
// `getMyReadingResultsAPI()` bilan ro'yxatdan filtrlang yoki backendga
// yangi endpoint qo'shishni so'rang.
export const getMyReadingResultAPI = (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return api.get<ReadingResultDetail>(`${BASE_URL}/${testId}/my-result`)
}

// 5. GET ALL MY RESULTS
// 5. BARCHA NATIJALARNI OLISH (Ro'yxat uchun)
export const getMyReadingResultsAPI = () => {
  // Swaggerda: /cefr/all/reading/my-results/all
  // Bu yerda massiv qaytadi: [{id, raw_score, ...}, ...]
  return api.get<ResultSummary[]>(`${BASE_URL}/my-results/all`)
}

// 6. NATIJA TAHLILINI OLISH (ID orqali bitta natija)
export const getReadingResultDetailAPI = (resultId: number) => {
  if (!resultId) throw new Error('resultId is required')
  
  // DIQQAT: Swaggerga qarab tekshiring: 
  // Agar /results/ bo'lsa shunday qoldiring, 
  // agar /my-results/ bo'lsa o'zgartiring.
  return api.get<ReadingResultDetail>(`${BASE_URL}/results/${resultId}`)
}

// 7. ADMIN: CREATE TEST
export const createReadingExamAPI = (data: Partial<ReadingExam>) => {
  return api.post<ReadingExam>(`${BASE_URL}/create`, data)
}

// 8. ADMIN: UPDATE TEST
export const updateReadingExamAPI = (testId: string, data: ReadingExamUpdate) => {
  return api.put<ReadingExam>(`${BASE_URL}/update/${testId}`, data)
}

// 9. ADMIN: DELETE TEST
export const deleteReadingExamAPI = (testId: string) => {
  return api.delete<{ success: boolean }>(`${BASE_URL}/delete/${testId}`)
}
