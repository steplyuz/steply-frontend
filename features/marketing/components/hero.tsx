"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Uz } from "@/shared/providers/alphabet-provider";

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
/* 1. BACKGROUND — slowly drifting green blobs                                 */
/* -------------------------------------------------------------------------- */

export function HeroBackground() {
  const { reduce } = useHeroMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={reduce ? undefined : { x: [0, -28, 0], y: [0, 22, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 -top-24 size-[360px] rounded-full bg-brand-bright/25 blur-[90px] sm:size-[480px] lg:size-[560px]"
      />
      <motion.div
        animate={reduce ? undefined : { x: [0, 32, 0], y: [0, -20, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-40 bottom-0 size-[280px] rounded-full bg-primary/[0.12] blur-[80px] sm:size-[360px]"
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
      className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-secondary-foreground shadow-sm sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
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
          className="absolute -bottom-0.5 left-0 -z-10 h-2.5 w-full rounded-full bg-brand-soft sm:-bottom-1 sm:h-3.5"
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
      className="mx-auto mt-4 max-w-[720px] text-balance text-[clamp(2rem,7vw,3.65rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground sm:mt-5 lg:mx-0 lg:text-[clamp(3rem,4.2vw,4.2rem)]"
    >
      <RevealWord>
        <Uz>Milliy</Uz>
      </RevealWord>{" "}
      <RevealWord>
        <Uz>sertifikat</Uz>
      </RevealWord>{" "}
      <RevealWord>
        <Uz>imtihoniga</Uz>
      </RevealWord>{" "}
      <RevealWord highlight>
        <Uz>ishonch bilan</Uz>
      </RevealWord>{" "}
      <RevealWord>
        <Uz>tayyorlaning.</Uz>
      </RevealWord>
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
      className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7 lg:mx-0 lg:text-lg lg:leading-8"
    >
      <Uz>
        Milliy sertifikat imtihonlarining barcha yo‘nalishlari bo‘yicha mock imtihonlarda qatnashing.
        Yo‘nalish va sanani tanlang, tayyorgarligingizni sinang va natijangizni tekshiring.
      </Uz>
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
          className="group relative inline-flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-strong px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_12px_30px_-14px_rgba(31,122,77,0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(31,122,77,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-12 sm:px-7"
        >
          {/* shimmer */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[400%] group-hover:opacity-100"
          />
          <span className="relative">
            <Uz>Mock imtihon tanlash</Uz>
          </span>
          <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <motion.div whileTap={tap} className="flex">
        <Link
          href="/result"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-strong/70 bg-transparent px-5 py-2.5 text-sm font-bold text-primary-strong transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-12 sm:px-7"
        >
          <Uz>Natijani tekshirish</Uz>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. TRUST ROW — items pop in one by one                                      */
/* -------------------------------------------------------------------------- */

const TRUST_ITEMS = [
  { icon: CheckCircle2, label: "Barcha yo‘nalishlar" },
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
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-muted-foreground sm:gap-x-5 sm:text-xs lg:justify-start"
      >
        {TRUST_ITEMS.map(({ icon: Icon, label }, index) => (
          <motion.span key={label} variants={item} className="inline-flex items-center gap-4 sm:gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0 text-primary sm:size-4" aria-hidden />{" "}
              <Uz>{label}</Uz>
            </span>
            {index < TRUST_ITEMS.length - 1 && <span aria-hidden className="hidden h-4 w-px bg-border-strong sm:block" />}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. 3D SCENE — qatlamli sertifikat sahnasi (CSS 3D + framer-motion)          */
/*    Kutubxona yo'q. Sichqoncha bilan buriladi; reduced-motion va sensorli    */
/*    ekranda burilish o'chiq. Yo'nalish nomi / ball / sana o'ylab topilmagan.  */
/* -------------------------------------------------------------------------- */

function ScenePill({
  icon: Icon,
  label,
  dark = false,
  z,
  floatY,
  delay,
  className,
}: {
  icon: typeof Award;
  label: string;
  dark?: boolean;
  z: number;
  floatY: number;
  delay: number;
  className: string;
}) {
  const { reduce } = useHeroMotion();

  return (
    <motion.div
      style={{ z }}
      animate={reduce ? undefined : { y: [0, -floatY, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute ${className}`}
    >
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-bold shadow-[0_14px_30px_-12px_rgba(15,61,38,0.45)] sm:text-[13px]",
          dark
            ? "bg-primary-strong text-white"
            : "bg-card text-primary-strong ring-1 ring-[#0F3D26]/[0.06]",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "flex size-6 items-center justify-center rounded-full sm:size-7",
            dark ? "bg-white/10 text-brand-glow" : "bg-secondary text-primary",
          ].join(" ")}
        >
          <Icon className="size-3.5 sm:size-4" />
        </span>
        <Uz>{label}</Uz>
      </div>
    </motion.div>
  );
}

function SceneRow({ label, fill }: { label: string; fill: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
        <Uz>{label}</Uz>
      </p>
      <div aria-hidden className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full bg-gradient-to-r from-brand-bright to-primary ${fill}`} />
      </div>
    </div>
  );
}

export function HeroScene3D() {
  const reduce = useReducedMotion() ?? false;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.6 });

  // Tinch holatda (0) sahna biroz burilgan turadi: rotateY ≈ 6°, rotateX ≈ 4°
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8, 20]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [14, -6]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  const sceneStyle = reduce
    ? { rotateX: 4, rotateY: 6, transformStyle: "preserve-3d" as const }
    : { rotateX, rotateY, transformStyle: "preserve-3d" as const };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ perspective: 1200 }}
      className="relative mx-auto h-[330px] w-full max-w-[460px] sm:h-[390px] lg:ml-auto lg:mr-0 lg:h-[440px]"
    >
      <motion.div style={sceneStyle} className="relative size-full">
        {/* Orqa qatlam: teksturali to'q yashil karta */}
        <motion.div
          aria-hidden
          style={{ z: 0 }}
          className="absolute inset-x-5 bottom-0 top-12 rounded-3xl bg-brand-texture ring-1 ring-[#0F3D26]/[0.06] sm:inset-x-6"
        >
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-hatch opacity-60" />
        </motion.div>

        {/* o'rta qatlam: sertifikat kartasi */}
        <motion.div
          style={{ z: 50 }}
          className="absolute inset-x-0 bottom-10 top-0 flex flex-col justify-between rounded-3xl bg-white p-4 shadow-[0_30px_60px_-28px_rgba(15,61,38,0.5)] ring-1 ring-[#0F3D26]/[0.06] sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-3.5 rounded-full bg-gradient-to-br from-brand-glow via-primary to-primary-strong"
              />
              <span className="text-base font-bold tracking-tight text-foreground">Steply</span>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-foreground sm:text-[11px]">
              <Uz>Milliy sertifikat</Uz>
            </span>
          </div>

          <div>
            <p className="font-display text-xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-2xl">
              <Uz>Imtihon natijasi</Uz>
            </p>
            <div className="mt-4 space-y-3.5">
              <SceneRow label="Yo‘nalish" fill="w-3/5" />
              <SceneRow label="Sana" fill="w-2/5" />
              <SceneRow label="Ball" fill="w-4/5" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            <Uz>Natija tekshiriladi</Uz>
          </div>
        </motion.div>

        {/* Old qatlam: suzuvchi chiplar */}
        <ScenePill
          icon={ClipboardCheck}
          label="Mock imtihon"
          z={110}
          floatY={9}
          delay={0}
          className="-left-2 top-6 sm:-left-5 sm:top-8"
        />
        <ScenePill
          icon={Sparkles}
          label="AI baholash"
          dark
          z={130}
          floatY={11}
          delay={0.6}
          className="-right-1 top-1/2 sm:-right-4"
        />
        <ScenePill
          icon={Award}
          label="Milliy sertifikat"
          z={100}
          floatY={8}
          delay={1.1}
          className="bottom-2 left-4 sm:left-8"
        />
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. HERO — assembles all parts.                                              */
/*    Children berilmasa, yangi 3D sahna chiqadi:                              */
/*    <Hero />                                                                 */
/*    Eski karta kerak bo'lsa: <Hero><TiltResultCard /></Hero>                 */
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
          <HeroBadge>
            <Uz>Milliy sertifikat mock platformasi</Uz>
          </HeroBadge>
          <HeroTitle />
          <HeroDescription />
          <HeroActions />
          <HeroTrust />
        </motion.div>

        <div className="w-full px-1 sm:px-0 lg:justify-self-end">{children ?? <HeroScene3D />}</div>
      </div>
    </section>
  );
}