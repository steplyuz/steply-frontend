"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";


import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* DATA                                                                         */
/* -------------------------------------------------------------------------- */

type Skill = {
  icon: string;         // path to PNG icon in /public/icons/
  title: string;
  eyebrow: string;
  body: string;
  accent: string;       // icon bg
  bgVisual: string;     // card gradient
  glow: string;         // card box-shadow
  blob: string;         // decorative blur blob color
  mascot: string;
  number: string;
};

const SKILLS: Skill[] = [
  {
    icon: "/icons/reading.png",
    title: "Reading",
    eyebrow: "O'qib tushunish",
    body: "Matnlarni tahlil qiling va savollarga CEFR Multilevel formatida javob bering. Har bir bo'lim real imtihon uslubida tuzilgan.",
    accent: "bg-blue-500/20",
    bgVisual: "bg-gradient-to-br from-blue-100 via-sky-50 to-blue-200 dark:from-blue-950 dark:via-blue-900/80 dark:to-sky-900",
    glow: "shadow-[0_20px_60px_-12px_rgba(59,130,246,0.5)] dark:shadow-[0_20px_60px_-12px_rgba(59,130,246,0.25)]",
    blob: "bg-blue-300/50 dark:bg-blue-600/30",
    mascot: "/mascot/reading.png",
    number: "01",
  },
  {
    icon: "/icons/listening.png",
    title: "Listening",
    eyebrow: "Tinglab tushunish",
    body: "Audio topshiriqlarni tinglang, asosiy ma'lumotlarni ajrating va javoblaringizni tekshiring. Real imtihon shovqin darajasida.",
    accent: "bg-purple-500/20",
    bgVisual: "bg-gradient-to-br from-purple-100 via-violet-50 to-fuchsia-200 dark:from-purple-950 dark:via-violet-900/80 dark:to-fuchsia-900",
    glow: "shadow-[0_20px_60px_-12px_rgba(168,85,247,0.5)] dark:shadow-[0_20px_60px_-12px_rgba(168,85,247,0.25)]",
    blob: "bg-purple-300/50 dark:bg-purple-600/30",
    mascot: "/mascot/listening.png",
    number: "02",
  },
  {
    icon: "/icons/writing.png",
    title: "Writing",
    eyebrow: "Yozma nutq",
    body: "Yozma topshiriqlarni bajaring va javoblaringizni baholash uchun yuboring. AI yordamida tezkor feedback oling.",
    accent: "bg-orange-500/20",
    bgVisual: "bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-200 dark:from-orange-950 dark:via-amber-900/80 dark:to-yellow-900",
    glow: "shadow-[0_20px_60px_-12px_rgba(249,115,22,0.5)] dark:shadow-[0_20px_60px_-12px_rgba(249,115,22,0.25)]",
    blob: "bg-orange-300/50 dark:bg-orange-600/30",
    mascot: "/mascot/writing.png",
    number: "03",
  },
  {
    icon: "/icons/speaking.png",
    title: "Speaking",
    eyebrow: "Og'zaki nutq",
    body: "Savollarga ovozli javob bering va speaking ko'nikmangizni mashq qiling. Talaffuz va ravonlik bo'yicha baho oling.",
    accent: "bg-red-500/20",
    bgVisual: "bg-gradient-to-br from-red-100 via-rose-50 to-pink-200 dark:from-red-950 dark:via-rose-900/80 dark:to-pink-900",
    glow: "shadow-[0_20px_60px_-12px_rgba(239,68,68,0.5)] dark:shadow-[0_20px_60px_-12px_rgba(239,68,68,0.25)]",
    blob: "bg-red-300/50 dark:bg-red-600/30",
    mascot: "/mascot/speaking.png",
    number: "04",
  },
];

const COUNT = SKILLS.length;
const W = 1 / COUNT;

/* -------------------------------------------------------------------------- */
/* SKILL CARD                                                                   */
/* -------------------------------------------------------------------------- */

