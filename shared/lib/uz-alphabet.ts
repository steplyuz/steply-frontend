/* ─────────────────────────────────────────────────────────────────────────────
 * O‘zbek lotin alifbosi: amaldagi (eski) ↔ yangi tahrir (2026-yil qonuni)
 *
 *   O‘ o‘ → Ö ö      G‘ g‘ → Ğ ğ      Sh sh → Ş ş      Ch ch → Ç ç
 *
 * Manba matnlar HOZIRGI alifboda yoziladi (o‘, g‘, sh, ch); yangi alifbo kerak
 * bo‘lganda shu konvertor orqali o‘tkaziladi. Manba matnga "ö", "ğ", "ş", "ç"
 * harflarini QO‘SHIB YOZMANG — ular faqat konvertor natijasida paydo bo‘ladi.
 * Faqat o‘zbekcha UI matnlariga qo‘llang (inglizcha so‘zlar, ism-familiyalar va
 * foydalanuvchi ma’lumotlariga emas).
 * ──────────────────────────────────────────────────────────────────────────── */

import { UZ_WORDS } from '@/shared/i18n/uz-words'

/** Interfeys tillari: o‘zbek lotin (amaldagi), o‘zbek lotin (yangi), o‘zbek kirill, ingliz, rus. */
export type UiLang = 'old' | 'new' | 'cyrl' | 'en' | 'ru'
export type UzAlphabet = UiLang

/** Standart alifbo. Yangi qonun kuchga kirgach (va tayyor bo‘lganda) 'new' qiling. */
export const DEFAULT_ALPHABET: UzAlphabet = 'old'

/** Tutuq/apostrof variantlari: ‘ ’ ʻ ʼ ' ` ´ */
const APOS = "‘’ʻʼ'`´"

const WORD_RE = new RegExp(`[\\p{L}\\p{M}${APOS}]+`, 'gu')
const OLD_O_G_RE = new RegExp(`([oOgG])[${APOS}]`, 'g')
const APOS_RE = new RegExp(`[${APOS}]`, 'g')
const NEW_LETTERS_RE = /[öÖğĞşŞçÇ]/g

/**
 * Konvertor tegmasligi kerak bo‘lgan (o‘zbekcha bo‘lmagan) so‘zlar, kichik harfda.
 * Matnda uchraydigan chet el so‘zlarini shu yerga qo‘shing.
 * Faqat butun so‘z mos kelganda ishlaydi ("check-in" ikkita so‘z sifatida tekshiriladi).
 */
export const KEEP_WORDS = new Set<string>([
    'english',
    'cambridge',
    'chrome',
    'check',
    'checkout',
    'chat',
    'coach',
    'coaching',
    'dashboard',
    'finish',
    'flashcard',
    'flashcards',
    'publish',
    'push',
    'search',
    'share',
    'teacher',
])

const OLD_TO_NEW_OG: Record<string, string> = { o: 'ö', O: 'Ö', g: 'ğ', G: 'Ğ' }

function tokenToNew(token: string): string {
    if (KEEP_WORDS.has(token.toLowerCase())) return token

    return token
        .replace(OLD_O_G_RE, (_m, c: string) => OLD_TO_NEW_OG[c])
        .replace(/sh/gi, (m) => (m[0] === 'S' ? 'Ş' : 'ş'))
        .replace(/ch/gi, (m) => (m[0] === 'C' ? 'Ç' : 'ç'))
}

/** Amaldagi alifbodan yangisiga: "Ro‘yxatdan o‘tish" → "Röyxatdan ötiş" */
export function toNewAlphabet(text: string): string {
    return text.replace(WORD_RE, tokenToNew)
}

const NEW_TO_OLD: Record<string, string> = {
    ö: 'o‘',
    Ö: 'O‘',
    ğ: 'g‘',
    Ğ: 'G‘',
    ş: 'sh',
    Ş: 'Sh',
    ç: 'ch',
    Ç: 'Ch',
}

function isUpperLetter(ch: string | undefined): boolean {
    return !!ch && ch === ch.toUpperCase() && ch !== ch.toLowerCase()
}

