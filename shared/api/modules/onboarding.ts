// ONBOARDING: talaba onboarding javoblari va AI rejasi.
// Barcha endpointlar login talab qiladi (cookie auth).

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  OnboardingExamDate,
  OnboardingExamDateInput,
  OnboardingPlanResponse,
  OnboardingState,
  OnboardingUpdateInput,
} from '../types/onboarding'

const BASE = ROUTES.onboarding
const ADMIN_BASE = ROUTES.onboardingAdmin

export const onboardingApi = {
  get: () => apiGet<OnboardingState>(BASE),
  /** Qisman saqlash: faqat yuborilgan maydonlar yangilanadi */
  update: (input: OnboardingUpdateInput) => apiPut<OnboardingState>(BASE, input),
  examDates: () => apiGet<OnboardingExamDate[]>(`${BASE}/exam-dates`),
  generatePlan: () => apiPost<OnboardingPlanResponse>(`${BASE}/plan`),
}

/** Admin: imtihon sanalari. Faqat admin va super_admin. o'chirish arxivlaydi (rejalar buzilmaydi). */
export const onboardingAdminApi = {
  examDates: () => apiGet<OnboardingExamDate[]>(ADMIN_BASE),
  createExamDate: (input: OnboardingExamDateInput) => apiPost<OnboardingExamDate>(ADMIN_BASE, input),
  updateExamDate: (id: number, input: Partial<OnboardingExamDateInput>) =>
    apiPatch<OnboardingExamDate>(`${ADMIN_BASE}/${enc(id)}`, input),
  archiveExamDate: (id: number) => apiDelete<void>(`${ADMIN_BASE}/${enc(id)}`),
}
