"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { VT323 } from "next/font/google";

import { publicApi } from "@/lib/api/endpoints";
import type { PublicStats } from "@/lib/api/types";

/** Blocky monospace digits for the LED/dot-matrix look in the reference design. */
const digitalFont = VT323({ subsets: ["latin"], weight: "400" });

/* -------------------------------------------------------------------------- */
/* MOTION                                                                      */
/* -------------------------------------------------------------------------- */

const ease = [0.16, 1, 0.3, 1] as const;

function useStatsMotion() {
  const reduce = useReducedMotion() ?? false;

  return useMemo(() => {
    const container: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
    };

    const item: Variants = reduce
      ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
      : {
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
        };

    return { reduce, container, item };
  }, [reduce]);
}

/* -------------------------------------------------------------------------- */
/* COUNT UP — runs once in view, re-runs smoothly if the value changes         */
/* -------------------------------------------------------------------------- */

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;

    if (reduce) {
      setDisplay(value);
      return;
    }

    const controls = animate(from.current, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        from.current = latest;
        setDisplay(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref}>
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* SINGLE STAT                                                                 */
/* -------------------------------------------------------------------------- */

type StatItem = {
  value: number | undefined;
  suffix?: string;
  label: string;
};

function StatSkeleton() {
  return (
    <span
      aria-hidden
      className="relative inline-block h-14 w-40 overflow-hidden rounded bg-blue-500/10 align-middle sm:h-16 sm:w-48"
    >
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}

function Stat({ item, loaded }: { item: StatItem; loaded: boolean }) {
  const { item: variant } = useStatsMotion();
  const { value, suffix, label } = item;

  return (
    <motion.div variants={variant} className="flex flex-col items-center gap-2 px-8 py-2 text-center">
      <p
        className={`${digitalFont.className} text-7xl leading-none tracking-[0.08em] text-blue-600 [text-shadow:0_0_1px_currentColor] dark:text-blue-400 sm:text-8xl`}
        aria-live="polite"
      >
        {!loaded || typeof value !== "number" ? <StatSkeleton /> : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className={`${digitalFont.className} text-lg uppercase tracking-[0.2em] text-blue-500/70 dark:text-blue-300/70 sm:text-xl`}>
        {label}
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* STRIP                                                                       */
/* -------------------------------------------------------------------------- */

export function StatsStrip() {
  const { container } = useStatsMotion();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    let active = true;

    setLoaded(false);
    setFailed(false);

    publicApi
      .stats()
      .then((result) => {
        if (active) setStats(result);
      })
      .catch(() => {
        if (active) {
          setStats(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (loaded && failed) {
    return null;
  }

  const items: StatItem[] = [
    {
      value: stats?.active_mock_exams,
      label: "Faol mock imtihonlar",
    },
    {
      value: stats?.upcoming_sessions,
      label: "Yaqinlashayotgan sessiyalar",
    },
    {
      value: stats?.registrations,
      suffix: "+",
      label: "Ro‘yxatdan o‘tganlar",
    },
  ];

  return (
    <section aria-label="Platforma statistikasi" className="relative border-y border-blue-500/15 bg-background">
      <div className="container-shell py-12 sm:py-16">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-10 divide-x divide-blue-500/15 sm:justify-between sm:gap-x-8"
        >
          {items.map((item) => (
            <Stat key={item.label} item={item} loaded={loaded} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}