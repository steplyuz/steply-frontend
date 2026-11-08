/* ─────────────────────────────────────────────────────────────────────────────
 * Duotone ko‘nikma ikonkalari (Reading, Listening, Writing, Speaking)
 * Asosiy chiziq — currentColor, to‘ldirma — currentColor 18% (har qanday fonda ishlaydi).
 * Dashboard va landing bir xil ikonkalardan foydalanadi.
 * Ishlatish: components/icons/skill-icons.tsx
 * ──────────────────────────────────────────────────────────────────────────── */

export type SkillIconProps = { className?: string }

const duo = {
    fill: 'currentColor',
    fillOpacity: 0.18,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
}

const line = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}

export function ReadingIcon({ className }: SkillIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path {...duo} d="M12 6.6C10.4 5.3 8 4.8 4.4 5v12.6c3.6-.2 6 .3 7.6 1.6 1.6-1.3 4-1.8 7.6-1.6V5c-3.6-.2-6 .3-7.6 1.6z" />
            <path {...line} d="M12 6.6v12.6" />
            <path {...line} d="M7 9.2c1.2 0 2.2.2 3 .6M7 12.2c1.2 0 2.2.2 3 .6" />
        </svg>
    )
}

export function ListeningIcon({ className }: SkillIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path {...line} d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
            <rect {...duo} x="3.5" y="13" width="4.6" height="7" rx="2.2" />
            <rect {...duo} x="15.9" y="13" width="4.6" height="7" rx="2.2" />
        </svg>
    )
}

export function WritingIcon({ className }: SkillIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path {...duo} d="M4 20l1-4.2L16.6 4.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
            <path {...line} d="M14.6 6.2l3.2 3.2" />
            <path {...line} d="M12.5 20.5H20" />
        </svg>
    )
}

export function SpeakingIcon({ className }: SkillIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <rect {...duo} x="9" y="3" width="6" height="11" rx="3" />
            <path {...line} d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            <path {...line} d="M12 18v3M9 21h6" />
        </svg>
    )
}