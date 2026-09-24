// 7/12 — LISTENING: /listening-tests/* (talaba), /admin/listening-tests/* (admin)

import { ApiRequestError, apiUpload } from '../client'
import { resolveAssetUrl } from '../config'
import { createAdminCrud, createPaperExamApi, createTestTakingApi } from '../resource'
import { ROUTES } from '../routes'
import { uploadWithProgress } from '../upload'
import type {
  ListeningCreateInput, ListeningResultDetail, ListeningResultSummary, ListeningSubmitInput, ListeningTest,
  ListeningUpdateInput, UploadedAudio,
} from '../types'

const BASE = ROUTES.listening
const ADMIN = ROUTES.listeningAdmin
const AUDIO_UPLOAD = `${ADMIN}/audio/upload`

const crud = createAdminCrud<ListeningTest, ListeningCreateInput, ListeningUpdateInput>(ADMIN, { update: 'put' })
const taking = createTestTakingApi<
  ListeningTest, ListeningSubmitInput, ListeningResultDetail, ListeningResultSummary, ListeningResultDetail
>(BASE, ADMIN)

export const listeningApi = {
  // --- Admin (adminGet/adminList — to'g'ri javoblar bilan) ---
  create: crud.create,
  importJson: crud.importJson,
  adminList: crud.adminList,
  adminGet: crud.adminGet,
  update: crud.update,
  remove: crud.remove,
  allResults: taking.allResults,

  // --- Talaba (to'g'ri javobsiz) ---
  getAll: taking.getAll,
  get: taking.get,
  submit: taking.submit, // body: { answers: [...], exam_attempt_id? }
  myResults: taking.myResults,
  resultDetail: taking.resultDetail,

  // --- Lock / versions / answer-key / paper PDF / OMR answer sheet (admin) ---
  ...createPaperExamApi(ADMIN),

  // --- Audio ---
  /** Progresssiz oddiy yuklash. Katta fayl (100 MB gacha) uchun `uploadListeningAudio` ni ishlating. */
  uploadAudio: (file: File) => apiUpload<UploadedAudio>(AUDIO_UPLOAD, { file }),
}

// ---------------------------------------------------------------------------
// Audio yuklash (progress bilan)
// ---------------------------------------------------------------------------

export const MAX_AUDIO_MB = 100
export const ALLOWED_AUDIO_EXT = ['.mp3', '.m4a', '.wav', '.ogg', '.webm']

function fileExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

/** Katta (100 MB gacha) audio faylni progress bilan yuklaydi. Xatolikda `Error` (message tayyor matn) tashlaydi. */
export async function uploadListeningAudio(file: File, onProgress?: (percent: number) => void): Promise<UploadedAudio> {
  const ext = fileExt(file.name)
  if (!ALLOWED_AUDIO_EXT.includes(ext)) {
    throw new Error(`Ruxsat etilmagan format: ${ext || "noma'lum"}. Ruxsat: ${ALLOWED_AUDIO_EXT.join(', ')}`)
  }
  if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
    throw new Error(`Fayl ${MAX_AUDIO_MB} MB dan katta.`)
  }

  let uploaded: UploadedAudio
  try {
    uploaded = await uploadWithProgress<UploadedAudio>(AUDIO_UPLOAD, file, { onProgress })
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 413) {
      throw new Error(`Fayl juda katta (maksimum ${MAX_AUDIO_MB} MB).`)
    }
    throw err
  }
  if (!uploaded?.url) throw new Error('Server audio manzilini qaytarmadi.')
  return uploaded
}

/** "/static/listening_audio/x.mp3" -> <audio src> uchun to'liq manzil. */
export const resolveAudioUrl = resolveAssetUrl
