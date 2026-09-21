"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, BookOpen, Headphones, Mic2, PenLine, type LucideIcon } from "lucide-react";

import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* FINAL CTA                                                                    */
/* -------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

/** Skill chips that float around the mascot */
const CHIPS: { icon: LucideIcon; position: string; delay: number }[] = [
  { icon: BookOpen, position: "left-0 top-6 sm:left-2 lg:-left-2 lg:top-10", delay: 0 },
  { icon: Headphones, position: "right-0 top-2 sm:right-2 lg:-right-2 lg:top-4", delay: 0.6 },
  { icon: PenLine, position: "bottom-12 left-2 sm:left-4 lg:bottom-16 lg:left-0", delay: 1.2 },
  { icon: Mic2, position: "bottom-6 right-2 sm:right-4 lg:bottom-10 lg:right-0", delay: 1.8 },
];

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
      {/* glow */}
      <div className="absolute inset-6 -z-10 rounded-full bg-primary/25 blur-3xl" />

      {/* slowly rotating dashed rings */}
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed border-background/15"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-10 rounded-full border border-background/10"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />

      {/* mascot (bigger, bobbing) */}
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
          className="h-auto w-[92%] drop-shadow-[0_24px_30px_rgba(0,0,0,0.4)]"
        />
      </motion.div>

      {/* floating skill chips */}
      {CHIPS.map(({ icon: Icon, position, delay }, i) => (
        <motion.span
          key={i}
          variants={pop}
          className={`absolute ${position}`}
        >
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 3 + i * 0.4, delay, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-11 items-center justify-center rounded-2xl border border-background/15 bg-background/10 text-primary shadow-lg backdrop-blur-md lg:size-14"
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
    <section className="relative isolate overflow-hidden bg-foreground py-14 text-background sm:py-20 lg:py-28">
      {/* background: glows + subtle dot grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[80px] sm:size-[420px] sm:blur-[100px]" />
        <div className="absolute bottom-0 right-0 size-48 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-[60px] sm:size-64 sm:blur-[80px] lg:size-[420px]" />
        <div
          className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <motion.div
        variants={variants.stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="container-shell relative grid items-center gap-8 text-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:text-left"
      >
        {/* Mascot: above the text on mobile, to the right on desktop */}
        <motion.div variants={variants.fadeUp} className="order-first lg:order-last">
          <MascotStage />
        </motion.div>

        <div className="min-w-0">
          <motion.div variants={variants.fadeUp} className="max-w-2xl px-1 lg:px-0">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-background/60 sm:tracking-[0.2em]">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Keyingi qadam
            </p>
            <h2 className="mt-3 text-balance text-[1.75rem] font-bold leading-[1.1] tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              Keyingi mock imtihoningizga tayyorlanishni boshlang.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-background/70 sm:text-base sm:leading-7 lg:mx-0">
              O‘zingizga mos imtihonni tanlang va CEFR Multilevel formatida bilimingizni sinab ko‘ring.
            </p>
          </motion.div>

          <motion.div
            variants={variants.fadeUp}
            className="mt-6 flex flex-col items-stretch gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
          >
            <motion.div whileTap={tap} className="flex">
              <Link
                href="/mock"
                className="group relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_14px_34px_-14px_rgba(228,247,10,0.6)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground sm:w-auto"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[450%] group-hover:opacity-100"
                />
                <span className="relative">Mock imtihon tanlash</span>
                <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.div whileTap={tap} className="flex">
              <Link
                href="/result"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-background/20 bg-background/5 px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground sm:w-auto"
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