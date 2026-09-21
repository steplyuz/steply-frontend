import api from "./axios";
import { 
  MockExamStartResponse, 
  MockExamResult,
  MockSkillSubmit,
  MockSkillAttemptResponse,
  MockSkillStatusResponse,
  UserMockExamResponse
} from "@/lib/types/mock";

const BASE_URL = "/mock-test";

/* ----------------------------------
    1. USER ENDPOINTS
---------------------------------- */

export const getMyMockExamsAPI = () => {
  return api.get<UserMockExamResponse[]>(`${BASE_URL}/center/me/registrations`);
};

export const getMockExamByIdAPI = async (examId: string) => {
  const response = await api.get<UserMockExamResponse[]>(`${BASE_URL}/center/me/registrations`);
  const foundExam = response.data.find((item) => item.id === examId);

  if (!foundExam) {
    throw new Error(`Imtihon topilmadi (ID: ${examId})`);
  }

  return { data: foundExam };
};

export const buyMockExamAPI = (examId: string) => {
  return api.post(`${BASE_URL}/${examId}/buy`);
};

export const startMockExamAPI = (examId: string) => {
  return api.post<MockExamStartResponse>(`${BASE_URL}/${examId}/start`);
};

export const getMockAttemptStatusAPI = (attemptId: string | number) => {
  return api.get<MockSkillStatusResponse[]>(`${BASE_URL}/attempts/${attemptId}/status`);
};

export const submitMockSkillAPI = (
  attemptId: number | string, 
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING", 
  raw_score: number,
  user_answers: any
) => {
  const data: MockSkillSubmit = { raw_score, user_answers };
  return api.post<MockSkillAttemptResponse>(
    `${BASE_URL}/attempts/${attemptId}/submit/${skill}`,
    data
  );
};

export const finishMockExamAPI = (attemptId: number | string) => {
  return api.post<MockExamResult>(`${BASE_URL}/attempts/${attemptId}/finish`);
};

export const getMyResultsHistoryAPI = () => {
  return api.get<MockExamResult[]>(`${BASE_URL}/results/history`);
};

export const getSpecificResultAPI = (attemptId: number) => {
  return api.get<MockExamResult>(`${BASE_URL}/attempts/${attemptId}/result`);
};

/* ----------------------------------
    2. ADMIN ENDPOINTS
---------------------------------- */

export const adminCreateMockAPI = (data: any) => {
  return api.post<UserMockExamResponse>("/admin/mock-test", data);
};

export const adminListAllMocksAPI = () => {
  return api.get<UserMockExamResponse[]>("/admin/mock-test");
};

export const adminUpdateMockAPI = (examId: string, data: any) => {
  return api.put<UserMockExamResponse>(`/admin/mock-test/${examId}`, data);
};

export const adminDeleteMockAPI = (examId: string) => {
  return api.delete(`/admin/mock-test/${examId}`);
};
