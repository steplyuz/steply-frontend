// Xabarnomalar API: foydalanuvchi inbox'i va admin boshqaruvi.
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../client'
import { enc } from '../config'
import { ROUTES } from '../routes'
import type {
  EmailAccount, EmailAccountPatch, GmailConnectResponse, InboxItem, InboxPage, NotificationEvent, NotificationMessage,
  NotificationMessageFilters, NotificationMessagePage, NotificationPreview, NotificationProcessResult, NotificationRule,
  NotificationRuleInput, NotificationSendInput, NotificationSendResult, NotificationStats, NotificationTemplate,
  NotificationTemplateInput, NotificationTemplatePatch, TestEmailInput, TestEmailResult, NotificationChannel,
} from '../types'

const INBOX = ROUTES.notificationsInbox
const ADMIN = ROUTES.adminNotifications

/** Foydalanuvchi: ilova ichidagi bildirishnomalar (qo'ng'iroqcha va sahifa). */
export const notificationsInboxApi = {
  list: (params?: { unread_only?: boolean; offset?: number; limit?: number }) =>
    apiGet<InboxPage>(INBOX, { query: params }),
  unreadCount: () => apiGet<{ unread: number }>(`${INBOX}/unread-count`),
  markRead: (id: number) => apiPost<InboxItem>(`${INBOX}/${enc(id)}/read`),
  markAllRead: () => apiPost<{ updated: number }>(`${INBOX}/read-all`),
}

/** Admin: shablonlar, hodisa qoidalari, email hisoblar, yuborish, navbat. */
export const adminNotificationsApi = {
  // Shablonlar
  templates: () => apiGet<NotificationTemplate[]>(`${ADMIN}/templates`),
  createTemplate: (input: NotificationTemplateInput) => apiPost<NotificationTemplate>(`${ADMIN}/templates`, input),
  updateTemplate: (code: string, input: NotificationTemplatePatch) =>
    apiPatch<NotificationTemplate>(`${ADMIN}/templates/${enc(code)}`, input),
  previewTemplate: (code: string, variables: Record<string, string>) =>
    apiPost<NotificationPreview>(`${ADMIN}/templates/${enc(code)}/preview`, { variables }),

  // Hodisalar va qoidalar
  events: () => apiGet<NotificationEvent[]>(`${ADMIN}/events`),
  rules: () => apiGet<NotificationRule[]>(`${ADMIN}/rules`),
  upsertRule: (input: NotificationRuleInput) => apiPut<NotificationRule>(`${ADMIN}/rules`, input),
  deleteRule: (eventCode: string, channel: NotificationChannel) =>
    apiDelete<void>(`${ADMIN}/rules/${enc(eventCode)}/${enc(channel)}`),

  // Email hisoblar (Gmail OAuth)
  emailAccounts: () => apiGet<EmailAccount[]>(`${ADMIN}/email-accounts`),
  gmailConnect: () => apiGet<GmailConnectResponse>(`${ADMIN}/email-accounts/gmail/connect`),
  updateEmailAccount: (id: number, input: EmailAccountPatch) =>
    apiPatch<EmailAccount>(`${ADMIN}/email-accounts/${enc(id)}`, input),
  deleteEmailAccount: (id: number) => apiDelete<void>(`${ADMIN}/email-accounts/${enc(id)}`),
  testEmailAccount: (id: number, input: TestEmailInput) =>
    apiPost<TestEmailResult>(`${ADMIN}/email-accounts/${enc(id)}/test`, input),

  // Yuborish va navbat
  send: (input: NotificationSendInput) => apiPost<NotificationSendResult>(`${ADMIN}/send`, input),
  messages: (filters?: NotificationMessageFilters) =>
    apiGet<NotificationMessagePage>(`${ADMIN}/messages`, { query: filters }),
  message: (id: number) => apiGet<NotificationMessage>(`${ADMIN}/messages/${enc(id)}`),
  retryMessage: (id: number) => apiPost<NotificationMessage>(`${ADMIN}/messages/${enc(id)}/retry`),
  cancelMessage: (id: number) => apiPost<NotificationMessage>(`${ADMIN}/messages/${enc(id)}/cancel`),
  stats: () => apiGet<NotificationStats>(`${ADMIN}/stats`),
  /** Navbatdagi xabarlarni darhol yuboradi (worker kutmasdan). */
  process: (batch = 50) => apiPost<NotificationProcessResult>(`${ADMIN}/process`, undefined, { query: { batch } }),
}
