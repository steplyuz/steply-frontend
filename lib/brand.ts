// Steply kabineti uchun yagona dizayn manbasi: sidebar, topbar va layout shu yerdan oladi.

export const INK = '#0B0B0D' // asosiy matn va faol holat
export const PAPER = '#FFFFFF' // sidebar va topbar foni
export const CANVAS = '#F7F7F5' // sahifa foni (kartalar ustida ajralib turishi uchun)
export const LIME = '#E4F70A' // faqat to'ldirilgan fon sifatida (matn emas)
export const LIME_DEEP = '#0B0B0D' // och fonda ko'rinadigan nuqta/aksent

export type Tone = 'blue' | 'purple' | 'orange' | 'red'

// Ko'nikma ranglari
export const TONES: Record<Tone, string> = {
  blue: '#0B0B0D', // Reading — brand ink
  purple: '#0B0B0D', // Listening — brand ink
  orange: '#0B0B0D', // Writing — brand ink
  red: '#0B0B0D', // Speaking — brand ink
}

export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function initials(name?: string | null) {
  if (!name) return 'U'
  const v = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
  return v || 'U'
}