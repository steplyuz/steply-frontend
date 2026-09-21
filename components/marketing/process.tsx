"use client";

import Link from "next/link";
import { useRef, useState, type ComponentType } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* PROCESS                                                                      */
/* -------------------------------------------------------------------------- */

type VisualProps = {
  /** step has been reached by the scroll */
  lit: boolean;
  /** step reached and motion is allowed → run looping animations */
  loop: boolean;
};

/* ---- mini visuals (decorative) ------------------------------------------- */

function RegisterVisual({ loop }: VisualProps) {
  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
          +998
        </span>
        <span className="relative overflow-hidden font-mono text-sm font-semibold tabular-nums">
          <motion.span
            className="block whitespace-nowrap"
            initial={{ clipPath: "inset(0 0% 0 0)" }}
            animate={
              loop
                ? { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)"] }
                : { clipPath: "inset(0 0% 0 0)" }
            }
            transition={{ duration: 3.2, times: [0, 0.5, 1], repeat: Infinity, ease: "linear" }}
          >
            90 000 00 00
          </motion.span>
        </span>
      </div>
      <motion.span
        className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground"
        animate={loop ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 3.2, times: [0, 0.55, 0.7], repeat: Infinity }}
      >
        <ArrowRight className="size-4" />
      </motion.span>
    </div>
  );
}

const DAYS = ["12", "13", "14", "15", "16"];

