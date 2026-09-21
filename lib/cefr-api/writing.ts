import api from './axios';
import {
  WritingExam,
  WritingSubmission,
  WritingResultDetail,
} from '../cefr-types/writing';

const BASE_URL = '/writing-test';

// ---------- USER ----------

export const getAllWritingExamsAPI = () =>
  api.get<WritingExam[]>(`${BASE_URL}/get_all`);

export const getWritingExamByIdAPI = (examId: string) =>
  api.get<WritingExam>(
    `${BASE_URL}/get/${encodeURIComponent(examId)}`
  );

export const submitWritingExamAPI = (
  examId: string,
  payload: WritingSubmission
) =>
  api.post<WritingResultDetail>(
    `${BASE_URL}/exams/${encodeURIComponent(examId)}/submit`,
    payload
  );

export const getMyWritingResultsAPI = () =>
  api.get<WritingResultDetail[]>(`${BASE_URL}/my-results/all`);

export const getWritingResultDetailAPI = (resultId: number) =>
  api.get<WritingResultDetail>(
    `${BASE_URL}/results/${resultId}`
  );

export const downloadWritingResultPdfAPI = (resultId: number) =>
  api.get(`${BASE_URL}/results/${resultId}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  });

// ---------- ADMIN ----------

export const createWritingExamAPI = (data: Partial<WritingExam>) =>
  api.post<WritingExam>(`${BASE_URL}/create`, data);

export const updateWritingExamAPI = (
  examId: string,
  data: Partial<WritingExam>
) =>
  api.put<WritingExam>(
    `${BASE_URL}/update/${encodeURIComponent(examId)}`,
    data
  );

export const deleteWritingExamAPI = (examId: string) =>
  api.delete(
    `${BASE_URL}/delete/${encodeURIComponent(examId)}`
  );