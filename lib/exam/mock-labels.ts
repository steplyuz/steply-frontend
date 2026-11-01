// Mock imtihon sahifalari uchun umumiy yorliqlar va yordamchilar.
import type { Gender, Region } from '@/lib/api/types/common'

export const REGION_LABEL: Record<Region, string> = {
  tashkent_city: 'Toshkent shahri',
  tashkent_region: 'Toshkent viloyati',
  andijan: 'Andijon',
  bukhara: 'Buxoro',
  fergana: 'Farg‘ona',
  jizzakh: 'Jizzax',
  kashkadarya: 'Qashqadaryo',
  navoiy: 'Navoiy',
  namangan: 'Namangan',
  samarkand: 'Samarqand',
  surkhandarya: 'Surxondaryo',
  syrdarya: 'Sirdaryo',
  khorezm: 'Xorazm',
  karakalpakstan: 'Qoraqalpog‘iston',
}

export const REGIONS = Object.keys(REGION_LABEL) as Region[]

export const GENDER_LABEL: Record<Gender, string> = { male: 'Erkak', female: 'Ayol' }

export const REGISTRATION_STATUS_LABEL: Record<string, string> = {
  REGISTERED: 'Ro‘yxatda',
  ATTENDED: 'Keldi',
  CANCELLED: 'Bekor qilingan',
}

/** Tug'ilgan sana bo'yicha to'liq yosh (yil). */
export function ageFromDob(dob: string): number {
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const beforeBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (beforeBirthday) age -= 1
  return age
}
