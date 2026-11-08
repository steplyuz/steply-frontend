'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import { useAuth } from '@/shared/providers/auth-context'
import { profileApi } from '@/shared/api'
import {
    DEFAULT_ALPHABET,
    convertUz,
    looksUzbek,
    normKey,
    type Dict,
    type UiLang,
} from '@/shared/lib/uz-alphabet'

/* Foydalanuvchi tanlagan til/alifbo: 'old' | 'new' | 'cyrl' | 'en' | 'ru'.
   Manba matnlar amaldagi o‘zbek lotin alifbosida yoziladi; <Uz>/t() va DOM konvertori
   (LanguageDomSync) ularni tanlangan tilga o‘tkazadi.

   Saqlash:
   • brauzerda (localStorage) — barcha 5 variant;
   • backendda (profile.language) — faqat 'uz' | 'ru' | 'en' (alifbo varianti brauzerda qoladi).
   Kirgan foydalanuvchida til qurilmalar o‘rtasida ham saqlanadi. */

const STORAGE_KEY = 'steply:uz-alphabet'
const LANGS: UiLang[] = ['old', 'new', 'cyrl', 'en', 'ru']

const HTML_LANG: Record<UiLang, string> = {
    old: 'uz',
    new: 'uz',
    cyrl: 'uz-Cyrl',
    en: 'en',
    ru: 'ru',
}

/** Backend (profile.language) qiymati: old/new/cyrl → 'uz'. */
export function toBackendLang(lang: UiLang): 'uz' | 'ru' | 'en' {
    return lang === 'en' ? 'en' : lang === 'ru' ? 'ru' : 'uz'
}

/** Backend qiymatidan UI tili. 'uz' bo‘lsa, joriy alifbo (old/new/cyrl) saqlanadi. */
function fromBackendLang(code: string | null | undefined, current: UiLang): UiLang | null {
    const c = (code ?? '').toLowerCase().split(/[-_]/)[0]
    if (c === 'en') return 'en'
    if (c === 'ru') return 'ru'
    if (c === 'uz') return current === 'en' || current === 'ru' ? 'old' : current
    return null
}

interface AlphabetContextValue {
    /** joriy til/alifbo (eski nom — alphabet — moslik uchun saqlangan) */
    alphabet: UiLang
    lang: UiLang
    setAlphabet: (value: UiLang) => void
    setLang: (value: UiLang) => void
    /** o‘zbekcha matnni tanlangan til/alifboga o‘tkazadi */
    t: (text: string) => string
}

const AlphabetContext = createContext<AlphabetContextValue>({
    alphabet: DEFAULT_ALPHABET,
    lang: DEFAULT_ALPHABET,
    setAlphabet: () => { },
    setLang: () => { },
    t: (text) => text,
})

function isLang(value: unknown): value is UiLang {
    return typeof value === 'string' && (LANGS as string[]).includes(value)
}

function readStored(): UiLang | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return isLang(stored) ? stored : null
    } catch {
        return null
    }
}

const dictCache: Partial<Record<UiLang, Dict>> = {}

async function loadDict(lang: UiLang): Promise<Dict | null> {
    if (lang !== 'en' && lang !== 'ru') return null
    if (dictCache[lang]) return dictCache[lang]!
    try {
        const mod = lang === 'en' ? await import('@/shared/i18n/dict/en') : await import('@/shared/i18n/dict/ru')
        dictCache[lang] = mod.default
        return mod.default
    } catch {
        /* lug‘at yuklanmadi — o‘zbekcha qoladi */
        return null
    }
}

