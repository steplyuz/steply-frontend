'use client'

/**
 * Admin — Listening testlari.
 * Docs: GET /listening-tests, POST /admin/listening-tests (JSON body yoki multipart `file`),
 *       DELETE /admin/listening-tests/{id}, GET .../paper-pdf, GET .../answer-sheet
 * Audio yuklash: POST /admin/listening-tests/audio/upload (test tahrirlash sahifasida).
 */

import { Headphones } from 'lucide-react'
import { listeningApi } from '@/lib/api'
import { TestLibrary, type TestLibraryConfig } from '@/components/admin/test-library'
import { LISTENING_JSON_TEMPLATE } from '@/lib/admin/json-templates'
import type { ListeningTest } from '@/lib/api/types'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Multilevel']

const config: TestLibraryConfig<ListeningTest> = {
  noun: 'Listening',
  title: 'Listening testlari',
  description: "Listening testlarini yarating, JSON orqali yuklang, audio, PDF va OMR varaqlarini boshqaring.",
  icon: Headphones,
  load: listeningApi.adminList,
  toRow: t => ({
    id: t.id,
    title: t.title,
    meta: [t.level, `${t.total_questions ?? 0} savol`, `${t.duration} daq`],
    isActive: t.is_active,
    badges: [t.practice_part_number && `Part ${t.practice_part_number} mini-test`, t.is_demo && 'Demo', t.is_free && 'Free', t.is_practice && 'Practice'].filter(Boolean) as string[],
  }),
  remove: listeningApi.remove,
  importJson: listeningApi.importJson,
  create: v => listeningApi.create({
    title: String(v.title).trim(),
    level: String(v.level),
    duration: Number(v.duration),
    total_questions: 0,
    sections: '',
    audio_mode: 'PARTS',
    audio_url: null,
    parts: [],
  }),
  createFields: [
    { name: 'title', label: 'Sarlavha', type: 'text', required: true, span: 3, placeholder: 'Listening Test B1 #1' },
    { name: 'level', label: 'CEFR darajasi', type: 'select', options: CEFR_LEVELS, defaultValue: 'B1' },
    { name: 'duration', label: 'Davomiyligi (daqiqa)', type: 'number', min: 10, max: 90, defaultValue: 35 },
  ],
  // Kategoriyalar: to'liq testlar va Part 1..5 mini-testlar (practice_part_number bo'yicha)
  categories: [
    { key: 'full', label: "To'liq testlar" },
    ...[1, 2, 3, 4, 5].map(n => ({ key: `part-${n}`, label: `Part ${n}` })),
  ],
  categoryOf: t => (t.practice_part_number ? `part-${t.practice_part_number}` : 'full'),
  editHref: id => `/admin/listening/${id}`,
  downloads: [
    { label: 'Paper', title: "Savol qog'ozi (PDF)", url: listeningApi.paperPdfUrl, filename: id => `${id}-paper.pdf` },
    { label: 'OMR', title: "OMR javob varag'i (PDF)", url: listeningApi.answerSheetUrl, filename: id => `${id}-answer-sheet.pdf` },
  ],
  jsonTemplate: LISTENING_JSON_TEMPLATE,
  jsonHint: <>To&apos;liq Listening testini bitta JSON fayl bilan import qilish mumkin. <code>id</code> yuborilmaydi — backend o&apos;zi beradi. Audio avval yuklanadi, so&apos;ng URL JSON&apos;ga yoziladi.</>,
}

export default function AdminListeningListPage() {
  return <TestLibrary config={config} />
}