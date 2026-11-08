"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Award, CheckCircle2, QrCode, ShieldCheck } from "lucide-react";

import { Uz } from "@/shared/providers/alphabet-provider";

import { ease } from "./motion";

/* -------------------------------------------------------------------------- */
/* SOZLAMALAR                                                                  */
/* TILT_* : sichqoncha bilan burilish kuchi (kattaroq = kuchliroq 3D).         */
/* -------------------------------------------------------------------------- */

const TILT_Y = 24; // chapga-o'ngga (±12°)
const TILT_X = 20; // tepaga-pastga (±10°)

/* -------------------------------------------------------------------------- */
/* NAMUNA MA'LUMOT                                                             */
/* Yo'nalish nomlari berilgach, faqat shu ro'yxatni almashtiring.              */
/* -------------------------------------------------------------------------- */

const SECTIONS: { label: string; score: number }[] = [
  { label: "1-bo‘lim", score: 68 },
  { label: "2-bo‘lim", score: 71 },
  { label: "3-bo‘lim", score: 64 },
  { label: "4-bo‘lim", score: 69 },
];

const TOTAL_SCORE = 68;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* -------------------------------------------------------------------------- */
/* HISOBLAGICH: 0 dan target gacha sanaydi (enabled=false bo'lsa darrov target) */
/* framer-motion'ga bog'liq emas: useState + requestAnimationFrame.            */
/* -------------------------------------------------------------------------- */

function useCountUp(target: number, enabled: boolean, delayMs = 550, durationMs = 1600) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let raf = 0;
    let startedAt = 0;

    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startedAt) startedAt = now;
        const progress = Math.min(1, (now - startedAt) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 4);

        setValue(target * eased);

        if (progress < 1) raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, enabled, delayMs, durationMs]);

  return value;
}

/* -------------------------------------------------------------------------- */
/* SCAN QR — QR belgisi ustidan o'tuvchi skaner chizig'i                       */
/* -------------------------------------------------------------------------- */