export function AlphabetProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth()
    const [lang, setLangState] = useState<UiLang>(DEFAULT_ALPHABET)
    // Lug‘at yuklangach ham, til almashganda ham eskisi o‘rnida turadi (miltillash bo‘lmasin)
    const [dicts, setDicts] = useState<Partial<Record<UiLang, Dict>>>({ ...dictCache })
    const dict = lang === 'en' || lang === 'ru' ? (dicts[lang] ?? null) : null

    // Brauzerda saqlangan tanlov
    useEffect(() => {
        const stored = readStored()
        if (stored) setLangState(stored)
    }, [])

    // en/ru lug‘atini yuklash
    useEffect(() => {
        if ((lang !== 'en' && lang !== 'ru') || dicts[lang]) return
        let alive = true
        loadDict(lang).then((d) => {
            if (alive && d) setDicts((prev) => ({ ...prev, [lang]: d }))
        })
        return () => {
            alive = false
        }
    }, [lang, dicts])

    // CSS/skriptlar uchun: <html data-alphabet="..." lang="...">
    useEffect(() => {
        document.documentElement.dataset.alphabet = lang
        document.documentElement.lang = HTML_LANG[lang]
    }, [lang])

    const pushToBackend = useCallback((value: UiLang) => {
        // Xatolik interfeysni to‘xtatmasin: til brauzerda baribir saqlangan
        profileApi.update({ language: toBackendLang(value) }).catch(() => { })
    }, [])

    const backendLangRef = useRef<string | undefined>(undefined)
    backendLangRef.current = user?.profile?.language

    const setLang = useCallback(
        (value: UiLang) => {
            setLangState(value)
            try {
                localStorage.setItem(STORAGE_KEY, value)
            } catch {
                /* e'tiborsiz */
            }
            if (isAuthenticated && backendLangRef.current !== toBackendLang(value)) {
                backendLangRef.current = toBackendLang(value)
                pushToBackend(value)
            }
        },
        [isAuthenticated, pushToBackend],
    )

    // Kirgan foydalanuvchi: backenddagi til bilan moslashtirish (har bir kirish uchun bir marta).
    //  • brauzerda aniq tanlov bo‘lmasa — backend tili olinadi;
    //  • bo‘lsa — brauzer tanlovi backendga yoziladi.
    const syncedRef = useRef(false)
    useEffect(() => {
        if (!isAuthenticated || !user) {
            syncedRef.current = false
            return
        }
        if (syncedRef.current) return
        syncedRef.current = true

        const stored = readStored()
        const backend = user.profile?.language
        if (!stored) {
            const next = fromBackendLang(backend, lang)
            if (next && next !== lang) setLangState(next)
        } else if (backend && toBackendLang(stored) !== backend.toLowerCase().split(/[-_]/)[0]) {
            pushToBackend(stored)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user])

    const t = useCallback((text: string) => convertUz(text, lang, dict), [lang, dict])

    const value = useMemo(
        () => ({ alphabet: lang, lang, setAlphabet: setLang, setLang, t }),
        [lang, setLang, t],
    )

    return (
        <AlphabetContext.Provider value={value}>
            {children}
            <LanguageDomSync lang={lang} dict={dict} />
        </AlphabetContext.Provider>
    )
}

/** const { t, lang, setLang } = useAlphabet() */
export function useAlphabet() {
    return useContext(AlphabetContext)
}

/** JSX uchun qisqa yo‘l: <Uz>Ro‘yxatdan o‘tish</Uz> (faqat bitta matn bolasi) */
export function Uz({ children }: { children: string }) {
    const { t } = useAlphabet()
    return <>{t(children)}</>
}

/* ─────────────────────────────────────────────────────────────────────────────
 * LanguageDomSync — <Uz>/t() ga o‘ralmagan barcha matnlarni ham o‘tkazadi.
 *  • matn tugunlari + placeholder / title / aria-label / alt atributlari
 *  • asl (manba) matn WeakMap'da saqlanadi — 'old' ga qaytganda tiklanadi
 *  • React matnni o‘zgartirsa, yangi matn manba deb olinadi
 *  • data-no-i18n bor elementlar (test matni, foydalanuvchi kontenti) tegilmaydi
 *  • en/ru: React bitta jumlani bir nechta tugunga bo‘lib beradi ("{n} ta savol" → "5" + " ta savol");
 *    qo‘shni matn tugunlari birlashtirilib, jumla sifatida tarjima qilinadi
 *  • brauzer tabi sarlavhasi (document.title) sahifa almashganda ham o‘tkaziladi
 * ──────────────────────────────────────────────────────────────────────────── */

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const
// Matn uchun: kod/skript/tahrirlanuvchi maydonlar tegilmaydi
const SKIP_TEXT =
    '[data-no-i18n],script,style,noscript,textarea,code,pre,[contenteditable="true"],[contenteditable=""]'
// Atribut uchun: textarea'ning placeholder'i ham tarjima qilinadi (faqat foydalanuvchi matni emas)
const SKIP_ATTR = '[data-no-i18n],script,style,noscript,code,pre'

interface Rec {
    src: string
    out: string
}

const isTextOrComment = (n: Node | null): n is Text | Comment =>
    !!n && (n.nodeType === Node.TEXT_NODE || n.nodeType === Node.COMMENT_NODE)

/** Bir ota ichidagi ketma-ket matn tugunlari (izohlar e'tiborsiz). */
function textRun(node: Text): Text[] {
    let first: Node = node
    while (isTextOrComment(first.previousSibling)) first = first.previousSibling!
    const run: Text[] = []
    for (let n: Node | null = first; isTextOrComment(n); n = n.nextSibling) {
        if (n.nodeType === Node.TEXT_NODE) run.push(n as Text)
    }
    return run
}

