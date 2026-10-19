'use client'

/**
 * Admin — Writing testlari + baholash navbati.
 * Docs: GET /writing-tests, POST /admin/writing-tests (JSON body yoki multipart `file`),
 *       PUT /admin/writing-tests/{id}, DELETE /admin/writing-tests/{id}, GET .../paper-pdf
 * Test kutubxonasi Reading/Listening/Speaking bilan bir xil (TestLibrary).
 */

import { Pen } from 'lucide-react'
import { writingApi } from '@/lib/api'
import { TestLibrary, type TestLibraryConfig } from '@/components/admin/test-library'
import { WRITING_JSON_TEMPLATE } from '@/lib/admin/json-templates'
import type { WritingExam, WritingTask, WritingUpdateInput } from '@/lib/api/types'

async function readJson(file: File): Promise<Record<string, unknown>> {
  let raw: unknown
  try { raw = JSON.parse(await file.text()) } catch { throw new Error("JSON fayl formati noto'g'ri.") }
  const data = (raw as { exam?: unknown } | null)?.exam ?? raw
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error("JSON root object bo'lishi kerak.")
  return data as Record<string, unknown>
}

const config: TestLibraryConfig<WritingExam> = {
  noun: 'Writing',
  title: 'Writing testlari',
  description: "Writing testlarini yarating va JSON orqali yuklang. Inshoni baholash navbati pastda.",
  icon: Pen,
  load: writingApi.adminList,
  toRow: t => ({
    id: t.id,
    title: t.title,
    meta: [t.cefr_level, `${t.tasks?.length ?? 0} task`, `${t.duration_minutes} daq`],
    isActive: t.is_active,
    badges: [t.is_demo && 'Demo', t.is_free && 'Free', t.is_practice && 'Practice'].filter(Boolean) as string[],
  }),
  editHref: id => `/admin/writing/${id}`,
  remove: writingApi.remove,
  importJson: writingApi.importJson,
  create: v => writingApi.create({
    title: String(v.title).trim(),
    cefr_level: String(v.cefr_level),
    duration_minutes: Number(v.duration_minutes),
    tasks: [],
  }),
  createFields: [
    { name: 'title', label: 'Sarlavha', type: 'text', required: true, span: 3, placeholder: 'Writing Test B1 #1' },
    { name: 'cefr_level', label: 'CEFR darajasi', type: 'select', options: ['B1', 'B2', 'C1'], defaultValue: 'B1' },
    { name: 'duration_minutes', label: 'Davomiyligi (daqiqa)', type: 'number', min: 10, max: 240, defaultValue: 60 },
  ],
  downloads: [
    { label: 'Paper', title: "Savol qog'ozi (PDF)", url: writingApi.paperPdfUrl, filename: id => `${id}-paper.pdf` },
  ],
  // Testni JSON sifatida olish -> tahrirlash -> "Yangilash" bilan qayta yuklash (PUT, tasklar to'liq almashtiriladi)
  exportJson: t => ({
    title: t.title,
    cefr_level: t.cefr_level,
    duration_minutes: t.duration_minutes,
    is_demo: t.is_demo,
    is_free: t.is_free,
    is_practice: t.is_practice,
    is_active: t.is_active,
    tasks: (t.tasks ?? []).map((k: WritingTask) => ({
      part_number: k.part_number,
      sub_part: k.sub_part ?? null,
      topic: k.topic,
      instruction: k.instruction,
      context_text: k.context_text ?? null,
      question: k.question ?? null,
      word_limit: k.word_limit ?? null,
      format_id: k.format_id ?? (k.format as { id?: number } | undefined)?.id ?? null,
    })),
  }),
  updateFromJson: async (id, file) => {
    const d = await readJson(file)
    return writingApi.update(id, d as WritingUpdateInput)
  },
  jsonTemplate: WRITING_JSON_TEMPLATE,
  jsonHint: <>2025 formati: <code>1.1</code> (part 1, sub_part 1, B1, norasmiy), <code>1.2</code> (part 1, sub_part 2, B2, rasmiy), <code>2</code> (part 2, C1, post). Formatlar avtomatik 2025 talabiga ko&apos;ra yaratiladi (<code>format_id</code> kerak emas). Test to&apos;liq bo&apos;lishi uchun uchala topshiriq ham bo&apos;lishi shart.</>,
}

export default function AdminWritingPage() {
  return <TestLibrary config={config} />
}
