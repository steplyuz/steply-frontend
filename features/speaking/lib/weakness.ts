import type { SpeakingAiEvaluation, SpeakingAiPart, SpeakingAiPartCode } from '@/shared/api/types'

export type Severity = 'weak' | 'medium' | 'good'

export const PART_INFO: Record<SpeakingAiPartCode, { title: string; level: string; tip: string }> = {
  '1.1': {
    title: '1.1 — Shaxsiy savollar',
    level: 'A1–A2',
    tip: 'Har bir savolga to‘liq gap bilan javob bering va savol mavzusidan chiqib ketmang. Oddiy grammatika va tanish so‘zlardan foydalaning.',
  },
  '1.2': {
    title: '1.2 — Rasm tasviri va fikr',
    level: 'B1',
    tip: 'Rasmda nima ko‘rinayotganini tasvirlang, so‘ng o‘z fikringizni sabab bilan ayting. Bog‘lovchilardan (because, so, but) foydalaning.',
  },
  '2': {
    title: '2 — Abstrakt mavzu',
    level: 'B2',
    tip: 'Fikringizni misollar bilan kengaytiring, to‘xtab qolmasdan davom eting. Boy lug‘at va murakkabroq gaplar ishlating.',
  },
  '3': {
    title: '3 — Balanslangan bahs',
    level: 'C1',
    tip: 'Mavzuning ikkala tomonini (foyda va zarar) ko‘rib chiqing, so‘ng xulosa chiqaring. Mantiqiy bog‘lovchilardan foydalaning.',
  },
}

export const PART_ORDER: SpeakingAiPartCode[] = ['1.1', '1.2', '2', '3']

export function severityOf(ratio: number): Severity {
  if (ratio < 0.5) return 'weak'
  if (ratio < 0.75) return 'medium'
  return 'good'
}

export const SEVERITY_LABEL: Record<Severity, string> = { weak: 'Zaif', medium: 'o‘rtacha', good: 'Yaxshi' }

export interface PartInsight {
  part: SpeakingAiPartCode
  score: number
  max: number
  ratio: number
  severity: Severity
  /** Savol mavzusiga mos kelmagan javoblar (savol tartib raqamlari). */
  offTopic: number[]
  total: number
  feedback: string
}

export function analysePart(p: SpeakingAiPart): PartInsight {
  const ratio = p.max > 0 ? p.score / p.max : 0
  const questions = p.questions ?? []
  return {
    part: p.part,
    score: p.score,
    max: p.max,
    ratio,
    severity: severityOf(ratio),
    offTopic: questions.filter((q) => !q.on_topic).map((q) => q.n),
    total: questions.length,
    feedback: p.feedback_uz ?? '',
  }
}

/** Bitta baholash bo'yicha qismlar tahlili (1.1 → 3 tartibida). */
export function analyseEvaluation(ev: SpeakingAiEvaluation): PartInsight[] {
  return (ev.parts ?? []).map(analysePart).sort((a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part))
}

export interface AggregatePart {
  part: SpeakingAiPartCode
  attempts: number
  avgRatio: number
  severity: Severity
  offTopicRate: number
}

/** Bir nechta baholash bo'yicha o'rtacha: eng zaif qism birinchi. */
export function aggregate(evals: SpeakingAiEvaluation[]): AggregatePart[] {
  const acc = new Map<SpeakingAiPartCode, { n: number; ratio: number; off: number; total: number }>()
  for (const ev of evals) {
    for (const ins of analyseEvaluation(ev)) {
      const cur = acc.get(ins.part) ?? { n: 0, ratio: 0, off: 0, total: 0 }
      cur.n += 1
      cur.ratio += ins.ratio
      cur.off += ins.offTopic.length
      cur.total += ins.total
      acc.set(ins.part, cur)
    }
  }
  return [...acc.entries()]
    .map(([part, v]) => {
      const avgRatio = v.n ? v.ratio / v.n : 0
      return { part, attempts: v.n, avgRatio, severity: severityOf(avgRatio), offTopicRate: v.total ? v.off / v.total : 0 }
    })
    .sort((a, b) => a.avgRatio - b.avgRatio)
}
