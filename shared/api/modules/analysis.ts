// ANALYSIS: /analysis/* (talaba), /admin/analysis/* (admin)

import { apiDelete, apiGet, apiPut, apiUpload } from '../client'
import { enc } from '../config'
import type { AnalysisAdminStatistics, AnalysisLimitInput, AnalysisQuota, AnalysisVideo, JsonObject } from '../types'

const BASE = '/analysis'
const ADMIN = '/admin/analysis'

export const analysisApi = {
  // --- Talaba ---
  quota: () => apiGet<AnalysisQuota>(`${BASE}/quota`),
  /** Mavjud tahlil videolari katalogi; kvota faqat video ijro etilganda sarflanadi. */
  videos: () => apiGet<AnalysisVideo[]>(`${BASE}/videos`),
  get: (skill: string, testId: string) => apiGet<JsonObject>(`${BASE}/${enc(skill)}/${enc(testId)}`),

  // --- Admin ---
  adminStatistics: () => apiGet<AnalysisAdminStatistics>(`${ADMIN}/statistics`),
  adminLimits: () => apiGet<JsonObject>(`${ADMIN}/limits`),
  setPracticeLimit: (input: AnalysisLimitInput) => apiPut<JsonObject>(`${ADMIN}/limits/practice`, input),
  setAnalysisLimit: (input: AnalysisLimitInput) => apiPut<JsonObject>(`${ADMIN}/limits/analysis`, input),
  adminVideos: () => apiGet<AnalysisVideo[]>(`${ADMIN}/videos`),
  uploadVideo: (input: { skill: string; test_id: string; title: string; file: File }) =>
    apiUpload<AnalysisVideo>(`${ADMIN}/videos`, input),
  deleteVideo: (videoId: number) => apiDelete<void>(`${ADMIN}/videos/${enc(videoId)}`),
}
