// Foydalanuvchi ro'yxatdan o'tish usuli (backend: users.registration_method).

export const REGISTRATION_LABEL: Record<string, string> = {
  phone_sms: 'Telefon (SMS)',
  phone_telegram: 'Telefon (Telegram bot)',
  google: 'Google',
  telegram_login: 'Telegram',
  unknown: 'Noma’lum (eski)',
}

export const REGISTRATION_OPTIONS = Object.entries(REGISTRATION_LABEL).map(([value, label]) => ({ value, label }))

export const registrationLabel = (value: string | null | undefined): string =>
  (value && REGISTRATION_LABEL[value]) || '—'
