  'use client'

  /**
   * Admin — Reading testlari.
   * Docs: GET /reading-tests, POST /admin/reading-tests (JSON body yoki multipart `file`),
   *       DELETE /admin/reading-tests/{id}, GET .../paper-pdf, GET .../answer-sheet
   */

  import { BookOpen } from 'lucide-react'
  import { readingApi } from '@/lib/api'
  import { TestLibrary, type TestLibraryConfig } from '@/components/admin/test-library'
  import { READING_JSON_TEMPLATE } from '@/lib/admin/json-templates'
  import type { ReadingTest } from '@/lib/api/types'

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

  const config: TestLibraryConfig<ReadingTest> = {
    noun: 'Reading',
    title: 'Reading testlari',
    description: "Reading testlarini yarating, JSON orqali yuklang, PDF va OMR varaqlarini oling.",
    icon: BookOpen,
    load: readingApi.adminList,
    toRow: t => ({
      id: t.id,
      title: t.title,
      meta: [t.cefr_level, `${t.total_questions ?? 0} savol`, `${t.duration_minutes} daq`],
      isActive: t.is_active,
      badges: [t.practice_part_number && `Part ${t.practice_part_number} mini-test`, t.is_demo && 'Demo', t.is_free && 'Free', t.is_practice && 'Practice'].filter(Boolean) as string[],
    }),
    remove: readingApi.remove,
    importJson: readingApi.importJson,
    create: v => readingApi.create({
      title: String(v.title).trim(),
      cefr_level: String(v.cefr_level),
      language: String(v.language),
      duration_minutes: Number(v.duration_minutes),
      parts: [],
    }),
    createFields: [
      { name: 'title', label: 'Sarlavha', type: 'text', required: true, span: 3, placeholder: 'Reading Test B1 #1' },
      { name: 'cefr_level', label: 'CEFR darajasi', type: 'select', options: CEFR_LEVELS, defaultValue: 'B1' },
      { name: 'language', label: 'Til', type: 'select', options: ['en', 'uz', 'ru'], defaultValue: 'en' },
      { name: 'duration_minutes', label: 'Davomiyligi (daqiqa)', type: 'number', min: 10, max: 180, defaultValue: 60 },
    ],
    // Kategoriyalar: to'liq testlar va Part 1..5 mini-testlar (practice_part_number bo'yicha)
    categories: [
      { key: 'full', label: "To'liq testlar" },
      ...[1, 2, 3, 4, 5].map(n => ({ key: `part-${n}`, label: `Part ${n}` })),
    ],
    categoryOf: t => (t.practice_part_number ? `part-${t.practice_part_number}` : 'full'),
    editHref: id => `/admin/reading/${id}`,
    downloads: [
      { label: 'Paper', title: "Savol qog'ozi (PDF)", url: readingApi.paperPdfUrl, filename: id => `${id}-paper.pdf` },
      { label: 'OMR', title: "OMR javob varag'i (PDF)", url: readingApi.answerSheetUrl, filename: id => `${id}-answer-sheet.pdf` },
    ],
    jsonTemplate: READING_JSON_TEMPLATE,
    jsonHint: <>To&apos;liq Reading testini bitta JSON fayl bilan import qilish mumkin. <code>id</code> yuborilmaydi — backend o&apos;zi beradi.</>,
  }

  export default function AdminReadingListPage() {
    return <TestLibrary config={config} />
  }
