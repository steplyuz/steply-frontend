'use client'

/**
 * Admin — Speaking testlari.
 * Docs: GET /admin/speaking-tests, POST /admin/speaking-tests (JSON body yoki multipart `file`),
 *       PUT /admin/speaking-tests/{id}, DELETE /admin/speaking-tests/{id}
 * Baholash (pending submissions): /admin/speaking/assessments
 */

import Link from 'next/link'
import { ChevronRight, Mic } from 'lucide-react'
import { speakingApi } from '@/lib/api'
import { TestLibrary, type TestLibraryConfig } from '@/components/admin/test-library'
import { SPEAKING_JSON_TEMPLATE } from '@/lib/admin/json-templates'
import type { SpeakingTestSummary, SpeakingTestUpdateInput } from '@/lib/api/types'

const config: TestLibraryConfig<SpeakingTestSummary> = {
  noun: 'Speaking',
  title: 'Speaking testlari',
  description: "Speaking testlarini (4 qism) JSON orqali yuklang. Talaba yozuvlarini baholash alohida bo'limda.",
  icon: Mic,
  load: speakingApi.adminList,
  toRow: t => ({
    id: t.id,
    title: t.title,
    meta: [new Date(t.created_at).toLocaleDateString('uz-UZ')],
    isActive: t.is_active,
  }),
  editHref: id => `/admin/speaking/questions/${id}`,
  remove: speakingApi.remove,
  importJson: speakingApi.importJson,
  create: v => speakingApi.create({
    title: String(v.title).trim(),
    description: String(v.description ?? '').trim() || null,
    // 4 qism majburiy — bo'sh skelet yaratiladi, keyin JSON bilan to'ldiriladi
    part_1_1: { question_1: '', question_2: '', question_3: '', prep_seconds: 10, answer_seconds: 30 },
    part_1_2: { image_1_url: '', image_2_url: '', question_describe: '', question_2: '', question_3: '', prep_seconds: 15, describe_answer_seconds: 45, answer_seconds: 30 },
    part_2: { image_url: '', question_1: '', question_2: '', question_3: '', prep_seconds: 60, answer_seconds: 120 },
    part_3: { topic: '', for_points: [], against_points: [], prep_seconds: 60, answer_seconds: 180 },
  }),
  createFields: [
    { name: 'title', label: 'Sarlavha', type: 'text', required: true, span: 3, placeholder: 'Speaking Test B2 #1' },
    { name: 'description', label: 'Tavsif (ixtiyoriy)', type: 'text', span: 3, placeholder: 'B2 darajasi uchun...' },
  ],
  createHint: "Speaking testi 4 majburiy qismdan iborat. Forma bo'sh skelet yaratadi — to'liq testni JSON import bilan qo'shish qulayroq.",
  createSubmitLabel: "Yaratish (bo'sh skelet)",
  updateFromJson: async (id, file) => {
    let raw: unknown
    try { raw = JSON.parse(await file.text()) } catch { throw new Error("JSON fayl formati noto'g'ri.") }
    return speakingApi.update(id, raw as SpeakingTestUpdateInput)
  },
  headerExtra: (
    <Link href="/admin/speaking/assessments"
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition-all hover:border-foreground hover:bg-muted">
      Baholash <ChevronRight className="size-4" />
    </Link>
  ),
  rowExtra: t => (
    <Link href={`/admin/speaking/assessments?test=${t.id}`}
      className="inline-flex h-8 items-center gap-1 rounded-xl border border-border px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary">
      Baholash <ChevronRight className="size-3" />
    </Link>
  ),
  jsonTemplate: SPEAKING_JSON_TEMPLATE,
  jsonHint: <>Speaking testi 4 majburiy qismdan iborat: <code>part_1_1</code>, <code>part_1_2</code>, <code>part_2</code>, <code>part_3</code>. <code>id</code> yuborilmaydi — backend o&apos;zi beradi.</>,
}

export default function AdminSpeakingQuestionsPage() {
  return <TestLibrary config={config} />
}
