// PRACTICE KATALOGI: GET /practice/tests
//
// Barcha ko'nikmalar uchun yagona ro'yxat. Premium testlar yashirilmaydi — `is_locked` bilan keladi,
// UI ularni qulflangan holda ko'rsatadi (qarang: lib/practice/access.ts).

import { apiGet } from '../../client'
import { ROUTES } from '../../routes'
import type { PracticeCatalog, PracticeCatalogItem, PracticeSkill } from '../../types'

const BASE = ROUTES.practice

export const practiceApi = {
  /** Ko'nikmalar bo'yicha guruhlangan katalog. */
  catalog: (skill?: PracticeSkill) => apiGet<PracticeCatalog>(`${BASE}/tests`, { query: { skill } }),

  /** Bitta ko'nikma uchun tekis ro'yxat. */
  testsBySkill: async (skill: PracticeSkill): Promise<PracticeCatalogItem[]> =>
    (await apiGet<PracticeCatalog>(`${BASE}/tests`, { query: { skill } })).items[skill] ?? [],
}
