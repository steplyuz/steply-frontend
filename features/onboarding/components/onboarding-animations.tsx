'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Onboarding animatsiyalari — faqat CSS, qo‘shimcha paket kerak emas.
 * Hammasi `prefers-reduced-motion: no-preference` ichida, shuning uchun
 * harakatni kamaytirishni so‘ragan foydalanuvchilarda animatsiya umuman ishlamaydi.
 *
 * Eslatma: fill-mode `backwards` ishlatilgan — animatsiya tugagach Tailwind'ning
 * hover/active transformlari (ko‘tarilish, siqilish) yana ishlaydi.
 *
 * Ranglar: faqat yashil (--primary #1f7a4d). Lime (200,255,0) butunlay olib tashlangan.
 */
const EASE = 'cubic-bezier(.22,1,.36,1)'
const SPRING = 'cubic-bezier(.34,1.56,.64,1)'

const staggerDelays = Array.from(
  { length: 12 },
  (_, i) => `.ob-stagger>*:nth-child(${i + 1}){animation-delay:${(0.05 + i * 0.05).toFixed(2)}s}`,
).join('')

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes ob-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
  @keyframes ob-in-fwd { from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: none } }
  @keyframes ob-in-back { from { opacity: 0; transform: translateX(-32px) } to { opacity: 1; transform: none } }
  @keyframes ob-title { from { opacity: 0; transform: translateY(18px); filter: blur(6px) } to { opacity: 1; transform: none; filter: blur(0) } }
  @keyframes ob-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes ob-pop { 0% { transform: scale(0) rotate(-30deg); opacity: 0 } 60% { transform: scale(1.25) rotate(6deg); opacity: 1 } 100% { transform: scale(1) rotate(0) } }
  @keyframes ob-ripple { from { box-shadow: 0 0 0 0 rgba(31,122,77,.35) } to { box-shadow: 0 0 0 12px rgba(31,122,77,0) } }
  @keyframes ob-glow { from { box-shadow: 0 0 0 0 rgba(93,187,138,.55) } to { box-shadow: 0 0 0 16px rgba(93,187,138,0) } }
  @keyframes ob-shake { 10%,90% { transform: translateX(-1px) } 20%,80% { transform: translateX(3px) } 30%,50%,70% { transform: translateX(-5px) } 40%,60% { transform: translateX(5px) } }
  @keyframes ob-float { 0%,100% { transform: translate3d(0,0,0) scale(1) } 50% { transform: translate3d(-14px,12px,0) scale(1.06) } }
  @keyframes ob-drift { 0%,100% { transform: translate3d(0,0,0) rotate(0) } 50% { transform: translate3d(28px,-20px,0) rotate(8deg) } }
  @keyframes ob-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  @keyframes ob-sweep { to { transform: translateX(100%) } }
  @keyframes ob-wiggle { 0%,100% { transform: rotate(0) scale(1) } 25% { transform: rotate(-14deg) scale(1.2) } 75% { transform: rotate(14deg) scale(1.2) } }

  .ob-rise { animation: ob-rise .55s ${EASE} backwards }
  .ob-in-fwd { animation: ob-in-fwd .5s ${EASE} backwards }
  .ob-in-back { animation: ob-in-back .5s ${EASE} backwards }
  .ob-title { animation: ob-title .65s ${EASE} backwards }
  .ob-fade { animation: ob-fade .4s ease backwards }
  .ob-pop { animation: ob-pop .45s ${SPRING} backwards }
  .ob-ripple { animation: ob-ripple .6s ease-out 1 }
  .ob-glow { animation: ob-glow 1.1s ease-out 1 }
  .ob-shake { animation: ob-shake .5s cubic-bezier(.36,.07,.19,.97) backwards }
  .ob-float { animation: ob-float 9s ease-in-out infinite }
  .ob-drift { animation: ob-drift 14s ease-in-out infinite }
  .ob-grow { transform-origin: left center; animation: ob-grow .9s ${EASE} backwards }
  .ob-wiggle { animation: ob-wiggle 1.2s ease-in-out .6s 2 }
  .ob-shimmer { position: relative; overflow: hidden }
  .ob-shimmer::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%); animation: ob-sweep 1.4s ease-in-out infinite }

  .ob-stagger > * { animation: ob-rise .5s ${EASE} backwards }
  ${staggerDelays}
}
`

/** Bir marta render qilinadi (wizard va sahifa ichida) — global CSS beradi */
export function OnboardingStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

/** Raqamni silliq sanab o‘tadi. `fromZero` — birinchi renderda 0 dan boshlaydi. */
export function useCountUp(target: number, { duration = 800, fromZero = false }: { duration?: number; fromZero?: boolean } = {}) {
  const [value, setValue] = useState(fromZero ? 0 : target)
  const from = useRef(fromZero ? 0 : target)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || from.current === target) {
      from.current = target
      setValue(target)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const cur = Math.round(a + (target - a) * eased)
      from.current = cur
      setValue(cur)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const v = useCountUp(value, { duration, fromZero: true })
  return <span className="tabular-nums">{v}</span>
}