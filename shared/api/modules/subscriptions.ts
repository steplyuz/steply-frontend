// Admin obuna boshqaruvi: ro'yxat, muddat uzaytirish, tarif/muddat/holatni o'zgartirish.
import { apiGet, apiPatch, apiPost } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  AdminSubscriptionExtendInput, AdminSubscriptionFilters, AdminSubscriptionItem, AdminSubscriptionPage,
  AdminSubscriptionPatchInput,
} from '../types'

export const adminSubscriptionsApi = {
  list: (filters?: AdminSubscriptionFilters) =>
    apiGet<AdminSubscriptionPage>(ROUTES.adminSubscriptions, { query: filters }),
  update: (id: number, input: AdminSubscriptionPatchInput) =>
    apiPatch<AdminSubscriptionItem>(`${ROUTES.adminSubscriptions}/${enc(id)}`, input),
  extend: (id: number, input: AdminSubscriptionExtendInput) =>
    apiPost<AdminSubscriptionItem>(`${ROUTES.adminSubscriptions}/${enc(id)}/extend`, input),
}
