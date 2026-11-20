import type { PracticeSkill } from '@/shared/api/types'
import { PracticeResults } from '@/features/practice/components/practice-results'

const VALID_SKILLS: PracticeSkill[] = ['reading', 'listening', 'writing', 'speaking']

export default async function PracticeResultsPage({
    searchParams,
}: {
    searchParams: Promise<{ skill?: string }>
}) {
    const { skill } = await searchParams
    const initial = VALID_SKILLS.includes(skill as PracticeSkill) ? (skill as PracticeSkill) : 'all'
    return <PracticeResults initial={initial} />
}