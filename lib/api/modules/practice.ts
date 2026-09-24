// 10/12 — PRACTICE: /practice/*

import { apiGet } from '../client'
import { ROUTES } from '../routes'
import type { PracticeTest } from '../types'

const BASE = ROUTES.practice

export const practiceApi = {
  tests: () => apiGet<PracticeTest[]>(`${BASE}/tests`),
}
