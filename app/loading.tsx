
import Image from 'next/image'

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Steply yuklanmoqda"
      className="fixed inset-0 z-[99999] flex h-dvh w-screen items-center justify-center overflow-hidden bg-white"
    >
      <img
        src="/loading_steply.gif"
        alt="Steply"
        className="block h-full w-full object-contain"
        style={{ width: '100%', height: '100%' }}
      />
      <span className="sr-only">Yuklanmoqda...</span>
    </div>
  )
}