function ScanQr({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
      <QrCode className="size-7 text-primary-strong" aria-hidden />
      {!reduceMotion && (
        <motion.span
          aria-hidden
          initial={{ top: "10%" }}
          animate={{ top: ["10%", "86%", "10%"] }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          className="absolute inset-x-1 h-0.5 rounded-full bg-brand-bright shadow-[0_0_8px_rgba(93,187,138,0.9)]"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HERO RESULT CARD (3D)                                                       */
/*                                                                             */
/* 3D qoidasi: preserve-3d zanjiri uzilmasligi kerak. Burilayotgan wrapper va   */
/* karta ikkalasi ham preserve-3d. Ular orasida backdrop-blur / filter /       */
/* overflow-hidden bo'lmasligi shart (aks holda chuqurlik yassilanadi).        */
/* -------------------------------------------------------------------------- */

export function TiltResultCard() {
  const reduceMotion = useReducedMotion() ?? false;

  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /* "Umumiy ball" hisoblagichi */
  const score = useCountUp(TOTAL_SCORE, !reduceMotion);

  /* Sichqoncha burilishi (spring bilan yumshatilgan) */
  const pointerX = useMotionValue(0); // rotateX maqsadi
  const pointerY = useMotionValue(0); // rotateY maqsadi
  const springCfg = { stiffness: 160, damping: 20, mass: 0.6 };
  const sPointerX = useSpring(pointerX, springCfg);
  const sPointerY = useSpring(pointerY, springCfg);

  /* Kirish (flip) va doimiy tebranish */
  const introX = useMotionValue(12);
  const introY = useMotionValue(-30);
  const idleX = useMotionValue(0);
  const idleY = useMotionValue(0);

  const rotateX = useTransform(
    [sPointerX, idleX, introX],
    (v: number[]) => v[0] + v[1] + v[2],
  );
  const rotateY = useTransform(
    [sPointerY, idleY, introY],
    (v: number[]) => v[0] + v[1] + v[2],
  );

  /* Soya burilishga qarama-qarshi siljiydi */
  const shadowX = useTransform(rotateY, (v) => -v * 1.4);
  const shadowY = useTransform(rotateX, (v) => v * 1.2);

  /* Yorug'lik dog'i */
  const glareX = useMotionValue(30);
  const glareY = useMotionValue(20);
  const glareTarget = useMotionValue(0);
  const glareOpacity = useSpring(glareTarget, { stiffness: 120, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(155,227,188,0.5), transparent 62%)`;

  /* Kirish flip + doimiy yengil tebranish */
  useEffect(() => {
    if (reduceMotion) return;

    const controls = [
      animate(introX, 0, { duration: 1.2, delay: 0.1, ease }),
      animate(introY, 0, { duration: 1.2, delay: 0.1, ease }),
      animate(idleX, [0, -3, 0, 3, 0], {
        duration: 8,
        delay: 1.3,
        repeat: Infinity,
        ease: "easeInOut",
      }),
      animate(idleY, [0, 5, 0, -5, 0], {
        duration: 6.5,
        delay: 1.3,
        repeat: Infinity,
        ease: "easeInOut",
      }),
    ];

    return () => controls.forEach((c) => c.stop());
  }, [reduceMotion, introX, introY, idleX, idleY]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;

    const sceneRect = sceneRef.current?.getBoundingClientRect();
    if (sceneRect) {
      const x = clamp((event.clientX - sceneRect.left) / sceneRect.width - 0.5, -0.6, 0.6);
      const y = clamp((event.clientY - sceneRect.top) / sceneRect.height - 0.5, -0.6, 0.6);
      pointerY.set(x * TILT_Y);
      pointerX.set(y * -TILT_X);
    }

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (cardRect) {
      glareX.set(clamp(((event.clientX - cardRect.left) / cardRect.width) * 100, 0, 100));
      glareY.set(clamp(((event.clientY - cardRect.top) / cardRect.height) * 100, 0, 100));
      glareTarget.set(1);
    }
  }

  function resetTilt() {
    pointerX.set(0);
    pointerY.set(0);
    glareTarget.set(0);
  }

  /* Chuqurlik yordamchisi: reduced-motion da qatlamlar tekis turadi */
  const depth = (px: number) =>
    reduceMotion ? undefined : { transform: `translateZ(${px}px)` };

  return (
    /*
     * pt-* leaves headroom for the mascot that stands on the card's top edge.
     * pb-* leaves room for the floating chip and the back sheets.
     */
    <motion.div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="relative mx-auto w-full max-w-[400px] pb-8 pt-[76px] sm:max-w-[460px] sm:pb-10 sm:pt-[96px] lg:mx-0 lg:max-w-[490px] [perspective:1100px]"
    >
      {/* Soya / nur: burilishga qarama-qarshi siljiydi */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { x: shadowX, y: shadowY }}
        className="pointer-events-none absolute inset-x-6 top-16 bottom-4 rounded-[42px] bg-primary/20 blur-3xl sm:inset-x-8"
      />

      {/* 3D sahna: hammasi shu wrapper bilan birga buriladi */}
      <motion.div
        style={
          reduceMotion
            ? undefined
            : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative"
      >
        {/* Orqa qatlamlar: karta burilganda yon tomondan ko'rinadi */}
        <div
          aria-hidden
          style={depth(-30)}
          className="absolute inset-x-4 -bottom-3 top-6 rounded-3xl bg-brand-texture ring-1 ring-[#0F3D26]/[0.06] sm:inset-x-5"
        />
        <div
          aria-hidden
          style={depth(-60)}
          className="absolute inset-x-8 -bottom-6 top-10 rounded-3xl bg-secondary ring-1 ring-[#0F3D26]/[0.06] sm:inset-x-10"
        />

        {/* Asosiy karta */}
        <div
          ref={cardRef}
          style={reduceMotion ? undefined : { transformStyle: "preserve-3d" }}
          className="relative rounded-3xl bg-white p-5 shadow-[0_30px_90px_-38px_rgba(15,61,38,0.45)] ring-1 ring-[#0F3D26]/[0.06] sm:p-7"
        >
          {/* Yorug'lik dog'i (sichqoncha ustida) */}
          {!reduceMotion && (
            <motion.div
              aria-hidden
              style={{ background: glare, opacity: glareOpacity, z: 2 }}
              className="pointer-events-none absolute inset-0 rounded-3xl"
            />
          )}

          {/* Yuqori qator */}
          <div className="flex items-center justify-between gap-3" style={depth(24)}>
            <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Uz>Namuna natija</Uz>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold text-secondary-foreground ring-1 ring-primary/10">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              Demo
            </span>
          </div>

          {/* Umumiy ball + aylanuvchi sertifikat nishoni */}
          <div
            className="mt-6 flex items-end justify-between gap-4 sm:mt-7"
            style={depth(42)}
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                <Uz>Umumiy ball</Uz>
              </p>
              <p className="mt-1 font-display text-5xl font-semibold tabular-nums tracking-[-0.06em] text-foreground sm:text-6xl">
                {score.toFixed(1)}
              </p>
            </div>

            <span aria-hidden className="shrink-0" style={{ perspective: 300 }}>
              <motion.span
                animate={reduceMotion ? undefined : { rotateY: [0, 360] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 3.6,
                  ease: "easeInOut",
                }}
                className="flex size-12 items-center justify-center rounded-2xl bg-primary-strong text-brand-glow shadow-[0_10px_24px_-10px_rgba(15,61,38,0.7)] sm:size-14"
              >
                <Award className="size-6 sm:size-7" />
              </motion.span>
            </span>
          </div>

          {/* Bo'limlar */}
          <div
            className="mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:gap-3"
            style={depth(30)}
          >
            {SECTIONS.map(({ label, score: sectionScore }, i) => (
              <motion.div
                key={label}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease }}
                className="rounded-2xl bg-muted/70 px-2 py-3 text-center ring-1 ring-[#0F3D26]/[0.05]"
              >
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  <Uz>{label}</Uz>
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{sectionScore}</p>
                <div aria-hidden className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                  <motion.div
                    initial={reduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: sectionScore / 100 }}
                    transition={{ duration: 0.9, delay: 0.75 + i * 0.08, ease }}
                    style={{ transformOrigin: "left" }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-brand-bright to-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mock ID + QR */}
          <div
            className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 sm:mt-6 sm:pt-5"
            style={depth(18)}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mock ID
              </p>
              <p className="mt-1 truncate font-mono text-xs font-semibold tracking-wide text-foreground">
                MOCK-A1B2C3D4
              </p>
            </div>
            <ScanQr reduceMotion={reduceMotion} />
          </div>
        </div>

        {/* Boyqush: kartaning yuqori chetida turadi, oldinga chiqarilgan */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease }}
          style={reduceMotion ? undefined : { z: 80 }}
          className="pointer-events-none absolute -top-[76px] right-5 z-20 w-[92px] sm:-top-[96px] sm:right-8 sm:w-[118px]"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/mascot/owl-standing.png"
              alt=""
              width={400}
              height={400}
              priority
              className="h-auto w-full drop-shadow-[0_14px_18px_rgba(0,0,0,0.18)]"
            />
          </motion.div>
        </motion.div>

        {/* Suzuvchi chip: eng oldinda (desktop / tablet) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.7, ease }}
          style={reduceMotion ? undefined : { z: 100 }}
          className="absolute -bottom-7 -left-2 z-20 hidden sm:block lg:-left-6"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="rounded-2xl bg-card px-4 py-3 shadow-[0_14px_30px_-12px_rgba(15,61,38,0.4)] ring-1 ring-[#0F3D26]/[0.06]"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary"
              >
                <CheckCircle2 className="size-5" />
              </span>
              <span>
                <span className="block text-xs font-bold text-foreground">
                  <Uz>Barcha yo‘nalishlar</Uz>
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                  <Uz>Mock imtihonlar bir joyda</Uz>
                </span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}