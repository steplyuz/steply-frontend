// Xabarnomalar: admin (/admin/notifications/*) va foydalanuvchi inbox'i (/notifications/inbox/*).

export type NotificationChannel = 'sms' | 'telegram' | 'email' | 'in_app'
export type NotificationCategory = 'transactional' | 'marketing'
export type NotificationMessageStatus = 'queued' | 'sent' | 'failed' | 'cancelled'

/** Shablon. `placeholders` — body/subject dagi {{nom}} o'zgaruvchilari. */
export interface NotificationTemplate {
  code: string
  channel: NotificationChannel
  title: string
  subject: string | null
  body: string
  /** Email uchun HTML (ixtiyoriy) */
  html_body: string | null
  is_active: boolean
  placeholders: string[]
}

export interface NotificationTemplateInput {
  code: string
  channel: NotificationChannel
  title: string
  subject?: string | null
  body: string
  html_body?: string | null
  is_active?: boolean
}

/** code va channel o'zgarmaydi. */
export interface NotificationTemplatePatch {
  title?: string
  subject?: string | null
  body?: string
  html_body?: string | null
  is_active?: boolean
}

export interface NotificationPreview {
  subject: string | null
  body: string
  /** To'liq email HTML (Steply dizayni bilan), iframe'da ko'rsatiladi */
  html: string
}

export interface NotificationEvent {
  event_code: string
  description: string
}

/** Hodisa -> kanal -> shablon bog'lanishi. */
export interface NotificationRule {
  event_code: string
  channel: NotificationChannel
  template_code: string
  is_active: boolean
}

export interface NotificationRuleInput {
  event_code: string
  channel: NotificationChannel
  template_code: string
  is_active?: boolean
}

export type EmailAccountStatus = 'ok' | 'reauth_required'

export interface EmailAccount {
  id: number
  provider: string
  email: string
  display_name: string | null
  is_default: boolean
  is_active: boolean
  status: EmailAccountStatus
  last_error: string | null
  created_at: string
}

export interface EmailAccountPatch {
  display_name?: string | null
  is_default?: boolean
  is_active?: boolean
}

export interface GmailConnectResponse {
  url: string
}

export interface TestEmailInput {
  to: string
  subject?: string
  body?: string
}

export interface TestEmailResult {
  status: string
  provider_message_id: string | null
}

/** POST /admin/notifications/send */
export interface NotificationSendInput {
  channel: NotificationChannel
  template_code?: string | null
  subject?: string | null
  body?: string | null
  user_ids?: string[]
  recipients?: string[]
  variables?: Record<string, string>
  category?: NotificationCategory
  email_account_id?: number | null
  link?: string | null
  send_at?: string | null
  idempotency_key?: string | null
}

export interface NotificationSendResult {
  queued: number
  skipped_opted_out: number
  ids: number[]
  status: string
}

export interface NotificationMessage {
  id: number
  channel: NotificationChannel
  recipient: string
  user_id: string | null
  template_code: string | null
  subject: string | null
  body: string
  category: NotificationCategory
  email_account_id: number | null
  link: string | null
  status: NotificationMessageStatus
  attempts: number
  max_attempts: number
  next_attempt_at: string
  last_error: string | null
  provider_message_id: string | null
  created_at: string
  sent_at: string | null
}

export interface NotificationMessagePage {
  total: number
  items: NotificationMessage[]
}

/** Query parametrlari uchun type alias (interface emas: buffer/QueryParams bilan mos kelishi uchun). */
export type NotificationMessageFilters = {
  channel?: NotificationChannel
  status?: NotificationMessageStatus
  category?: NotificationCategory
  user_id?: string
  offset?: number
  limit?: number
}

/** GET /admin/notifications/stats: { kanal: { holat: soni } } */
export type NotificationStats = Partial<Record<NotificationChannel, Partial<Record<NotificationMessageStatus, number>>>>

export interface NotificationProcessResult {
  picked: number
  sent: number
  failed: number
  retry: number
}

/** Foydalanuvchi inbox elementi. */
export interface InboxItem {
  id: number
  title: string
  body: string
  link: string | null
  category: NotificationCategory
  is_read: boolean
  created_at: string
  read_at: string | null
}

/** GET /notifications/inbox */
export interface InboxPage {
  total: number
  unread: number
  items: InboxItem[]
}

/** POST /admin/notifications/broadcast: barcha faol foydalanuvchilarga */
export interface NotificationBroadcastInput {
  channels: NotificationChannel[]
  template_code?: string | null
  subject?: string | null
  body?: string | null
  html_body?: string | null
  link?: string | null
  variables?: Record<string, string>
  category?: NotificationCategory
  email_account_id?: number | null
  idempotency_key?: string | null
}

export interface NotificationBroadcastResult {
  queued: number
  skipped_opted_out: number
  skipped_no_address: number
  per_channel: Partial<Record<NotificationChannel, number>>
}