/**
 * Yangi alifbodan amaldagisiga: "Ötiş" → "O‘tish".
 * BOSH HARFLI so‘zda "SH"/"CH": ŞAHAR → SHAHAR, TOŞ → TOSH
 * (Ş/Ç yonida bosh harf bo‘lsa, oldinda ham, keyinda ham).
 * ÖZBEKİSTON kabi to‘liq bosh harfli so‘zda Ö/Ğ → O‘/G‘ (apostrof ham qo‘shiladi).
 */
export function toOldAlphabet(text: string): string {
    return text.normalize('NFC').replace(NEW_LETTERS_RE, (c, offset: number, full: string) => {
        const base = NEW_TO_OLD[c]
        if (c === 'Ş' || c === 'Ç') {
            if (isUpperLetter(full[offset + 1]) || isUpperLetter(full[offset - 1])) {
                return base.toUpperCase()
            }
        }
        return base
    })
}

/* ───────────────────────── Lotin → Kirill ───────────────────────── */

/** Kirillga o‘tkazilmaydigan so‘zlar (brend, qisqartma, fan nomlari), kichik harfda. */
export const CYRL_KEEP_WORDS = new Set<string>([
    ...KEEP_WORDS, 'steply', 'ielts', 'cefr', 'dtm', 'ai', 'qr', 'pdf', 'sms', 'url', 'id', 'mb', 'gb',
    'telegram', 'click', 'payme', 'uzcard', 'humo', 'mygov', 'edge', 'safari', 'google', 'ok', 'api',
    'reading', 'listening', 'writing', 'speaking', 'premium', 'free', 'mock', 'mk',
])

const CYRL_MAP: Record<string, string> = {
    a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м',
    n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х', y: 'й',
    z: 'з', c: 'к',
}

const isUpperCh = (c: string | undefined) => !!c && c !== c.toLowerCase()

function applyCase(out: string, first: string, next: string | undefined): string {
    if (!isUpperCh(first)) return out
    return isUpperCh(next) ? out.toUpperCase() : out.charAt(0).toUpperCase() + out.slice(1)
}

function tokenToCyrl(token: string): string {
    if (CYRL_KEEP_WORDS.has(token.toLowerCase())) return token
    const L = token.toLowerCase()
    let out = ''
    let i = 0
    while (i < L.length) {
        const ch = L[i]
        const two = L.slice(i, i + 2)
        let piece = ''
        let len = 1
        if ((ch === 'o' || ch === 'g') && L[i + 1] !== undefined && APOS.includes(L[i + 1])) {
            piece = ch === 'o' ? 'ў' : 'ғ'
            len = 2
        } else if (two === 'sh') { piece = 'ш'; len = 2 }
        else if (two === 'ch') { piece = 'ч'; len = 2 }
        else if (two === 'yo' && !(L[i + 2] !== undefined && APOS.includes(L[i + 2]))) { piece = 'ё'; len = 2 }
        else if (two === 'yu') { piece = 'ю'; len = 2 }
        else if (two === 'ya') { piece = 'я'; len = 2 }
        else if (two === 'ye') { piece = 'е'; len = 2 }
        else if (ch === 'e' && i === 0) piece = 'э'
        else if (APOS.includes(ch)) piece = i === 0 ? '' : 'ъ'
        else piece = CYRL_MAP[ch] ?? token[i]
        const isLetter = /[а-яёўқғҳ]/.test(piece)
        out += isLetter ? applyCase(piece, token[i], token[i + len]) : piece
        i += len
    }
    return out
}

/** Lotin → kirill: "Ro‘yxatdan o‘tish" → "Рўйхатдан ўтиш" */
export function toCyrillic(text: string): string {
    return text.replace(WORD_RE, tokenToCyrl)
}

/* ───────────── Matn o‘zbekcha ekanini aniqlash (DOM konvertori uchun) ───────────── */

