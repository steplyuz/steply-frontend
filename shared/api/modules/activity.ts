// Saytdagi faollik: kabinet sahifasi ochiq bo'lganda davriy heartbeat yuboriladi.
import { apiPost } from '../client'
import { ROUTES } from '../routes'

export const activityApi = {
  heartbeat: () => apiPost<{ ok: boolean }>(`${ROUTES.activity}/heartbeat`),
}
