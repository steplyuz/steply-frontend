// Barcha API turlari bitta joydan: `import type { Me, ReadingTest } from '@/lib/api/types'`
//
// Tuzilma (exam / practice bo'yicha):
//   common, auth, profile, public, billing, apply, analysis, admin   — umumiy platforma
//   practice/   reading, listening, writing, speaking, catalog        — practice testlar + test banki (admin CRUD)
//   exam/       exams, exam-shared, mock-exams, mock-center           — rasmiy imtihon (mock / MK-ID / examx)

export * from './common'
export * from './auth'
export * from './profile'
export * from './public'
export * from './billing'
export * from './apply'
export * from './analysis'
export * from './onboarding'
export * from './admin'

// practice
export * from './practice/reading'
export * from './practice/listening'
export * from './practice/writing'
export * from './practice/speaking'
export * from './practice/catalog'

// exam
export * from './exam/mock-exams'
export * from './exam/mock-center'
export * from './exam/exam-shared'
export * from './exam/exams'
