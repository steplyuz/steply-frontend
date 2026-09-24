// Backend router prefikslari — YAGONA MANBA.
//
// Backend yo'li o'zgarsa, faqat shu faylni tahrirlang: barcha modullar shu yerdan foydalanadi.
// Barcha yo'llar `/api/v1` dan keyin boshlanadi (qarang: config.ts -> API_PREFIX).
//
// Nomlash: `xxx` — foydalanuvchi (yoki public), `xxxAdmin` — admin yo'llari.

export const ROUTES = {
  auth: '/auth',
  profile: '/users/me',
  public: '/public',

  mockExams: '/mock-exams',
  mockExamsAdmin: '/admin/mock-exams',
  mockExamsPapersAdmin: '/admin/mock-exams/papers',
  mockExamsGradeAdmin: '/admin/mock-exams/grade',

  mockCenter: '/mock-exams/center/me',
  mockCenterAdmin: '/admin/mock-exams/center',

  reading: '/reading-tests',
  readingAdmin: '/admin/reading-tests',

  listening: '/listening-tests',
  listeningAdmin: '/admin/listening-tests',

  writing: '/writing-tests',
  writingAdmin: '/admin/writing-tests',

  speaking: '/speaking-tests',
  speakingAdmin: '/admin/speaking-tests',

  practice: '/practice',

  billing: '/billing',
  billingAdmin: '/admin/billing',

  admin: '/admin',
} as const
