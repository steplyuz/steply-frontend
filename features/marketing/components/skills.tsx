"use client";

import Image from "next/image";
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

import { useAlphabet } from "@/shared/providers/alphabet-provider";
import {
  ListeningIcon,
  ReadingIcon,
  SpeakingIcon,
  WritingIcon,
  type SkillIconProps,
} from "@/shared/ui/icons/skill-icons";

import { useMotionVariants } from "./motion";

/* -------------------------------------------------------------------------- */
/* DATA                                                                         */
/* Matnlar HOZIRGI o'zbek alifbosida yoziladi; yangi alifboga t() o'tkazadi.     */
/* Ranglar: yagona yashil palitra (globals.css tokenlari), kartalar bir-biridan  */
/* faqat gradient ohangi bilan farqlanadi.                                       */
/* -------------------------------------------------------------------------- */

type Skill = {
  Icon: ComponentType<SkillIconProps>;
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

const GLOW = "shadow-[0_20px_60px_-12px_rgba(31,122,77,0.35)]";

const SKILLS: Skill[] = [
  {
    Icon: ReadingIcon,
    title: "Reading",
    eyebrow: "o'qib tushunish",
    body: "Matnlarni tahlil qiling va savollarga real imtihon formatida javob bering. Har bir bo'lim imtihon uslubida tuzilgan.",
    accent: "bg-primary/15",
    bgVisual: "bg-gradient-to-br from-secondary via-white to-brand-soft",
    glow: GLOW,
    blob: "bg-brand-bright/40",
    mascot: "/mascot/reading.png",
    number: "01",
  },
  {
    Icon: ListeningIcon,
    title: "Listening",
    eyebrow: "Tinglab tushunish",
    body: "Audio topshiriqlarni tinglang, asosiy ma'lumotlarni ajrating va javoblaringizni tekshiring. Real imtihon shovqin darajasida.",
    accent: "bg-primary/20",
    bgVisual: "bg-gradient-to-br from-brand-soft via-secondary to-brand-glow/60",
    glow: GLOW,
    blob: "bg-primary/30",
    mascot: "/mascot/listening.png",
    number: "02",
  },
  {
    Icon: WritingIcon,
    title: "Writing",
    eyebrow: "Yozma nutq",
    body: "Yozma topshiriqlarni bajaring va javoblaringizni baholash uchun yuboring. AI yordamida tezkor feedback oling.",
    accent: "bg-brand-bright/25",
    bgVisual: "bg-gradient-to-br from-white via-secondary to-brand-bright/40",
    glow: GLOW,
    blob: "bg-brand-glow/60",
    mascot: "/mascot/writing.png",
    number: "03",
  },
  {
    Icon: SpeakingIcon,
    title: "Speaking",
    eyebrow: "Og'zaki nutq",
    body: "Savollarga ovozli javob bering va speaking ko'nikmangizni mashq qiling. Talaffuz va ravonlik bo'yicha baho oling.",
    accent: "bg-primary/25",
    bgVisual: "bg-gradient-to-br from-brand-glow/50 via-secondary to-primary/30",
    glow: GLOW,
    blob: "bg-brand-bright/50",
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
  const { t } = useAlphabet();
  const { Icon, title, eyebrow, body, accent, bgVisual, glow, blob, mascot, number } = skill;

  const first = index === 0;
  const last = index === COUNT - 1;

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
  const yOut = first ? [0, 0, -60] : last ? [60, 0, 0] : [60, 0, 0, -60];
  const scaleOut = first ? [1, 1, 0.95] : last ? [0.95, 1, 1] : [0.95, 1, 1, 0.95];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const opacityMV = useTransform(progress, inputs, opacityOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yMV = useTransform(progress, inputs, yOut);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const scaleMV = useTransform(progress, inputs, scaleOut);

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

        {/* LEFT: mascot card — yashil gradient + glow */}
        <div
          aria-hidden
          className={`
            relative flex h-56 items-end justify-center
            overflow-hidden rounded-3xl border border-white/70
            ring-1 ring-primary/10 sm:h-64 lg:h-72
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
          <span className="pointer-events-none absolute -bottom-2 left-3 select-none font-display text-[7rem] font-semibold leading-none tracking-tighter text-primary-strong opacity-[0.07] sm:text-[9rem]">
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
              <Icon className="size-5 text-primary-strong sm:size-[22px]" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t(eyebrow)}
            </p>
          </div>

          {/* counter */}
          <p className="mt-4 font-mono text-xs font-semibold tabular-nums tracking-wider text-muted-foreground/70">
            {number} / 0{COUNT}
          </p>

          {/* title */}
          <h3 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]">
            {t(title)}
          </h3>

          {/* body */}
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">
            {t(body)}
          </p>

          {/* progress dots */}
          <div className="mt-6 flex gap-1.5" aria-hidden>
            {SKILLS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border-strong"
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
  const { t } = useAlphabet();
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
      aria-label={t("Ko'nikmalar")}
      className="relative h-[380svh] bg-muted/40"
    >
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-[4.5rem] lg:pt-16">

        {/* ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-1/4 size-80 rounded-full bg-primary/10 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-1/4 size-64 rounded-full bg-brand-bright/10 blur-[80px]"
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
                {t("To'liq format")}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("To'rtta ko'nikma.")}
              </h2>
            </motion.div>

            {/* desktop pill nav */}
            <motion.div
              variants={variants.fadeUp}
              className="hidden items-center gap-1.5 lg:flex"
              role="tablist"
              aria-label={t("Ko'nikmalar navigatsiyasi")}
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
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                        ? "bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-sm"
                        : "bg-secondary text-secondary-foreground/70 hover:bg-brand-soft hover:text-secondary-foreground"
                      }`}
                  >
                    {t(skill.title)}
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
                className="h-1 flex-1 overflow-hidden rounded-full bg-border-strong/60"
              >
                <span
                  className={`block h-full origin-left rounded-full bg-primary transition-transform duration-500 ${i <= active ? "scale-x-100" : "scale-x-0"
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