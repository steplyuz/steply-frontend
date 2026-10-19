// Steply API — yagona kirish nuqtasi.
//
//   import { readingApi, authApi, ApiRequestError } from '@/lib/api'
//   import type { ReadingTest } from '@/lib/api/types'
//
// Tuzilma:
//   config.ts       baseUrl, apiUrl(), enc(), buildQuery(), resolveAssetUrl()
//   routes.ts       barcha backend prefikslari (yagona manba)
//   client.ts       fetch qatlami: cookie auth, 401 -> refresh, xatolik formati, GET dedupe
//   upload.ts       XHR upload (progress + 401 refresh)
//   download.ts     authenticated fayl yuklab olish
//   paper-exam.ts   Reading/Listening uchun umumiy lock/versions/paper amallari
//   types/          har bir modul uchun alohida tur fayli
//   modules/        har bir backend tegi uchun alohida modul
//   (config/routes/upload ichki yordamchilar: modullar ularni to'g'ridan-to'g'ri import qiladi)

export * from './client'
export { authenticatedDownload, authenticatedBlob } from './download'
export { formatLockError } from './resource'

export { authApi } from './modules/auth'
export { profileApi } from './modules/profile'
export { publicApi } from './modules/public'
export { mockExamsApi } from './modules/mock-exams'
export { mockCenterApi } from './modules/mock-center'
export { readingApi } from './modules/reading'
export { listeningApi, uploadListeningAudio, resolveAudioUrl, MAX_AUDIO_MB } from './modules/listening'
export { writingApi } from './modules/writing'
export { speakingApi } from './modules/speaking'
export { practiceApi } from './modules/practice'
export { billingApi } from './modules/billing'
export { adminApi } from './modules/admin'
export { applyApi } from './modules/apply'
export { analysisApi } from './modules/analysis'
export { examsApi, examsAuthApi } from './modules/exams'
