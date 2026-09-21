"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* SHARED MOTION                                                               */
/* -------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

function useHeroMotion() {
  const reduce = useReducedMotion() ?? false;

  return useMemo(() => {
    const fadeUp: Variants = reduce
      ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
      : {
          hidden: { opacity: 0, y: 22 },
          show: { opacity: 1, y: 0, transition: { duration: 0.62, ease } },
        };

    const stagger = (gap = 0.085, delay = 0): Variants => ({
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : gap, delayChildren: reduce ? 0 : delay } },
    });

    return { reduce, fadeUp, stagger };
  }, [reduce]);
}

/* -------------------------------------------------------------------------- */
/* 1. BACKGROUND — slowly drifting lime blobs                                  */
/* -------------------------------------------------------------------------- */

export function HeroBackground() {
  const { reduce } = useHeroMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={reduce ? undefined : { x: [0, -28, 0], y: [0, 22, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 -top-24 size-[360px] rounded-full bg-primary/15 blur-[90px] sm:size-[480px] lg:size-[560px]"
      />
      <motion.div
        animate={reduce ? undefined : { x: [0, 32, 0], y: [0, -20, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-40 bottom-0 size-[280px] rounded-full bg-primary/[0.08] blur-[80px] sm:size-[360px]"
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. BADGE — pulsing dot                                                      */
/* -------------------------------------------------------------------------- */

export function HeroBadge({ children }: { children: ReactNode }) {
  const { reduce, fadeUp } = useHeroMotion();

  return (
    <motion.p
      variants={fadeUp}
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground shadow-sm sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
    >
      <span className="relative flex size-2 shrink-0">
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary"
            animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className="relative size-2 rounded-full bg-primary" />
      </span>
      {children}
    </motion.p>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. TITLE — word-by-word reveal + drawn underline                            */
/* -------------------------------------------------------------------------- */

function RevealWord({ children, highlight = false }: { children: ReactNode; highlight?: boolean }) {
  const { reduce } = useHeroMotion();

  const word: Variants = reduce
    ? { hidden: { y: 0 }, show: { y: 0, transition: { duration: 0 } } }
    : { hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.7, ease } } };

  return (
    <span className={`relative inline-block ${highlight ? "" : "overflow-hidden align-bottom"} pb-[0.08em]`}>
      <span className={`inline-block ${highlight ? "overflow-hidden align-bottom" : ""}`}>
        <motion.span variants={word} className="inline-block">
          {children}
        </motion.span>
      </span>

      {highlight && (
        <motion.span
          aria-hidden
          variants={
            reduce
              ? { hidden: { scaleX: 1 }, show: { scaleX: 1 } }
              : { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, delay: 0.35, ease } } }
          }
          style={{ transformOrigin: "left" }}
          className="absolute -bottom-0.5 left-0 -z-10 h-2.5 w-full rounded-full bg-primary/55 sm:-bottom-1 sm:h-3.5"
        />
      )}
    </span>
  );
}

export function HeroTitle() {
  const { stagger } = useHeroMotion();

  return (
    <motion.h1
      variants={stagger(0.09)}
      className="mx-auto mt-4 max-w-[720px] text-balance text-[clamp(2rem,7vw,3.65rem)] font-extrabold leading-[1.06] tracking-[-0.05em] sm:mt-5 lg:mx-0 lg:text-[clamp(3rem,4.2vw,4.2rem)]"
    >
      <RevealWord>CEFR</RevealWord> <RevealWord>imtihoniga</RevealWord>{" "}
      <RevealWord highlight>ishonch bilan</RevealWord> <RevealWord>tayyorlaning.</RevealWord>
    </motion.h1>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. DESCRIPTION                                                              */
/* -------------------------------------------------------------------------- */

export function HeroDescription() {
  const { fadeUp } = useHeroMotion();

  return (
    <motion.p
      variants={fadeUp}
      className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7 lg:mx-0 lg:text-lg lg:leading-8"
    >
      Reading, Listening, Writing va Speaking bo‘yicha mock imtihonlarda qatnashing. Sanani tanlang,
      tayyorgarligingizni sinang va natijangizni tekshiring.
    </motion.p>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. ACTIONS — shimmer on primary, press feedback                             */
/* -------------------------------------------------------------------------- */

export function HeroActions() {
  const { reduce, fadeUp } = useHeroMotion();
  const tap = reduce ? undefined : { scale: 0.97 };

  return (
    <motion.div
      variants={fadeUp}
      className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:mt-7 sm:flex-row sm:items-center lg:justify-start"
    >
      <motion.div whileTap={tap} className="flex">
        <Link
          href="/mock"
          className="group relative inline-flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_12px_30px_-14px_rgba(228,247,10,0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(228,247,10,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-12 sm:px-6"
        >
          {/* shimmer */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[400%] group-hover:opacity-100"
          />
          <span className="relative">Mock imtihon tanlash</span>
          <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <motion.div whileTap={tap} className="flex">
        <Link
          href="/result"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-12 sm:px-6"
        >
          Natijani tekshirish
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. TRUST ROW — items pop in one by one                                      */
/* -------------------------------------------------------------------------- */

const TRUST_ITEMS = [
  { icon: CheckCircle2, label: "4 ta ko‘nikma" },
  { icon: CalendarDays, label: "Sana tanlash" },
  { icon: ShieldCheck, label: "Natijani tekshirish" },
] as const;

export function HeroTrust() {
  const { reduce, fadeUp, stagger } = useHeroMotion();

  const item: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8, scale: 0.94 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
      };

  return (
    <motion.div
      variants={fadeUp}
      className="mt-5 sm:mt-6"
    >
      <motion.div
        variants={stagger(0.12, 0.2)}
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted-foreground sm:gap-x-5 sm:text-xs lg:justify-start"
      >
        {TRUST_ITEMS.map(({ icon: Icon, label }, index) => (
          <motion.span key={label} variants={item} className="inline-flex items-center gap-4 sm:gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0 sm:size-4" aria-hidden /> {label}
            </span>
            {index < TRUST_ITEMS.length - 1 && <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. HERO — assembles all parts. Pass the result card as children.            */
/*    <Hero><TiltResultCard /></Hero>                                          */
/* -------------------------------------------------------------------------- */

export function Hero({ children }: { children?: ReactNode }) {
  const { stagger } = useHeroMotion();

  return (
    <section className="relative isolate flex items-center overflow-hidden py-6 sm:py-10 lg:min-h-[calc(100svh-5rem)] lg:py-12">
      <HeroBackground />

      <div className="container-shell grid w-full items-center gap-6 sm:gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        <motion.div
          variants={stagger(0.085)}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <HeroBadge>CEFR Multilevel mock platformasi</HeroBadge>
          <HeroTitle />
          <HeroDescription />
          <HeroActions />
          <HeroTrust />
        </motion.div>

        <div className="w-full px-1 sm:px-0 lg:justify-self-end">{children}</div>
      </div>
    </section>
  );
}