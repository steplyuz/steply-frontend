// Admin muharriri uchun savol turlari.
//
// READING: backendda qat'iy enum emas (erkin string), shuning uchun tavsiya sifatida.
// LISTENING: backend ListeningQuestionType enum ni QAT'IY tekshiradi — bu ro'yxatdan
// tashqari qiymat yuborilsa 422 qaytadi. (Avval "MAP_LABELING" edi, to'g'risi "MAP_DIAGRAM".)

export const READING_QUESTION_TYPES = [
  'GAP_FILL',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE_NOT_GIVEN',
  'YES_NO_NOT_GIVEN',
  'MATCHING',
  'MATCHING_HEADINGS',
  'SHORT_ANSWER',
  'SENTENCE_COMPLETION',
]

export const LISTENING_QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'GAP_FILL',
  'MATCHING',
  'MAP_DIAGRAM',
  'SHORT_ANSWER',
  'SENTENCE_COMPLETION',
] as const

export const READING_LANGUAGES = ['en', 'uz', 'ru']