const UZ_HINT_RE = new RegExp(
    `[oOgG][${APOS}]|\\b(imtihon|natija|sahifa|foydalanuvchi|to‘lov|obuna|tarif|ro‘yxat|kirish|chiqish|saqlash|bekor|yuklan|xatolik|qayta|davom|boshla|tugat|keyingi|oldingi|savol|javob|vaqt|daraja|tanlang|kiriting|mavjud|hisob|parol|telefon|familiya|manzil|sozlama|profil|tahlil|mashq|bo‘lim|ta|va|bilan|uchun|yoki|ham|emas|bor|bu|bir|kun|oy|yil|soat|daqiqa|ball|natijalar|tayyorgarlik|yo‘nalish|o‘qituvchi)\\b`,
    'iu',
)

export function looksUzbek(text: string): boolean {
    if (!/[A-Za-z]/.test(text)) return false
    const norm = text.replace(/[’ʻʼ`´']/g, '‘')
    if (UZ_HINT_RE.test(norm)) return true
    for (const m of norm.toLowerCase().matchAll(/[a-z‘]+/g)) {
        if (UZ_WORDS.has(m[0].replace(/^‘+|‘+$/g, ''))) return true
    }
    return false
}

export type Dict = Record<string, string>

/** Raqam: 12, 1 234, 3.5, 4,5 */
const NUM_RE = /\d+(?: \d{3})*(?:[.,]\d+)?/g
/** Sana/vaqt/oraliq bitta raqam sifatida: 12.03.2026, 12/03/2026, 14:30, 10-15 (zaxira andoza) */
const NUM_RE_DATE = /\d{1,4}(?:[./:-]\d{1,4})+|\d+(?: \d{3})*(?:[.,]\d+)?/g

export function normKey(text: string): string {
    return text.replace(/[’ʻʼ`´']/g, '‘').replace(/\s+/g, ' ').trim()
}

/** en/ru: lug‘atdan topadi; topilmasa manba matn o‘zgarishsiz qoladi. */
export function translateWith(text: string, dict: Dict | null): string {
    if (!dict) return text
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)
    if (!m || !m[2]) return text
    const [, lead, core, trail] = m
    const hit = dict[normKey(core)]
    if (hit !== undefined) return lead + hit + trail
    // Raqamli andoza: "5 kun qoldi" → kalit "# kun qoldi" (har bir # raqam bilan almashtiriladi).
    // Avval oddiy raqamlar, topilmasa sana/vaqt/oraliq bitta raqam sifatida.
    for (const re of [NUM_RE, NUM_RE_DATE]) {
        const nums: string[] = []
        const pattern = normKey(core).replace(re, (n) => {
            nums.push(n)
            return '#'
        })
        if (nums.length === 0) continue
        const pHit = dict[pattern]
        if (pHit !== undefined && pHit.split('#').length - 1 === nums.length) {
            let k = 0
            return lead + pHit.replace(/#/g, () => nums[k++]) + trail
        }
    }
    for (const sep of [' · ', ' — ', ' / ', ' | ', ': ', ', ']) {
        if (core.includes(sep)) {
            const parts = core.split(sep)
            const out = parts.map((x) => dict[normKey(x)] ?? x)
            if (out.some((x, k) => x !== parts[k])) return lead + out.join(sep) + trail
        }
    }
    return text
}

/** Matnni kerakli alifbo/tilga o‘tkazadi (manba matn amaldagi alifboda deb hisoblanadi). */
export function convertUz(text: string, lang: UiLang, dict: Dict | null = null): string {
    switch (lang) {
        case 'new':
            return toNewAlphabet(text)
        case 'cyrl':
            return toCyrillic(text)
        case 'en':
        case 'ru':
            return translateWith(text, dict)
        default:
            return text
    }
}

/**
 * Qidiruv kaliti: eski va yangi yozuvda yozilgan bir xil so‘z bir xil kalitga keladi.
 * "Toshkent" va "Taşkent" → "toshkent"; "O‘zbek" va "Özbek" → "ozbek". Tutuq belgilari olib tashlanadi.
 */
export function uzSearchKey(text: string): string {
    return toOldAlphabet(text)
        .normalize('NFKC')
        .toLowerCase()
        .replace(APOS_RE, '')
}
