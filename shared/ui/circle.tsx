/**
 * Dekorativ halqa — faqat bezak. Matn ostida qoladi, bosilmaydi va ekran o‘quvchilardan yashirilgan.
 * Joylashuvi va o‘lchami `className` orqali beriladi (masalan, `-right-16 -top-16 size-48`).
 */
export function Circle({ color, width = 20, className = '' }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  )
}
