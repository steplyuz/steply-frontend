
/* app/not-found.tsx */

import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Steply"
          width={72}
          height={72}
          priority
          className="mb-8 rounded-2xl"
        />

        <p className="text-sm font-bold uppercase tracking-[0.25em] text-lime-600">
          Page not found
        </p>

        <h1 className="mt-3 text-8xl font-black tracking-tight text-gray-950 sm:text-9xl">
          404
        </h1>

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Sahifa topilmadi
        </h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500 sm:text-base">
          Siz qidirayotgan sahifa mavjud emas, manzili o‘zgargan
          yoki o‘chirib tashlangan bo‘lishi mumkin.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#dfff00] px-6 py-3 font-bold text-black transition hover:bg-[#cbed00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2"
          >
            Bosh sahifaga qaytish
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Bosh sahifaga o‘tish
          </Link>
        </div>

        <p className="mt-12 text-sm text-gray-400">
          Steply — CEFR Practice platformasi
        </p>
      </div>
    </main>
  )
}
