// Steply Backend API — 2.5.0
// Auto-derived types from openapi.json. Keep in sync with backend.

export type Gender = 'male' | 'female'
export type GlobalRole = 'user' | 'admin' | string
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | string

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

export interface Contact {
  id: number
  contact_type: 'email' | 'phone'
  value: string
  is_verified: boolean
  is_primary: boolean
  created_at: string
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

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface StatusMessage {
  status: string
  message: string
  bot_link?: string
}

export interface LoginResponse {
  status: string
  // Backend "need_registration" holatida token yubormaydi — shu uchun ixtiyoriy.
  token?: AuthToken
  message?: string
}

export interface RegisterResponse {
  status: string
  message?: string
  expires_in_seconds?: number
  bot_link?: string
}

export interface RegisterVerifyResponse {
  status: string
  token?: AuthToken
  cefr_code?: string
}

export interface Session {
  id: string
  user_agent: string
  ip_address: string
  expires_at: string
  is_revoked: boolean
  last_active: string
}

// ---------- Mock exams ----------

export interface MockExam {
  id: string
  title: string
  description?: string | null
  image_file?: string | null
  cefr_level: string
  duration_minutes?: number
  price: number
  is_active: boolean
  is_purchased?: boolean
  reading_id?: string | null
  listening_id?: string | null
  writing_id?: string | null
  speaking_id?: string | null
  created_at?: string
  upcoming_sessions_count?: number
  sessions?: PublicExamSession[]
}

export interface MockExamCreateInput {
  title: string
  description?: string | null
  image_file?: string | null
  cefr_level?: string
  duration_minutes?: number
  price?: number
  is_active?: boolean
  reading_id?: string | null
  listening_id?: string | null
  writing_id?: string | null
  speaking_id?: string | null
}

export type MockExamUpdateInput = Partial<Omit<MockExamCreateInput, 'id'>>

export interface MockAttemptStart {
  attempt_id: number
  mock_exam_id: string
  started_at: string
}

export type SkillType = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'

export interface MockSkillStatus {
  skill: SkillType
  is_checked: boolean
  is_submitted: boolean
  submitted_at: string | null
}

export interface MockSkillSubmitInput {
  raw_score?: number
  user_answers?: Record<string, unknown> | null
}

export interface MockSkillResult {
  id: number
  attempt_id: number
  user_id: number
  skill: SkillType
  raw_score: number
  scaled_score: number
  cefr_level: string
  is_checked: boolean
  submitted_at: string
}

export interface MockFinalResult {
  id: number
  attempt_id: number
  user_id: number
  reading_ball: number
  listening_ball: number
  writing_ball: number
  speaking_ball: number
  overall_score: number
  cefr_level: string
  created_at: string
}

export type Region =
  | 'tashkent_city' | 'tashkent_region' | 'andijan' | 'bukhara' | 'fergana'
  | 'jizzakh' | 'kashkadarya' | 'navoiy' | 'namangan' | 'samarkand'
  | 'surkhandarya' | 'syrdarya' | 'khorezm' | 'karakalpakstan'

export interface ExamSession {
  id: number
  mock_exam_id: string
  exam_date: string
  center_name?: string | null
  room_name?: string | null
  location_address: string
  region: Region | string | null
  capacity: number | null
  required_documents: string | string[] | null
  registered_count?: number
  available_seats?: number | null
  is_full?: boolean
  is_active: boolean
}

export interface ExamSessionCreateInput {
  mock_exam_id: string
  exam_date: string
  center_name?: string | null
  room_name?: string | null
  location_address: string
  region?: Region | null
  capacity?: number | null
  required_documents?: string | null
  is_active?: boolean
}

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' | string

export interface PublicExamSession {
  id: number
  mock_exam_id: string
  exam_date: string
  center_name: string | null
  room_name: string | null
  location_address: string
  region: string | null
  capacity: number | null
  registered_count: number
  available_seats: number | null
  is_full: boolean
  required_documents: string[]
  is_active: boolean
}

export interface PublicExamDetail extends MockExam {
  sessions: PublicExamSession[]
}

export interface PublicSessionDetail {
  exam: { id: string; title: string; description: string | null; cefr_level: string; duration_minutes: number; price: number; image_file: string | null }
  session: PublicExamSession
}

export interface PublicStats {
  active_mock_exams: number
  upcoming_sessions: number
  registrations: number
}

export interface WritingPendingItem {
  skill_attempt_id: number
  attempt_id: number
  user_id: number
  full_name: string
  student_id?: string | null
  mock_exam_title: string
  exam_date?: string | null
  is_checked: boolean
  scaled_score: number
  submitted_at?: string | null
}

export interface SessionRegistration {
  id: number
  user_id: number
  session_id: number
  mock_exam_id: string
  full_name: string
  student_id: string
  age: number
  date_of_birth: string | null
  gender: Gender
  region: Region | string
  photo_url: string | null
  status: RegistrationStatus
  attended_confirmed_at: string | null
  created_at: string
  exam_date?: string | null
  center_name?: string | null
  room_name?: string | null
  location_address?: string | null
}

export interface RegisterForSessionInput {
  session_id: number
  full_name: string
  age: number
  date_of_birth?: string | null
  gender: Gender
  region: Region
  photo_url?: string | null
}

// ---------- CEFR Reading ----------

export interface ReadingQuestionOption {
  id?: number
  label: string
  value: string
}

export interface ReadingQuestion {
  id?: number
  question_number: number
  type: string
  text: string
  word_limit?: number | null
  correct_answer?: string[]
  options?: ReadingQuestionOption[]
}

export interface ReadingPart {
  id?: number
  title: string
  description?: string | null
  passage: string
  questions: ReadingQuestion[]
}

export interface ReadingTest {
  title: string
  cefr_level: string
  language: string
  duration_minutes: number
  total_questions: number | null
  is_demo: boolean
  is_free: boolean
  is_mock: boolean
  is_active: boolean
  id: string
  created_at: string
  parts: ReadingPart[]
}

export interface ReadingCreateInput {
  // NOTE: id is NOT sent — backend auto-generates READ-{8 nanoid}
  title: string
  cefr_level: string
  language?: 'en' | 'uz' | 'ru' | string
  duration_minutes: number
  total_questions?: number
  is_demo?: boolean
  is_free?: boolean
  is_mock?: boolean
  is_active?: boolean
  parts: ReadingPart[]
}

export type ReadingUpdateInput = Partial<Omit<ReadingCreateInput, 'id'>>

// Testni PDF/OMR uchun tayyorlash (lock) natijasi
export interface ExamVersion {
  id: number
  version_number: number
  total_questions: number
  is_locked: boolean
  locked_at: string | null
  created_at: string
}

export interface LockResult {
  success: boolean
  version: ExamVersion
  errors: string[]
}

export interface AnswerKeyResponse {
  exam_id: string
  version_number: number
  total_questions: number
  is_locked: boolean
  answer_key: Record<string, unknown>
}

export interface ReadingSubmitInput {
  answers: Record<string, unknown>[]
  exam_attempt_id?: number | null
}

export interface ReadingResultSummary {
  id: number
  exam_id: string
  correct_answers: number
  total_questions: number
  raw_score: number
  standard_score: number
  cefr_level: string
  percentage: number
  created_at: string
}

export interface ReadingResultDetail {
  summary: ReadingResultSummary
  review: Record<string, unknown>[]
}

// ---------- CEFR Listening ----------

export interface ListeningOption {
  id?: number
  value: string
  label: string
}

export interface ListeningQuestion {
  id?: number
  question_number: number
  type: string
  question: string
  correct_answer?: string
  options?: ListeningOption[]
}

export interface ListeningPart {
  id?: number
  part_number: number
  title: string
  instruction?: string | null
  task_type?: string | null
  audio_label?: string | null
  audio_url?: string | null
  context?: string | null
  passage?: string | null
  map_image?: string | null
  questions: ListeningQuestion[]
  options?: ListeningOption[]
}

export interface ListeningTest {
  title: string
  is_demo: boolean
  is_free: boolean
  is_mock: boolean
  is_active: boolean
  level: string
  duration: number
  total_questions: number
  sections: string
  audio_mode: 'EXAM' | 'PARTS'
  audio_url?: string | null
  id: string
  parts: ListeningPart[]
  created_at: string
}

export interface ListeningCreateInput {
  title: string
  is_demo?: boolean
  is_free?: boolean
  is_mock?: boolean
  is_active?: boolean
  level: string
  duration: number
  total_questions?: number
  sections?: string
  audio_mode?: 'EXAM' | 'PARTS'
  audio_url?: string | null
  parts: ListeningPart[]
}

export type ListeningUpdateInput = Partial<Omit<ListeningCreateInput, 'id'>>

export interface ListeningSubmitInput {
  answers: Record<string, unknown>[]
  exam_attempt_id?: number | null
}

export interface ListeningResultSummary {
  id: number
  exam_id: string
  correct_answers: number
  total_questions: number
  raw_score: number
  standard_score: number
  cefr_level: string
  percentage: number
  created_at: string
}

export interface ListeningResultDetail {
  summary: ListeningResultSummary
  review: Record<string, unknown>[]
}

export interface VerifiedResultSkill {
  cefr_level: string
  scaled_score: number
}

export interface VerifiedResult {
  full_name?: string
  student_id?: string
  result_id?: string | number
  overall_score?: number
  overall?: number
  cefr_level?: string
  status?: string
  reading?: VerifiedResultSkill
  listening?: VerifiedResultSkill
  writing?: VerifiedResultSkill
  speaking?: VerifiedResultSkill
  [key: string]: unknown
}

export interface WritingExam {
  id: string
  year: number
  sequence_number: number
  title: string
  cefr_level: CEFRLevel
  duration_minutes: number
  is_demo: boolean
  is_free: boolean
  is_mock: boolean
  is_active: boolean
  created_at: string
  tasks: Array<{
    id?: number
    exam_id?: string
    part_number: number
    sub_part?: number | null
    cefr_level?: CEFRLevel | null
    topic: string
    instruction: string
    context_text?: string | null
    question?: string | null
    word_limit?: number | { min: number; max: number } | null
    format?: Record<string, unknown>
  }>
}

export interface WritingSubmitInput {
  answers: Record<string, unknown>[]
}

export interface WritingResult {
  id: number
  user_id: number
  exam_id: string
  raw_score: number
  scaled_score: number
  cefr_level: CEFRLevel
  is_finalized: boolean
  created_at: string
  answers: Record<string, unknown>[]
}

// ---------- Speaking ----------

export interface SpeakingPart11 { question_1: string; question_2: string; question_3: string; prep_seconds: number; answer_seconds: number }
export interface SpeakingPart12 { image_1_url: string; image_2_url: string; question_describe: string; question_2: string; question_3: string; prep_seconds: number; describe_answer_seconds: number; answer_seconds: number }
export interface SpeakingPart2 { image_url: string; question_1: string; question_2: string; question_3: string; prep_seconds: number; answer_seconds: number }
export interface SpeakingPart3 { topic: string; for_points: string[]; against_points: string[]; prep_seconds: number; answer_seconds: number }

export interface SpeakingTestSummary {
  id: string
  title: string
  is_active: boolean
  created_at: string
}

export interface SpeakingTest extends SpeakingTestSummary {
  description: string | null
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export interface SpeakingTestCreateInput {
  // NOTE: id is NOT sent — backend auto-generates SPEAK-{8 nanoid}
  title: string
  description?: string | null
  is_active?: boolean
  part_1_1: SpeakingPart11
  part_1_2: SpeakingPart12
  part_2: SpeakingPart2
  part_3: SpeakingPart3
}

export type SpeakingTestUpdateInput = Partial<SpeakingTestCreateInput>

export interface AssignedSpeakingTest {
  skill_attempt_id: number
  speaking_test: SpeakingTest
}

export interface SpeakingSubmission {
  id: number
  user_id: number
  speaking_test_id: string
  mock_skill_attempt_id: number | null
  audio_url: string
  duration_seconds: number
  status: string
  created_at: string
  full_name?: string | null
  student_id?: string | null
}

export interface SpeakingResultInput {
  fluency_coherence?: number | null
  lexical_resource?: number | null
  grammar_accuracy?: number | null
  pronunciation?: number | null
  overall_band: number
  cefr_level?: string | null
  comment?: string | null
}

export interface SpeakingResult extends SpeakingResultInput {
  id: number
  submission_id: number
  evaluator_id: number
  created_at: string
}

// ---------- Admin ----------

export interface AdminStatistics {
  total_users: number
  total_exams_taken: number
  users_today: number
}
