'use client'

// components/audio-upload-field.tsx
//
// Ishlatilishi (Part uchun):
//   <AudioUploadField
//     label={`Part ${part.part_number} audio`}
//     value={part.audio_url}
//     disabled={isLocked}
//     onChange={url => updatePart(pIdx, { audio_url: url })}
//   />
// audio_mode === 'EXAM' bo'lsa, xuddi shu komponentni test.audio_url uchun ishlating.
// Yuklangandan keyin "Saqlash" tugmasini bosish SHART: yuklash faqat URL beradi, testga o'zi biriktirmaydi.

import { useState } from 'react'
import { MAX_AUDIO_MB, resolveAudioUrl, uploadListeningAudio } from '@/lib/api'

interface Props {
  label: string
  value: string | null | undefined
  disabled?: boolean
  onChange: (url: string) => void
}

export function AudioUploadField({ label, value, disabled, onChange }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const uploading = progress !== null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // bir xil faylni qayta tanlash mumkin bo'lsin
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      const res = await uploadListeningAudio(file, setProgress)
      onChange(res.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-2">
      <span className="label-xs">{label}</span>

      <input
        type="file"
        accept=".mp3,.m4a,.wav,.ogg,.webm,audio/*"
        disabled={disabled || uploading}
        onChange={handleFile}
        className="block w-full text-xs file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold disabled:opacity-60"
      />
      <p className="text-xs text-muted-foreground">Maksimal hajm: {MAX_AUDIO_MB} MB. Yuklagandan keyin testni saqlang.</p>

      {uploading && (
        <div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{progress}% yuklanmoqda...</p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>
      )}

      {value && (
        <div className="space-y-1">
          <audio controls preload="none" src={resolveAudioUrl(value)} className="w-full" />
          <p className="truncate text-[11px] text-muted-foreground">{value}</p>
        </div>
      )}
    </div>
  )
}