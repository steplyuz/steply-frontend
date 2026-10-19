// PUBLIC REGISTRATION: /apply/{registration_slug} (login talab qilinmaydi)

import { apiGet, apiPost, apiUpload } from '../client'
import { enc } from '../config'
import type { ApplyInput, ApplyResult, ApplySession } from '../types'

const anon = { anonymous: true } as const

export const applyApi = {
  session: (slug: string) => apiGet<ApplySession>(`/apply/${enc(slug)}`, anon),
  register: (slug: string, input: ApplyInput) => apiPost<ApplyResult>(`/apply/${enc(slug)}`, input, anon),
  /** Javob: { photo_url }. Ro'yxatdan o'tishda shu URL ni photo_url sifatida yuboring. */
  uploadPhoto: (slug: string, file: File, captchaToken?: string | null) =>
    apiUpload<{ photo_url: string }>(`/apply/${enc(slug)}/photo`, { file, captcha_token: captchaToken }, anon),
}
