"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/* -------------------------------------------------------------------------- */
/* MOTION HELPERS                                                              */
/* -------------------------------------------------------------------------- */

export const ease = [0.16, 1, 0.3, 1] as const;
const MOTION_DURATION = 0.62;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION, ease },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease } },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085 } },
};

export const viewportOnce = { once: true, amount: 0.2 } as const;

export function useMotionVariants() {
  const reduceMotion = useReducedMotion();

  return useMemo(() => {
    if (!reduceMotion) return { fadeUp, fadeIn, stagger };

    const instant: Variants = {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
    return {
      fadeUp: instant,
      fadeIn: instant,
      stagger: { hidden: {}, show: { transition: { staggerChildren: 0 } } } as Variants,
    };
  }, [reduceMotion]);
}

/** Section heading block used by every section (keeps spacing consistent). */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const variants = useMotionVariants();

  return (
    <motion.div
      variants={variants.stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="mx-auto max-w-2xl text-center"
    >
      <motion.p
        variants={variants.fadeUp}
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={variants.fadeUp}
        className="mt-3 text-balance text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={variants.fadeUp}
        className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}