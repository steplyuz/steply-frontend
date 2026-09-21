import api from "./axios"; 
import { 
  ListeningExam, 
  ListeningExamUpdate, 
  ListeningSubmission, 
  ListeningResultResponse 
} from "../cefr-types/listening";

// Backenddagi asosiy yo'l
const BASE_URL = "/listening-test";

// POST /v1/api/cefr/all/listening/create
export const createListeningExamAPI = (data: ListeningExam) => {
  return api.post<ListeningExam>(`${BASE_URL}/create`, data);
};


export const updateListeningExamAPI = (examId: string, data: ListeningExamUpdate) => {
  return api.put<ListeningExam>(`${BASE_URL}/update/${examId}`, data);
};


export const deleteListeningExamAPI = (examId: string) => {
  return api.delete(`${BASE_URL}/delete/${examId}`);
};


export const getListeningExamsAPI = () => {
  return api.get<ListeningExam[]>(`${BASE_URL}/get_all`);
};


export const getListeningExamByIdAPI = (examId: string) => {
  return api.get<ListeningExam>(`${BASE_URL}/get/${examId}`);
};


export const submitListeningExamAPI = (data: ListeningSubmission) => {
  return api.post<ListeningResultResponse>(`${BASE_URL}/answer/submit`, data);
};

export const getMyListeningResultsAPI = () => {
  return api.get<ListeningResultResponse[]>(`${BASE_URL}/my-results/all`);
};


export const getListeningResultDetailAPI = (resultId: number) => {
  return api.get<any>(`${BASE_URL}/my-results/${resultId}`);
};