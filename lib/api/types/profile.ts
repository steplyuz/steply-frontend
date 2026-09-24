// Profile moduli turlari: /users/me/*

import type { Gender } from './common'

export type GlobalRole = 'user' | 'admin' | 'speaking_evaluator' | string

export interface UserProfile {
  full_name: string
  username: string
  avatar_url: string | null
  bio: string | null
  birth_date: string | null
  gender: Gender
  cefr_code: string | null
  language: 'uz' | 'ru' | 'en' | string
  timezone: string
}

export type ProfileUpdateInput = Partial<
  Pick<UserProfile, 'full_name' | 'username' | 'bio' | 'birth_date' | 'language' | 'timezone'>
>

export type ContactType = 'email' | 'phone'

export interface Contact {
  id: number
  contact_type: ContactType
  value: string
  is_verified: boolean
  is_primary: boolean
  created_at: string
}

export interface AddContactInput {
  contact_type: ContactType
  value: string
}

export interface Me {
  id: number
  is_active: boolean
  global_role: GlobalRole
  created_at: string
  updated_at: string
  profile: UserProfile
  contacts: Contact[]
}

export interface Session {
  id: string
  user_agent: string
  ip_address: string
  expires_at: string
  is_revoked: boolean
  last_active: string
}

export interface AvatarUploadResponse {
  avatar_url: string
}
