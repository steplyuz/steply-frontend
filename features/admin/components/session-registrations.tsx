'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

import { mockExamsApi } from '@/shared/api/modules/exam/mock-exams'
import { getErrorMessage } from '@/shared/api/client'
import type { ExamSession, SessionRegistration } from '@/shared/api/types'
import { GENDER_LABEL, REGION_LABEL, REGISTRATION_STATUS_LABEL } from '@/shared/lib/mock-labels'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { Badge, Empty, ErrorBox, Loading, btn } from '@/shared/ui/dashboard-kit'

/** Admin: sessiyaga yozilganlar ro'yxati va kelganlikni belgilash (confirm-attendance). */
export function SessionRegistrations({ session, onClose }: { session: ExamSession; onClose: () => void }) {
  const [rows, setRows] = useState<SessionRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await mockExamsApi.sessionRegistrations(session.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Ro‘yxatni yuklashda xatolik'))
    } finally {
      setLoading(false)
    }
  }, [session.id])

  useEffect(() => {
    void load()
  }, [load])

  const confirm = async (id: number) => {
    setBusyId(id)
    try {
      const updated = await mockExamsApi.confirmAttendance(id)
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)))
    } catch (err) {
      setError(getErrorMessage(err, 'Kelganlikni belgilashda xatolik'))
    } finally {
      setBusyId(null)
    }
  }

  const attended = rows.filter(r => r.status === 'ATTENDED').length

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Yozilganlar — {formatDateTime(session.exam_date)}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {rows.length} ta ro‘yxatda · {attended} ta kelgan · {session.location_address}
          </p>
        </div>
        <button type="button" onClick={onClose} className={btn.outline}><X className="size-4" /> Yopish</button>
      </div>

      <div className="mt-4">
        {error && <ErrorBox message={error} onRetry={() => void load()} />}
        {loading ? (
          <Loading rows={3} />
        ) : !rows.length ? (
          <Empty text="Bu sanaga hali hech kim yozilmagan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-foreground/50">
                <tr>
                  <th className="py-2 pr-3 font-semibold">F.I.O.</th>
                  <th className="py-2 pr-3 font-semibold">MK ID</th>
                  <th className="py-2 pr-3 font-semibold">Yoshi</th>
                  <th className="py-2 pr-3 font-semibold">Jins</th>
                  <th className="py-2 pr-3 font-semibold">Viloyat</th>
                  <th className="py-2 pr-3 font-semibold">Holat</th>
                  <th className="py-2 text-right font-semibold">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(r => {
                  const isAttended = r.status === 'ATTENDED'
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 pr-3 font-medium">{r.full_name}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{r.student_id}</td>
                      <td className="py-2.5 pr-3">{r.age}</td>
                      <td className="py-2.5 pr-3">{GENDER_LABEL[r.gender as keyof typeof GENDER_LABEL] ?? r.gender}</td>
                      <td className="py-2.5 pr-3">{REGION_LABEL[r.region as keyof typeof REGION_LABEL] ?? r.region}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={isAttended ? 'green' : r.status === 'CANCELLED' ? 'red' : 'sky'}>
                          {REGISTRATION_STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                        {r.attended_confirmed_at && (
                          <span className="ml-2 text-xs text-foreground/50">{formatDate(r.attended_confirmed_at, { withTime: true })}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          disabled={isAttended || r.status === 'CANCELLED' || busyId === r.id}
                          onClick={() => void confirm(r.id)}
                          className={`${btn.outline} min-h-8 px-3 py-1.5 text-xs disabled:opacity-40`}
                        >
                          <Check className="size-3.5" /> {busyId === r.id ? 'Saqlanmoqda…' : 'Keldi'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
