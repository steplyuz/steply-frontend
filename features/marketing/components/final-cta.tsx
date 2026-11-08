"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  MapPin,
  QrCode,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Uz } from "@/shared/providers/alphabet-provider";
import { FOCUS } from "@/shared/lib/brand";
import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* FINAL CTA — bento + road map                                                 */
/* -------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

/** Road map bekatlari. viewBox 80×400: x — piksel, y — foiz (y/4) */
const STOPS: { icon: LucideIcon; title: string; body: string; x: number; y: number; final?: boolean }[] = [
  { icon: UserRound, title: "Ro‘yxatdan o‘ting", body: "Telefon raqamingiz bilan hisob yarating.", x: 24, y: 40 },
  { icon: CalendarDays, title: "Sana va markazni tanlang", body: "Sizga mos mock imtihon sessiyasini tanlang.", x: 56, y: 147 },
  { icon: MapPin, title: "Imtihonga keling", body: "Belgilangan kuni topshiriqlarni bajaring.", x: 24, y: 253 },
  { icon: Trophy, title: "Natijangizni oling", body: "Natijani kabinetingizda ko‘ring va QR orqali tekshiring.", x: 56, y: 360, final: true },
];

const PATH = "M 24 40 C 24 93, 56 93, 56 147 C 56 200, 24 200, 24 253 C 24 306, 56 306, 56 360";