function DateVisual({ loop }: VisualProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative flex w-fit gap-2">
        <motion.span
          aria-hidden
          className="absolute left-0 top-0 size-10 rounded-xl bg-primary"
          initial={{ x: 96 }}
          animate={loop ? { x: [0, 48, 96, 144, 96, 48, 0] } : { x: 96 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {DAYS.map((day) => (
          <span
            key={day}
            className="relative z-10 flex size-10 items-center justify-center rounded-xl border border-border/70 text-sm font-bold tabular-nums"
          >
            {day}
          </span>
        ))}
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden /> Markaz
      </span>
    </div>
  );
}

function VenueVisual({ loop }: VisualProps) {
  return (
    <div className="flex h-full items-center gap-6">
      <div className="relative flex size-14 shrink-0 items-center justify-center">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-1 rounded-full border-2 border-foreground/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={loop ? { scale: [1, 2.1], opacity: [0.5, 0] } : { scale: 1, opacity: 0 }}
            transition={{ duration: 2, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        <span className="relative flex size-11 items-center justify-center rounded-full bg-foreground text-primary">
          <MapPin className="size-5" aria-hidden />
        </span>
      </div>
      <div className="min-w-0 space-y-1.5">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden /> Belgilangan kun
        </span>
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden /> Imtihon markazi
        </span>
      </div>
    </div>
  );
}

const BARS: [string, number][] = [
  ["L", 68],
  ["R", 71],
  ["W", 64],
  ["S", 69],
];

function ResultVisual({ lit }: VisualProps) {
  return (
    <div className="flex h-full items-center gap-4">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-lg font-extrabold text-primary">
        B2
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        {BARS.map(([label, value], i) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 text-[10px] font-bold text-muted-foreground">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.span
                className="block h-full origin-left rounded-full bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: lit ? value / 100 : 0 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- data ---------------------------------------------------------------- */

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
  Visual: ComponentType<VisualProps>;
};

const STEPS: Step[] = [
  {
    icon: UserRound,
    title: "Ro'yxatdan o'ting",
    body: "Telefon raqamingiz bilan hisob yarating va shaxsiy kabinetingizga kiring.",
    Visual: RegisterVisual,
  },
  {
    icon: CalendarDays,
    title: "Sana va markazni tanlang",
    body: "O'zingizga mos mock imtihon sessiyasini tanlab, ro'yxatdan o'ting.",
    Visual: DateVisual,
  },
  {
    icon: MapPin,
    title: "Imtihonga keling",
    body: "Belgilangan kuni imtihon markaziga boring va topshiriqlarni bajaring.",
    Visual: VenueVisual,
  },
  {
    icon: CheckCircle2,
    title: "Natijangizni oling",
    body: "Baholash yakunlangach, natijangizni shaxsiy kabinetingizdan ko'ring.",
    Visual: ResultVisual,
  },
];

const COUNT = STEPS.length;

/* ---- deck card ----------------------------------------------------------- */

const W = 1 / COUNT;

function DeckCard({
  step,
  index,
  progress,
  current,
  reduce,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
  current: boolean;
  reduce: boolean;
}) {
  const { icon: Icon, title, body, Visual } = step;
  const first = index === 0;
  const last = index === COUNT - 1;

  // scroll-driven opacity / y / scale — only used when motion is allowed
  const inputs = first
    ? [0, (index + 1) * W - 0.28 * W, (index + 1) * W + 0.06 * W]
    : last
      ? [index * W - 0.3 * W, index * W + 0.06 * W, 1]
      : [
          index * W - 0.3 * W,
          index * W + 0.06 * W,
          (index + 1) * W - 0.28 * W,
          (index + 1) * W + 0.06 * W,
        ];

  const opacityOut = first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0];
  const yOut      = first ? [0, 0, -70] : last ? [70, 0, 0] : [70, 0, 0, -70];
  const scaleOut  = first ? [1, 1, 0.94] : last ? [0.94, 1, 1] : [0.94, 1, 1, 0.94];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const opacityMV = useTransform(progress, inputs, opacityOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yMV       = useTransform(progress, inputs, yOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const scaleMV   = useTransform(progress, inputs, scaleOut);

  // FIX: layout is ALWAYS absolute — reduce only disables animation, never changes positioning.
  // When reduce=true, non-current cards are hidden via opacity; current card is fully visible.
  const motionStyle = reduce
    ? { opacity: current ? 1 : 0 }
    : { opacity: opacityMV, y: yMV, scale: scaleMV };

  return (
    <motion.li
      style={motionStyle}
      aria-hidden={!current}
      // FIX: className is always the same — absolute positioning regardless of reduce
      className="absolute inset-0 flex items-center"
      // FIX: non-current cards must not receive pointer events when hidden
      {...(reduce && !current ? { inert: "" } : {})}
    >
      <article className="relative w-full overflow-hidden rounded-3xl border border-primary/30 bg-card p-5 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.4)] sm:p-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-4 select-none text-[6rem] font-extrabold leading-none tracking-tighter text-foreground/[0.05] sm:text-[8rem]"
        >
          0{index + 1}
        </span>

        <div className="relative flex items-center gap-3.5">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_26px_-10px_rgba(228,247,10,0.9)] sm:size-14">
            <Icon className="size-5 sm:size-[22px]" aria-hidden="true" />
            {current && !reduce && (
              <motion.span
                key={`pulse-${index}`}
                aria-hidden
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 rounded-2xl border-2 border-primary"
              />
            )}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            QADAM 0{index + 1} / 0{COUNT}
          </p>
        </div>

        <h3 className="relative mt-4 text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
        <p className="relative mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>

        <div aria-hidden className="relative mt-5 h-[7.5rem] rounded-2xl bg-muted/70 px-4 py-3 sm:px-5">
          {/* FIX: always render Visual as lit; loop only runs when current AND not reduce */}
          <Visual lit={current} loop={current && !reduce} />
        </div>

        {last && (
          <Link
            href="/register"
            tabIndex={current ? 0 : -1}
            className="relative mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground sm:hidden"
          >
            Ro'yxatdan o'tish <ArrowRight className="size-4" />
          </Link>
        )}
      </article>
    </motion.li>
  );
}

/* ---- section ------------------------------------------------------------- */

export function ProcessFlow() {
  const variants = useMotionVariants();
  const reduce = useReducedMotion() ?? false;
  const outerRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(COUNT - 1, Math.max(0, Math.floor(value * COUNT + 0.1))));
  });

  function goToStep(index: number) {
    const el = outerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const distance = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (distance * (index + 0.5)) / COUNT, behavior: "smooth" });
  }

  // FIX: section is always h-[340svh] — reduce mode only affects animations, not scroll height.
  // Removing the reduce branch that used py-14 and static layout (caused all 4 cards to stack).
  return (
    <section
      ref={outerRef}
      aria-label="Mock imtihon qadamlari"
      className="relative bg-muted/35 h-[340svh]"
    >
      {/* FIX: sticky wrapper is always present — no conditional rendering based on reduce */}
      <div className="sticky top-0 flex h-svh items-center overflow-hidden pt-[4.5rem] lg:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 top-0 size-72 rounded-full bg-primary/10 blur-[90px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 size-64 rounded-full bg-primary/[0.07] blur-[90px]"
        />

        <div className="container-shell relative grid w-full items-center gap-5 sm:gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Left: intro + step navigator */}
          <motion.div
            variants={variants.stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="min-w-0"
          >
            <motion.p
              variants={variants.fadeUp}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
            >
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Qanday ishlaydi?
              <span className="ml-1 font-mono tabular-nums text-foreground/70" aria-hidden>
                0{active + 1} / 0{COUNT}
              </span>
            </motion.p>

            <motion.h2
              variants={variants.fadeUp}
              className="mt-3 max-w-lg text-balance text-[1.6rem] font-bold leading-[1.1] tracking-tight sm:mt-4 sm:text-4xl lg:text-[2.65rem]"
            >
              Mock imtihon — 4 oddiy qadamda.
            </motion.h2>

            <motion.p
              variants={variants.fadeUp}
              className="mt-4 hidden max-w-md text-base leading-7 text-muted-foreground sm:block"
            >
              Jarayonni oldindan bilib oling: sessiyani tanlashdan natijani ko'rishgacha.
            </motion.p>

            {/* mobile: compact progress segments */}
            <motion.div variants={variants.fadeUp} className="mt-4 flex gap-1.5 lg:hidden" aria-hidden>
              {STEPS.map((step, i) => (
                <span key={step.title} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className={`block h-full origin-left rounded-full bg-foreground transition-transform duration-500 ${
                      i <= active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </span>
              ))}
            </motion.div>

            {/* desktop: clickable step list */}
            <motion.ol variants={variants.fadeUp} className="mt-8 hidden space-y-1 lg:block">
              {STEPS.map((step, i) => {
                const isActive = i === active;
                const reached = i <= active;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      onClick={() => goToStep(i)}
                      aria-current={isActive ? "step" : undefined}
                      className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isActive && !reduce && (
                        <motion.span
                          layoutId="process-active-row"
                          aria-hidden
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                        />
                      )}
                      {/* FIX: reduce=true → plain span instead of motion highlight */}
                      {isActive && reduce && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                        />
                      )}
                      <span
                        className={`relative flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                          reached
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`relative text-sm transition-colors duration-300 ${
                          isActive
                            ? "font-bold text-foreground"
                            : "font-medium text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </motion.ol>

            <motion.div variants={variants.fadeUp} className="mt-7 hidden sm:block">
              <motion.div whileTap={reduce ? undefined : { scale: 0.97 }} className="inline-flex">
                <Link
                  href="/register"
                  className="group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_12px_30px_-14px_rgba(228,247,10,0.75)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[450%] group-hover:opacity-100"
                  />
                  <span className="relative">Ro'yxatdan o'tish</span>
                  <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: deck — FIX: always relative + fixed height, never space-y-4 stacked layout */}
          <ol className="relative mx-auto h-[24.5rem] w-full min-w-0 max-w-xl sm:h-[27rem] lg:mx-0">
            {STEPS.map((step, index) => (
              <DeckCard
                key={step.title}
                step={step}
                index={index}
                progress={progress}
                current={index === active}
                reduce={reduce}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}