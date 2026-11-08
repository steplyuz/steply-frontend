'use client'

import { useAlphabet } from '@/shared/providers/alphabet-provider'
import type { UiLang } from '@/shared/lib/uz-alphabet'

/* Til/alifbo almashtirgich: o‘z · öz · Ўз · EN · RU.
   Bitta komponent — public header, kabinet (topbar + mobil menyu), kirish sahifalari va sozlamalarda
   bir xil ishlaydi. Belgilar data-no-i18n ichida: aks holda "o‘z" tugmasi o‘zi "öz" ga aylanib qoladi. */

export const LANG_OPTIONS: { value: UiLang; label: string; name: string }[] = [
    { value: 'old', label: 'o‘z', name: 'O‘zbekcha (amaldagi lotin)' },
    { value: 'new', label: 'öz', name: 'Özbekçe (yangi alifbo)' },
    { value: 'cyrl', label: 'Ўз', name: 'Ўзбекча (кирилл)' },
    { value: 'en', label: 'EN', name: 'English' },
    { value: 'ru', label: 'RU', name: 'Русский' },
]

const FOCUS_RING =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function LanguageSwitch({ className = '' }: { className?: string }) {
    const { lang, setLang } = useAlphabet()

    return (
        <div
            role="group"
            aria-label="Til"
            data-no-i18n
            className={[
                'items-center gap-0.5 rounded-full',
                'border border-primary-strong/15 bg-card/65 p-0.5',
                'shadow-sm backdrop-blur-md',
                className,
            ].join(' ')}
        >
            {LANG_OPTIONS.map((opt) => {
                const active = lang === opt.value
                return (
                    <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        aria-label={opt.name}
                        title={opt.name}
                        onClick={() => setLang(opt.value)}
                        className={[
                            'flex min-h-8 min-w-9 flex-1 items-center justify-center rounded-full px-2.5',
                            'text-xs font-bold transition-all duration-200',
                            FOCUS_RING,
                            active
                                ? 'bg-secondary text-secondary-foreground ring-1 ring-primary/15'
                                : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