function RoadMap({ reduceMotion }: { reduceMotion: boolean }) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.28, delayChildren: 0.1 } },
  };

  const draw: Variants = reduceMotion
    ? { hidden: { pathLength: 1 }, show: { pathLength: 1 } }
    : { hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1.8, ease } } };

  const pop: Variants = reduceMotion
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
      hidden: { opacity: 0, scale: 0.7 },
      show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
    };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      className="relative mt-6 h-[28rem] flex-1 lg:h-auto lg:min-h-[26rem]"
    >
      <svg
        aria-hidden
        viewBox="0 0 80 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute left-0 top-0 h-full w-20"
      >
        <path
          d={PATH}
          fill="none"
          strokeWidth="26"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-secondary"
        />
        <path
          d={PATH}
          fill="none"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-primary/40"
        />
        <motion.path
          d={PATH}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={draw}
          className="stroke-primary"
        />
      </svg>

      <ol>
        {STOPS.map(({ icon: Icon, title, body, x, y, final }, i) => (
          <motion.li
            key={title}
            variants={pop}
            style={{ top: `${y / 4}%` }}
            className="absolute inset-x-0 -translate-y-1/2"
          >
            <span
              style={{ left: x }}
              className={[
                "absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-4 ring-card",
                final
                  ? "bg-primary-strong text-brand-glow shadow-[0_14px_30px_-12px_rgba(15,61,38,0.6)]"
                  : "bg-gradient-to-br from-primary to-primary-strong text-white shadow-[0_14px_30px_-12px_rgba(31,122,77,0.6)]",
              ].join(" ")}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary-strong ring-1 ring-[#0F3D26]/10">
                {i + 1}
              </span>
            </span>

            <div className="ml-[5.5rem] min-w-0">
              <h3 className="font-display text-base font-bold tracking-tight text-primary-strong">
                <Uz>{title}</Uz>
              </h3>
              <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                <Uz>{body}</Uz>
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

/** Katta kartadagi pill ustunlar */
const PILLS: { h: string; tone: string; hatch?: boolean; delay: number }[] = [
  { h: "h-20", tone: "bg-brand-soft", delay: 0 },
  { h: "h-28", tone: "bg-primary", delay: 0.4 },
  { h: "h-14", tone: "bg-secondary", hatch: true, delay: 0.8 },
  { h: "h-24", tone: "bg-brand-bright", delay: 1.2 },
];

function PillColumns({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-6 top-6 hidden items-end gap-2 sm:flex lg:right-10 lg:top-8"
    >
      {PILLS.map(({ h, tone, hatch, delay }, i) => (
        <motion.span
          key={i}
          className={`w-7 rounded-full ${h} ${hatch ? "bg-hatch" : tone}`}
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 3.6 + i * 0.4, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function FinalCta() {
  const variants = useMotionVariants();
  const reduceMotion = useReducedMotion() ?? false;
  const tap = reduceMotion ? undefined : { scale: 0.97 };

  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <motion.div
        variants={variants.stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="container-shell grid gap-3 sm:gap-4 lg:grid-cols-12"
      >
        {/* 1. Asosiy karta */}
        <motion.div
          variants={variants.fadeUp}
          className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-[#0F3D26]/[0.06] sm:p-8 lg:col-span-7 lg:p-10"
        >
          <div
            aria-hidden
            className="bg-hatch pointer-events-none absolute -bottom-28 -left-24 size-72 rounded-full opacity-40"
          />
          <PillColumns reduceMotion={reduceMotion} />

          <div className="relative max-w-lg">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-strong">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              <Uz>Keyingi qadam</Uz>
            </p>

            <h2 className="font-display mt-4 text-balance text-3xl font-bold leading-[1.08] tracking-tight text-primary-strong sm:text-4xl lg:text-5xl">
              <Uz>Keyingi mock imtihoningizga tayyorlanishni boshlang.</Uz>
            </h2>

            <p className="mt-4 max-w-md text-[15px] leading-6 text-muted-foreground sm:text-base sm:leading-7">
              <Uz>O‘zingizga mos imtihonni tanlang va milliy sertifikat formatida bilimingizni sinab ko‘ring.</Uz>
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <motion.div whileTap={tap} className="flex">
                <Link
                  href="/mock"
                  className={`group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-gradient-to-br from-primary to-primary-strong py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-[0_12px_30px_-14px_rgba(31,122,77,0.75)] transition hover:-translate-y-0.5 motion-reduce:transition-none sm:w-auto sm:justify-start ${FOCUS}`}
                >
                  <span>
                    <Uz>Mock imtihon tanlash</Uz>
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-primary-strong transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 2. Road map kartasi (o‘ngda, ikki qator balandligida) */}
        <motion.div
          variants={variants.fadeUp}
          className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-[#0F3D26]/[0.06] sm:p-8 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span aria-hidden className="size-2 rounded-full bg-primary" />
              <Uz>Yo‘l xaritasi</Uz>
            </p>
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-strong">
              <Uz>4 qadam</Uz>
            </span>
          </div>

          <RoadMap reduceMotion={reduceMotion} />
        </motion.div>

        {/* 3. Kichik kartalar */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          <motion.div variants={variants.fadeUp} whileTap={tap}>
            <Link
              href="/result"
              className={`group relative isolate flex h-full min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-3xl bg-[#0b2e1d] bg-brand-texture p-5 text-white ring-1 ring-[#0F3D26]/[0.06] sm:p-6 ${FOCUS}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-brand-glow">
                  <QrCode aria-hidden="true" className="size-5" />
                </span>
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-primary-strong transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </span>
              <span className="mt-6 block">
                <span className="font-display block text-lg font-bold tracking-tight">
                  <Uz>Natijani tekshirish</Uz>
                </span>
                <span className="mt-1 block text-sm leading-5 text-white/70">
                  <Uz>QR kod orqali natija ma’lumotlarini ko‘ring.</Uz>
                </span>
              </span>
            </Link>
          </motion.div>

          <motion.div variants={variants.fadeUp} whileTap={tap}>
            <Link
              href="/dashboard/billing"
              className={`group relative flex h-full min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06] transition-colors hover:bg-secondary motion-reduce:transition-none sm:p-6 ${FOCUS}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary-strong transition-colors group-hover:bg-card">
                  <CreditCard aria-hidden="true" className="size-5" />
                </span>
                <span className="flex size-9 items-center justify-center rounded-full border border-primary-strong text-primary-strong transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </span>
              <span className="mt-6 block">
                <span className="font-display block text-lg font-bold tracking-tight text-primary-strong">
                  <Uz>Tariflar</Uz>
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  <Uz>O‘zingizga mos tarifni tanlang.</Uz>
                </span>
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}