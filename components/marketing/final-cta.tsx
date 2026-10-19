"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, BookOpen, Headphones, Mic2, PenLine, type LucideIcon } from "lucide-react";

import { FOCUS, LIME } from "@/lib/brand";
import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* FINAL CTA — sayt bo‘yicha yagona banner                                      */
/* -------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

/** Mascot atrofida suzuvchi skill chiplari */
const CHIPS: { icon: LucideIcon; position: string; delay: number }[] = [
  { icon: BookOpen, position: "left-0 top-6 sm:left-2 lg:-left-2 lg:top-10", delay: 0 },
  { icon: Headphones, position: "right-0 top-2 sm:right-2 lg:-right-2 lg:top-4", delay: 0.6 },
  { icon: PenLine, position: "bottom-12 left-2 sm:left-4 lg:bottom-16 lg:left-0", delay: 1.2 },
  { icon: Mic2, position: "bottom-6 right-2 sm:right-4 lg:bottom-10 lg:right-0", delay: 1.8 },
];

/** Dekorativ halqa — faqat bezak */
function Circle({ color, width = 20, className = "" }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  );
}

function MascotStage() {
  const reduceMotion = useReducedMotion() ?? false;

  const pop: Variants = reduceMotion
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.6 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
      };

  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto aspect-square w-[15.5rem] sm:w-72 lg:mx-0 lg:w-full lg:max-w-[420px] lg:justify-self-end"
    >
      {/* sekin aylanuvchi halqalar */}
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed border-foreground/25"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-10 rounded-full border border-foreground/10"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />

      {/* mascot */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-center"
        animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/mascot/owl-hello.png"
          alt=""
          width={640}
          height={640}
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 288px, 248px"
          className="h-auto w-[92%] drop-shadow-[0_24px_30px_rgba(0,0,0,0.25)]"
        />
      </motion.div>

      {/* suzuvchi skill chiplari */}
      {CHIPS.map(({ icon: Icon, position, delay }, i) => (
        <motion.span key={i} variants={pop} className={`absolute ${position}`}>
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 3 + i * 0.4, delay, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-11 items-center justify-center rounded-2xl bg-white text-foreground shadow-lg ring-1 ring-black/5 lg:size-14"
          >
            <Icon className="size-5 lg:size-6" />
          </motion.span>
        </motion.span>
      ))}
    </div>
  );
}

export function FinalCta() {
  const variants = useMotionVariants();
  const reduceMotion = useReducedMotion();
  const tap = reduceMotion ? undefined : { scale: 0.97 };

  return (
    <section className="relative isolate overflow-hidden py-14 text-foreground sm:py-20 lg:py-24" style={{ background: LIME }}>
      <Circle color="rgba(0,0,0,0.07)" width={22} className="-left-20 -top-24 size-56 sm:-left-24 sm:-top-28 sm:size-80" />
      <Circle color="rgba(0,0,0,0.05)" width={18} className="-bottom-24 right-1/3 hidden size-64 lg:block" />

      <motion.div
        variants={variants.stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="container-shell relative z-10 grid items-center gap-8 text-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:text-left"
      >
        {/* Mobilda matn tepasida, desktopda o‘ngda */}
        <motion.div variants={variants.fadeUp} className="order-first lg:order-last">
          <MascotStage />
        </motion.div>

        <div className="min-w-0">
          <motion.div variants={variants.fadeUp} className="max-w-2xl px-1 lg:px-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Keyingi qadam
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-[1.02] tracking-tighter sm:text-5xl lg:text-6xl">
              Keyingi mock imtihoningizga tayyorlanishni boshlang.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium leading-6 text-foreground/70 sm:text-base lg:mx-0">
              O‘zingizga mos imtihonni tanlang va CEFR Multilevel formatida bilimingizni sinab ko‘ring.
            </p>
          </motion.div>

          <motion.div
            variants={variants.fadeUp}
            className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
          >
            <motion.div whileTap={tap} className="flex">
              <Link
                href="/mock"
                className={`group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-[15px] font-bold text-white shadow-lg shadow-black/15 transition hover:bg-foreground/90 motion-reduce:transition-none sm:w-auto sm:justify-start ${FOCUS}`}
              >
                Mock imtihon tanlash
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </Link>
            </motion.div>

            <motion.div whileTap={tap} className="flex">
              <Link
                href="/result"
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white/70 px-6 py-2 text-[15px] font-bold text-foreground transition hover:bg-white motion-reduce:transition-none sm:w-auto ${FOCUS}`}
              >
                Natijani tekshirish
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}