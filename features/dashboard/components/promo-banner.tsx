'use client'

import { useState, type ComponentType } from 'react'
import { ArrowUpRight, Camera, Globe, Music2, Play, Send, Users } from 'lucide-react'

/* ───────────── Reklama bloki ─────────────
   Hero'ning o'ng yarmida turadi. Reklama dizayni RASM ICHIDA tayyor bo'ladi
   (logotip, matn, tugma): komponent faqat rasmni ko'rsatadi va uni havolaga aylantiradi.

   RASM TALABI:
   • Nisbat 2:1, 1600×800 px (ekranda ~800×400), PNG yoki WebP, ~300 KB gacha
   • Fon shaffof bo'lsa rasm hero'ning yashil gradienti ustida uzluksiz ko'rinadi (tavsiya etiladi)
   • Fonli rasm bo'lsa fit: 'cover' bering, u blokni to'liq to'ldiradi
   • Rasm yuklanmasa yoki berilmasa — platforma rangida matnli zaxira karta chiqadi */

export const PROMO_IMAGE_SIZE = { upload: { width: 1600, height: 800 }, display: { width: 800, height: 400 } } as const

export type PromoPlatform = 'telegram' | 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'website'

export interface PromoData {
    platform: PromoPlatform
    /** 1600×800 px rasm manzili (2:1). Bo'sh yoki yuklanmasa — platforma rangidagi zaxira fon ko'rsatiladi */
    image?: string
    imageAlt?: string
    /** Havola matni (2 qatorgacha ko'rinadi) */
    text: string
    /** Tashqi havola */
    href: string
    /** Tugma yozuvi (berilmasa — platformaning standart yozuvi) */
    cta?: string
    /** contain — rasm to'liq ko'rinadi (shaffof fon uchun); cover — blokni to'ldiradi (fonli rasm uchun) */
    fit?: 'contain' | 'cover'
}

interface PlatformStyle {
    label: string
    Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
    background: string
    text: string
    buttonBg: string
    buttonText: string
    cta: string
}

export const PLATFORMS: Record<PromoPlatform, PlatformStyle> = {
    telegram: {
        label: 'Telegram',
        Icon: Send,
        background: 'linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)',
        text: '#FFFFFF',
        buttonBg: '#FFFFFF',
        buttonText: '#1C8ABF',
        cta: 'Telegramda ochish',
    },
    instagram: {
        label: 'Instagram',
        Icon: Camera,
        background: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)',
        text: '#FFFFFF',
        buttonBg: '#FFFFFF',
        buttonText: '#C13584',
        cta: 'Instagramda ochish',
    },
    youtube: {
        label: 'YouTube',
        Icon: Play,
        background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
        text: '#FFFFFF',
        buttonBg: '#FFFFFF',
        buttonText: '#CC0000',
        cta: 'YouTube’da ko‘rish',
    },
    facebook: {
        label: 'Facebook',
        Icon: Users,
        background: 'linear-gradient(135deg, #1877F2 0%, #0F5FCC 100%)',
        text: '#FFFFFF',
        buttonBg: '#FFFFFF',
        buttonText: '#1877F2',
        cta: 'Facebook’da ochish',
    },
    tiktok: {
        label: 'TikTok',
        Icon: Music2,
        background: 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)',
        text: '#FFFFFF',
        buttonBg: '#FE2C55',
        buttonText: '#FFFFFF',
        cta: 'TikTok’da ochish',
    },
    website: {
        label: 'Sayt',
        Icon: Globe,
        background: 'linear-gradient(135deg, #1F7A4D 0%, #0F3D26 100%)',
        text: '#FFFFFF',
        buttonBg: '#FFFFFF',
        buttonText: '#0F3D26',
        cta: 'Batafsil',
    },
}

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D26]'

export function PromoBanner({ platform, image, imageAlt, text, href, cta, fit = 'contain' }: PromoData) {
    const s = PLATFORMS[platform]
    const [failed, setFailed] = useState(false)
    const Icon = s.Icon
    const linkProps = {
        href,
        target: '_blank',
        rel: 'noopener noreferrer sponsored',
        'aria-label': `Reklama, ${s.label}: ${text}`,
    }

    // Asosiy holat: tayyor dizayndagi rasm, boshqa hech narsa qo'shilmaydi
    if (image && !failed) {
        return (
            <a
                {...linkProps}
                className={`group relative block aspect-[2/1] w-full overflow-hidden rounded-2xl transition-transform active:scale-[0.99] motion-reduce:transition-none lg:aspect-auto lg:min-h-72 ${focusRing}`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt={imageAlt ?? text}
                    width={PROMO_IMAGE_SIZE.display.width}
                    height={PROMO_IMAGE_SIZE.display.height}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                    className={`absolute inset-0 size-full object-center transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
                />
            </a>
        )
    }

    // Zaxira: rasm yo'q yoki yuklanmadi
    return (
        <a
            {...linkProps}
            className={`group flex min-h-64 w-full flex-col justify-between rounded-2xl p-5 transition-transform active:scale-[0.99] motion-reduce:transition-none sm:rounded-3xl sm:p-6 lg:min-h-72 ${focusRing}`}
            style={{ background: s.background, color: s.text }}
        >
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20">
                <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-4">
                <p className="line-clamp-3 max-w-md text-xl font-semibold leading-snug lg:text-2xl">{text}</p>
                <span
                    className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full py-1.5 pl-6 pr-1.5 text-[15px] font-semibold sm:w-fit sm:justify-start"
                    style={{ background: s.buttonBg, color: s.buttonText }}
                >
                    <span className="truncate">{cta ?? s.cta}</span>
                    <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none"
                        style={{ background: s.buttonText, color: s.buttonBg }}
                    >
                        <ArrowUpRight className="size-4" />
                    </span>
                </span>
            </div>
        </a>
    )
}