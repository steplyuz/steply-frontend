'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { PREMIUM_UPGRADE_HREF, isSubscriptionRequiredError } from '@/features/practice/lib/access'
import { FOCUS } from '@/shared/lib/brand'

/**
 * Test sahifasini qulflaydi. `locked` backenddan keladi (is_locked).
 * Server baribir 403 qaytaradi; bu komponent faqat UX uchun.
 */
export function PremiumGate({ locked, children }: { locked: boolean; children: ReactNode }) {
    if (!locked) return <>{children}</>

    return (
        <div className="mx-auto max-w-md space-y-5 rounded-3xl bg-white p-8 text-center ring-1 ring-[#0F3D26]/[0.07]">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-foreground/[0.07]">
                <Lock aria-hidden="true" className="size-6" />
            </span>
            <h2 className="text-xl font-semibold text-foreground">Bu test Premium</h2>
            <p className="text-sm text-foreground/60">Testni boshlash uchun obunani faollashtiring.</p>
            <Link
                href={PREMIUM_UPGRADE_HREF}
                className={`inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-white ${FOCUS}`}
            >
                Obunani ochish
            </Link>
        </div>
    )
}

/**
 * Boshlash yoki yuborish so'rovi xatosini tekshiradi.
 * 403 bo'lsa obuna sahifasiga yo'naltiradi va true qaytaradi.
 *
 * Ishlatish:
 *   if (!handleSubscriptionError(e, router.push)) setErr(errMsg(e))
 */
export function handleSubscriptionError(e: unknown, push: (href: string) => void): boolean {
    if (!isSubscriptionRequiredError(e)) return false
    push(PREMIUM_UPGRADE_HREF)
    return true
}