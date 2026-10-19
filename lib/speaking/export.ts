'use client'

// Speaking savollari va audio yozuvlarini yuklab olish + so'nggi urinishlar tarixi (brauzerda).
// Tarix localStorage'da saqlanadi: savollar nusxasi + backend submission id'lari.
// Audio fayllarning o'zi backenddan (GET /speaking-tests/submissions/{id}/audio) olinadi.

import JSZip from 'jszip'
import { authenticatedBlob, speakingApi } from '@/lib/api'

export interface QuestionSnapshot {
  key: string
  partName: string
  label: string
  text: string
  images: string[]
  prepSeconds?: number
  answerSeconds?: number
  forPoints?: string[]
  againstPoints?: string[]
}

/** blobUrl — shu sessiyadagi lokal nusxa; submissionId — serverdagi nusxa. */
export interface RecordingRef {
  submissionId?: number
  blobUrl?: string
  ext: string
}

export interface SpeakingAttemptRecord {
  id: string
  testId: string
  title: string
  finishedAt: string
  questions: QuestionSnapshot[]
  recordings: Record<string, { submissionId: number; ext: string }>
}

const HISTORY_LIMIT = 20
const historyKey = (userId: string) => `steply-speaking-history-${userId}`

export function loadHistory(userId: string): SpeakingAttemptRecord[] {
  try {
    const raw = localStorage.getItem(historyKey(userId))
    return raw ? (JSON.parse(raw) as SpeakingAttemptRecord[]) : []
  } catch {
    return []
  }
}

export function saveAttempt(userId: string, attempt: SpeakingAttemptRecord) {
  try {
    const next = [attempt, ...loadHistory(userId).filter((a) => a.id !== attempt.id)].slice(0, HISTORY_LIMIT)
    localStorage.setItem(historyKey(userId), JSON.stringify(next))
  } catch {
    /* localStorage to'la yoki o'chiq — tarix ixtiyoriy */
  }
}

const slug = (v: string) =>
  v.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 60) || 'speaking'

const pad = (n: number) => String(n).padStart(2, '0')

export function buildQuestionsText(title: string, questions: QuestionSnapshot[]): string {
  const lines: string[] = [`STEPLY — SPEAKING SAVOLLARI`, title, ''.padEnd(48, '='), '']
  let lastPart = ''
  questions.forEach((q, i) => {
    if (q.partName !== lastPart) {
      lines.push(q.partName.toUpperCase(), '')
      lastPart = q.partName
    }
    lines.push(`${i + 1}. ${q.label}`)
    const timing = [q.prepSeconds ? `tayyorgarlik: ${q.prepSeconds}s` : '', q.answerSeconds ? `javob: ${q.answerSeconds}s` : '']
      .filter(Boolean)
      .join(' · ')
    if (timing) lines.push(`   (${timing})`)
    lines.push(...q.text.split('\n').map((l) => `   ${l}`))
    if (q.forPoints?.length) lines.push('   Qo\'llab-quvvatlovchi fikrlar:', ...q.forPoints.map((p) => `    - ${p}`))
    if (q.againstPoints?.length) lines.push('   Qarshi fikrlar:', ...q.againstPoints.map((p) => `    - ${p}`))
    if (q.images.length) lines.push('   Rasm(lar):', ...q.images.map((u) => `    ${u}`))
    lines.push('')
  })
  return lines.join('\n')
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadQuestions(title: string, questions: QuestionSnapshot[]) {
  const blob = new Blob([buildQuestionsText(title, questions)], { type: 'text/plain;charset=utf-8' })
  saveBlob(blob, `${slug(title)}-savollar.txt`)
}

export async function fetchRecordingBlob(ref: RecordingRef): Promise<Blob> {
  if (ref.blobUrl) {
    try {
      const res = await fetch(ref.blobUrl)
      if (res.ok) return await res.blob()
    } catch {
      /* blob URL eskirgan — serverdan olamiz */
    }
  }
  if (ref.submissionId != null) return authenticatedBlob(speakingApi.submissionAudioUrl(ref.submissionId))
  throw new Error('Audio topilmadi')
}

export const recordingFilename = (title: string, index: number, label: string, ext: string) =>
  `${slug(title)}-${pad(index + 1)}-${slug(label)}.${ext}`

export async function downloadRecording(ref: RecordingRef, filename: string) {
  saveBlob(await fetchRecordingBlob(ref), filename)
}

/** savollar.txt + audio/NN-savol.ext — bitta ZIP. Yuklanmagan audiolar o'tkazib yuboriladi. */
export async function downloadAllZip(
  title: string,
  questions: QuestionSnapshot[],
  recordings: Record<string, RecordingRef>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ added: number; failed: number }> {
  const zip = new JSZip()
  zip.file('savollar.txt', buildQuestionsText(title, questions))
  const audio = zip.folder('audio')!
  const items = questions.map((q, i) => ({ q, i, ref: recordings[q.key] })).filter((x) => x.ref)
  let added = 0
  let failed = 0
  for (const { q, i, ref } of items) {
    try {
      audio.file(`${pad(i + 1)}-${slug(q.label)}.${ref.ext}`, await fetchRecordingBlob(ref))
      added++
    } catch {
      failed++
    }
    onProgress?.(added + failed, items.length)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  saveBlob(blob, `${slug(title)}-speaking.zip`)
  return { added, failed }
}
