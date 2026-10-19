// 2/12 — PROFILE: /users/me/*  (faqat login qilgan foydalanuvchi)
//
// Diqqat: yo'llar oxirida "/" BO'LMASLIGI kerak — backendda faqat "/users/me" (slashsiz)
// ro'yxatdan o'tgan, aks holda Starlette 307 redirect qiladi (cookie bilan muammo).

import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type { AddContactInput, AvatarUploadResponse, Me, ProfileUpdateInput, Session } from '../types'

const BASE = ROUTES.profile

export const profileApi = {
  me: () => apiGet<Me>(BASE),
  update: (input: ProfileUpdateInput) => apiPut<Me>(`${BASE}/profile`, input),
  uploadAvatar: (file: File) => apiUpload<AvatarUploadResponse>(`${BASE}/avatar`, { file }),

  contacts: () => apiGet<Me['contacts']>(`${BASE}/contacts`),
  addContact: (input: AddContactInput) => apiPost<void>(`${BASE}/contacts`, input),
  setPrimaryContact: (contactId: number) => apiPatch<void>(`${BASE}/contacts/${enc(contactId)}/primary`),
  deleteContact: (contactId: number) => apiDelete<void>(`${BASE}/contacts/${enc(contactId)}`),

  sessions: () => apiGet<Session[]>(`${BASE}/sessions`),
  revokeSession: (sessionId: string) => apiDelete<void>(`${BASE}/sessions/${enc(sessionId)}`),
}
