"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { CheckCircle2, QrCode, ShieldCheck } from "lucide-react";

import { ease } from "./motion";

/* -------------------------------------------------------------------------- */
/* HERO RESULT CARD                                                            */
/* -------------------------------------------------------------------------- */

export function TiltResultCard() {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 180, damping: 22, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 180, damping: 22, mass: 0.6 });
  const transform = useMotionTemplate`perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse" || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    rawRotateY.set(x * 9);
    rawRotateX.set(y * -8);
  }

  function resetTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  const skills: [string, number][] = [
    ["L", 68],
    ["R", 71],
    ["W", 64],
    ["S", 69],
  ];

  return (
    /*
     * pt-* leaves headroom for the mascot that stands on the card's top edge.
     * pb-* leaves room for the floating chip on desktop.
     */
    <div className="relative mx-auto w-full max-w-[400px] pb-2 pt-[76px] sm:max-w-[460px] sm:pb-6 sm:pt-[96px] lg:mx-0 lg:max-w-[490px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-16 bottom-4 rounded-[42px] bg-primary/20 blur-3xl sm:inset-x-8"
      />

      {/* Mascot: stands on top of the card, gently floating */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease }}
        className="pointer-events-none absolute right-5 top-0 z-20 w-[92px] sm:right-8 sm:w-[118px]"
        aria-hidden
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

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.12, ease }}
        className="relative z-10"
      >
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
          className="relative [perspective:1100px]"
        >
          <motion.div
            style={reduceMotion ? undefined : { transform, transformStyle: "preserve-3d" }}
            className="relative rounded-[24px] border border-border/80 bg-card/95 p-5 shadow-[0_30px_90px_-38px_rgba(0,0,0,0.32)] backdrop-blur-sm sm:rounded-[32px] sm:p-7"
          >
            <div
              className="flex items-center justify-between gap-3"
              style={reduceMotion ? undefined : { transform: "translateZ(24px)" }}
            >
              <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Namuna natija
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                Demo
              </span>
            </div>

            <div
              className="mt-6 flex items-end justify-between gap-4 sm:mt-7"
              style={reduceMotion ? undefined : { transform: "translateZ(38px)" }}
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">Umumiy ball</p>
                <p className="mt-1 text-5xl font-bold tracking-[-0.06em] sm:text-6xl">68.0</p>
              </div>
              <span className="rounded-2xl bg-foreground px-4 py-2 text-lg font-extrabold text-primary">
                B2
              </span>
            </div>

            <div
              className="mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:gap-3"
              style={reduceMotion ? undefined : { transform: "translateZ(28px)" }}
            >
              {skills.map(([label, score], i) => (
                <motion.div
                  key={label}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.07, ease }}
                  className="rounded-2xl border border-border/70 bg-muted/70 px-2 py-3 text-center"
                >
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{score}</p>
                </motion.div>
              ))}
            </div>

            <div
              className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 sm:mt-6 sm:pt-5"
              style={reduceMotion ? undefined : { transform: "translateZ(18px)" }}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mock ID
                </p>
                <p className="mt-1 truncate font-mono text-xs font-semibold tracking-wide">MOCK-A1B2C3D4</p>
              </div>
              <QrCode className="size-8 shrink-0 text-foreground" aria-hidden />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating chip: desktop / tablet only (mobile already shows this in hero badges) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.7, ease }}
        className="absolute -bottom-1 -left-2 z-20 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:block lg:-left-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20">
            <CheckCircle2 className="size-5" />
          </span>
          <span>
            <span className="block text-xs font-bold">4 ta ko‘nikma</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">Bitta mock imtihonda</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}