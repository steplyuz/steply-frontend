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
//   resource.ts     umumiy fabrikalar (admin CRUD, attempt, lock, paper PDF)
//   types/          turlar: umumiy + practice/ + exam/
//   modules/        endpointlar: umumiy + practice/ + exam/
//   legacy.ts       eski komponentlar uchun ingichka get/post/put (yangi kod `@/lib/api` dan foydalansin)
//   (config/routes/upload ichki yordamchilar: modullar ularni to'g'ridan-to'g'ri import qiladi)

export * from './client'
export { authenticatedDownload, authenticatedBlob, saveBlob } from './download'
export { formatLockError } from './resource'

export { authApi } from './modules/auth'
export { profileApi } from './modules/profile'
export { publicApi } from './modules/public'
// practice: talaba practice testlari + test banki (admin)
export { practiceApi } from './modules/practice/catalog'
export { readingApi } from './modules/practice/reading'
export { listeningApi, uploadListeningAudio, resolveAudioUrl, MAX_AUDIO_MB } from './modules/practice/listening'
export { writingApi } from './modules/practice/writing'
export { speakingApi } from './modules/practice/speaking'

// exam: rasmiy imtihon (mock registratsiya, markaz, MK-ID / examx portal)
export { mockExamsApi } from './modules/exam/mock-exams'
export { mockCenterApi } from './modules/exam/mock-center'
export { examsApi, examsAuthApi } from './modules/exam/exams'

// platforma
export { billingApi } from './modules/billing'
export { adminApi } from './modules/admin'
export { applyApi } from './modules/apply'
export { analysisApi } from './modules/analysis'
export { onboardingApi, onboardingAdminApi } from './modules/onboarding'