function LanguageDomSync({ lang, dict }: { lang: UiLang; dict: Dict | null }) {
    const textRecs = useRef(new WeakMap<Text, Rec>())
    const attrRecs = useRef(new WeakMap<Element, Map<string, Rec>>())
    const busy = useRef(false)

    useEffect(() => {
        const convert = (src: string): string => {
            if (lang === 'old') return src
            if (lang === 'en' || lang === 'ru') {
                if (!dict) return src
                return convertUz(src, lang, dict)
            }
            // new / cyrl: faqat o‘zbekcha matnlar (ingliz matnlari buzilmasin)
            if (!looksUzbek(src) && !(dict && dict[normKey(src)] !== undefined)) return src
            return convertUz(src, lang, null)
        }

        const textSkipped = (el: Element | null) => !!el && !!el.closest(SKIP_TEXT)
        const attrSkipped = (el: Element | null) => !!el && !!el.closest(SKIP_ATTR)

        const sourceOf = (node: Text): string => {
            const rec = textRecs.current.get(node)
            return rec && node.data === rec.out ? rec.src : node.data
        }

        const processText = (node: Text) => {
            const parent = node.parentElement
            if (!parent || textSkipped(parent)) return

            const run = (lang === 'en' || lang === 'ru') && dict ? textRun(node) : [node]
            const srcs = run.map(sourceOf)
            let outs: string[]

            if (run.length > 1) {
                const joined = srcs.join('')
                const merged = convert(joined)
                // butun jumla topilsa — birinchi tugunga; topilmasa har bir tugun alohida
                outs = merged !== joined ? [merged, ...run.slice(1).map(() => '')] : srcs.map(convert)
            } else {
                outs = [convert(srcs[0])]
            }

            run.forEach((n, i) => {
                const rec = textRecs.current.get(n)
                if (n.data !== outs[i]) n.data = outs[i]
                if (outs[i] === srcs[i] && !rec) return
                textRecs.current.set(n, { src: srcs[i], out: outs[i] })
            })
        }

        const processAttrs = (el: Element) => {
            if (attrSkipped(el)) return
            let map = attrRecs.current.get(el)
            for (const name of ATTRS) {
                const cur = el.getAttribute(name)
                if (cur === null) continue
                const rec = map?.get(name)
                const src = rec && cur === rec.out ? rec.src : cur
                const out = convert(src)
                if (out !== cur) el.setAttribute(name, out)
                if (out === src && !rec) continue
                if (!map) {
                    map = new Map()
                    attrRecs.current.set(el, map)
                }
                map.set(name, { src, out })
            }
        }

        const walk = (root: Node) => {
            if (root.nodeType === Node.TEXT_NODE) {
                processText(root as Text)
                return
            }
            if (root.nodeType !== Node.ELEMENT_NODE) return
            const el = root as Element
            processAttrs(el)
            const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
            let n = tw.nextNode()
            while (n) {
                if (n.nodeType === Node.TEXT_NODE) processText(n as Text)
                else processAttrs(n as Element)
                n = tw.nextNode()
            }
        }

        const run = (fn: () => void) => {
            busy.current = true
            try {
                fn()
            } finally {
                busy.current = false
            }
        }

        run(() => walk(document.body))

        // ── Brauzer tabi sarlavhasi ──
        let titleSrc = document.title
        let titleOut = convert(titleSrc)
        if (titleOut !== titleSrc) document.title = titleOut

        if (lang === 'old') {
            return () => {
                /* 'old' da hech narsa o‘zgartirilmaydi */
            }
        }

        const syncTitle = () => {
            const cur = document.title
            // Next yangi sarlavha qo‘ygan bo‘lsa — u yangi manba
            if (cur !== titleOut) {
                titleSrc = cur
                titleOut = convert(cur)
            }
            if (titleOut !== cur) document.title = titleOut
        }

        const titleObserver = new MutationObserver(syncTitle)
        titleObserver.observe(document.head, { subtree: true, childList: true, characterData: true })

        const observer = new MutationObserver((records) => {
            if (busy.current) return
            run(() => {
                for (const r of records) {
                    if (r.type === 'characterData') walk(r.target)
                    else if (r.type === 'attributes') processAttrs(r.target as Element)
                    else r.addedNodes.forEach((n) => walk(n))
                }
            })
        })
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: [...ATTRS],
        })

        return () => {
            observer.disconnect()
            titleObserver.disconnect()
            if (document.title === titleOut) document.title = titleSrc
        }
    }, [lang, dict])

    return null
}
