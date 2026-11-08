// Profile moduli turlari: /users/me/*

import type { Gender } from './common'
import type { Me, UserProfile } from './auth'

export type GlobalRole = 'student' | 'teacher' | 'organization' | 'admin' | (string & {})

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
