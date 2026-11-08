// Steply kabineti uchun yagona dizayn manbasi (yashil brend).
// Dashboard, imtihon, onboarding, auth va landing shu yerdan oladi.
// Palitra:  #0F3D26 (to'q)  #1F7A4D (asosiy)  #5DBB8A (yorqin)  #9BE3BC (glow)
//           #CDEBDA (soft)  #E4F1E9 (och fon)  #0F2A1C (matn)   #F1F5F2 (sahifa foni)

export const G_DARK = '#0F3D26' // to'q yashil: tugma, faol holat, matn urg'usi
export const G_MID = '#1F7A4D' // asosiy yashil: CTA, progress, ikonka
export const G_LIGHT = '#5DBB8A' // yorqin yashil: to'q fonda matn/nuqta
export const G_GLOW = '#9BE3BC' // to'q fondagi urg'u
export const G_SOFT = '#CDEBDA' // marker / tanlov foni
export const G_PALE = '#E4F1E9' // badge, ikonka doirasi
export const G_DEEP = '#0B2E1D' // eng to'q sirt (teksturali karta)

export const INK = '#0F2A1C' // asosiy matn
export const PAPER = '#FFFFFF' // karta / sidebar / topbar foni
export const CANVAS = '#F1F5F2' // sahifa foni (kartalar ustida ajralib turadi)

/** Eski nom (lime) saqlangan: endi yashil glow. To'ldirilgan fon (matni G_DARK) yoki to'q fondagi urg'u sifatida ishlating. */
export const LIME = G_GLOW
export const LIME_DEEP = G_DARK
/** Och fonda o'qiladigan yashil matn (oldin LIME_TEXT) */
export const LIME_TEXT = G_MID

export type Tone = 'blue' | 'purple' | 'orange' | 'red'

// Ko'nikma ranglari: dashboardda barcha ko'nikmalar bitta brend rangida
export const TONES: Record<Tone, string> = {
  blue: G_DARK, // Reading
  purple: G_DARK, // Listening
  orange: G_DARK, // Writing
  red: G_DARK, // Speaking
}

/** Karta: oq, yumshoq yashil halqa. Butun kabinetda bir xil. */
export const CARD = 'rounded-3xl bg-white ring-1 ring-[#0F3D26]/[0.06]'
/** Ikkilamchi blok (karta ichidagi bo'lim) */
export const CARD_SOFT = 'rounded-2xl bg-[#F1F5F2] ring-1 ring-[#0F3D26]/[0.05]'
/** To'q yashil gradient (asosiy statistika / hero) */
export const GRADIENT_FEATURED = `radial-gradient(120% 100% at 0% 0%, #2A9460 0%, ${G_MID} 45%, ${G_DARK} 100%)`
export const GRADIENT_PRIMARY = `linear-gradient(135deg, ${G_MID}, ${G_DARK})`

export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D26] focus-visible:ring-offset-2 focus-visible:ring-offset-background'

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