function SkillCard({
  skill,
  index,
  progress,
  current,
  reduce,
}: {
  skill: Skill;
  index: number;
  progress: MotionValue<number>;
  current: boolean;
  reduce: boolean;
}) {
  const { icon, title, eyebrow, body, accent, bgVisual, glow, blob, mascot, number } = skill;

  const first = index === 0;
  const last  = index === COUNT - 1;

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
  const yOut       = first ? [0, 0, -60] : last ? [60, 0, 0] : [60, 0, 0, -60];
  const scaleOut   = first ? [1, 1, 0.95] : last ? [0.95, 1, 1] : [0.95, 1, 1, 0.95];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const opacityMV = useTransform(progress, inputs, opacityOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yMV       = useTransform(progress, inputs, yOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const scaleMV   = useTransform(progress, inputs, scaleOut);

  const motionStyle = reduce
    ? { opacity: current ? 1 : 0 }
    : { opacity: opacityMV, y: yMV, scale: scaleMV };

  return (
    <motion.li
      style={motionStyle}
      aria-hidden={!current}
      className="absolute inset-0 flex items-center"
      {...(reduce && !current ? { inert: true } : {})}
    >
      <div className="grid w-full grid-cols-[1fr_1fr] items-center gap-5 sm:gap-8 lg:gap-14">

        {/* LEFT: mascot card — rich gradient + glow */}
        <div
          aria-hidden
          className={`
            relative flex h-56 items-end justify-center
            overflow-hidden rounded-3xl border border-white/60
            dark:border-white/10 sm:h-64 lg:h-72
            ${bgVisual} ${glow}
          `}
        >
          {/* top-right decorative blur blob */}
          <span
            className={`pointer-events-none absolute -right-6 -top-6 size-32 rounded-full blur-2xl ${blob}`}
          />
          {/* bottom-left blob */}
          <span
            className={`pointer-events-none absolute -bottom-4 -left-4 size-24 rounded-full blur-2xl ${blob}`}
          />

          {/* faint number watermark */}
          <span className="pointer-events-none absolute -bottom-2 left-3 select-none text-[7rem] font-extrabold leading-none tracking-tighter text-current opacity-[0.08] sm:text-[9rem]">
            {number}
          </span>

          {/* mascot — slides up on active */}
          <motion.div
            className="relative h-[88%] w-full"
            initial={{ y: 36, opacity: 0 }}
            animate={
              current
                ? { y: 0, opacity: 1 }
                : reduce
                  ? { y: 0, opacity: 1 }
                  : { y: 36, opacity: 0 }
            }
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={mascot}
              alt={title}
              fill
              className="object-contain object-bottom drop-shadow-2xl"
              priority={index === 0}
            />
          </motion.div>
        </div>

        {/* RIGHT: text */}
        <div className="flex flex-col justify-center">
          {/* icon + eyebrow */}
          <div className="flex items-center gap-2.5">
            <span
              className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10 ${accent}`}
            >
              <Image
                src={icon}
                alt=""
                width={20}
                height={20}
                className="size-5 object-contain sm:size-[22px]"
                aria-hidden="true"
              />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          </div>

          {/* counter */}
          <p className="mt-4 font-mono text-xs font-semibold tracking-wider text-muted-foreground/60">
            {number} / 0{COUNT}
          </p>

          {/* title */}
          <h3 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem]">
            {title}
          </h3>

          {/* body */}
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">
            {body}
          </p>

          {/* progress dots */}
          <div className="mt-6 flex gap-1.5" aria-hidden>
            {SKILLS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-5 bg-foreground" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION                                                                      */
/* -------------------------------------------------------------------------- */

export function SkillsGrid() {
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

  function goToSkill(index: number) {
    const el = outerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const distance = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (distance * (index + 0.5)) / COUNT, behavior: "smooth" });
  }

  return (
    <section
      ref={outerRef}
      aria-label="Ko'nikmalar"
      className="relative h-[380svh] bg-muted/30"
    >
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-[4.5rem] lg:pt-16">

        {/* ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-1/4 size-80 rounded-full bg-primary/8 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-1/4 size-64 rounded-full bg-primary/5 blur-[80px]"
        />

        <div className="container-shell relative w-full">

          {/* header row */}
          <motion.div
            variants={variants.stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="mb-8 flex items-end justify-between sm:mb-10"
          >
            <motion.div variants={variants.fadeUp}>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" aria-hidden />
                To'liq format
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                To'rtta ko'nikma.
              </h2>
            </motion.div>

            {/* desktop pill nav */}
            <motion.div
              variants={variants.fadeUp}
              className="hidden items-center gap-1.5 lg:flex"
              role="tablist"
              aria-label="Ko'nikmalar navigatsiyasi"
            >
              {SKILLS.map((skill, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={skill.title}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => goToSkill(i)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {skill.title}
                  </button>
                );
              })}
            </motion.div>
          </motion.div>

          {/* card deck */}
          <ol
            aria-live="polite"
            aria-atomic="true"
            className="relative h-[18rem] w-full sm:h-[20rem] lg:h-[22rem]"
          >
            {SKILLS.map((skill, index) => (
              <SkillCard
                key={skill.title}
                skill={skill}
                index={index}
                progress={progress}
                current={index === active}
                reduce={reduce}
              />
            ))}
          </ol>

          {/* mobile progress bar */}
          <div className="mt-6 flex gap-1.5 lg:hidden" aria-hidden>
            {SKILLS.map((skill, i) => (
              <button
                key={skill.title}
                type="button"
                onClick={() => goToSkill(i)}
                className="h-1 flex-1 overflow-hidden rounded-full bg-border"
              >
                <span
                  className={`block h-full origin-left rounded-full bg-foreground transition-transform duration-500 ${
                    i <= active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
