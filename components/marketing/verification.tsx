"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, BadgeCheck, ExternalLink, ScanLine, ShieldCheck, type LucideIcon } from "lucide-react";

import { ease, useMotionVariants, viewportOnce } from "./motion";

/* -------------------------------------------------------------------------- */
/* VERIFICATION                                                                 */
/* -------------------------------------------------------------------------- */

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ScanLine, title: "QR kodni skanerlang", body: "Natija qaydnomasidagi QR kodni telefoningiz bilan o‘qing." },
  { icon: ExternalLink, title: "Sahifaga o‘ting", body: "Tekshirish sahifasi avtomatik ochiladi." },
  { icon: BadgeCheck, title: "Ma’lumotlarni ko‘ring", body: "Mavjud natija ma’lumotlari bilan tanishing." },
];

/* Deterministic QR-like pattern (purely decorative) */
const QR_SIZE = 13;

function useQrCells() {
  return useMemo(() => {
    const cells: { x: number; y: number }[] = [];
    const inFinder = (r: number, c: number) =>
      (r < 5 && c < 5) || (r < 5 && c >= QR_SIZE - 5) || (r >= QR_SIZE - 5 && c < 5);
    const finderOn = (r: number, c: number) => {
      const rr = r >= QR_SIZE - 5 ? r - (QR_SIZE - 5) : r;
      const cc = c >= QR_SIZE - 5 ? c - (QR_SIZE - 5) : c;
      const edge = rr === 0 || rr === 4 || cc === 0 || cc === 4;
      const center = rr === 2 && cc === 2;
      return edge || center;
    };

    for (let r = 0; r < QR_SIZE; r++) {
      for (let c = 0; c < QR_SIZE; c++) {
        const gap =
          (r === 5 && c < 6) || (c === 5 && r < 6) ||
          (r === 5 && c >= QR_SIZE - 6) || (c === QR_SIZE - 6 && r < 6) ||
          (r === QR_SIZE - 6 && c < 6) || (c === 5 && r >= QR_SIZE - 6);
        if (inFinder(r, c)) {
          if (finderOn(r, c)) cells.push({ x: c, y: r });
        } else if (!gap && (r * 7 + c * 13 + r * c) % 5 < 2) {
          cells.push({ x: c, y: r });
        }
      }
    }
    return cells;
  }, []);
}

function QrScanner({ reduceMotion }: { reduceMotion: boolean }) {
  const cells = useQrCells();

  return (
    <div
      aria-hidden
      className="relative mx-auto size-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-background p-3 sm:mx-0 sm:size-36"
    >
      <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className="size-full text-foreground" shapeRendering="crispEdges">
        {cells.map(({ x, y }) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="currentColor" />
        ))}
      </svg>

      {/* scan line */}
      {!reduceMotion && (
        <motion.span
          className="absolute inset-x-1 h-0.5 rounded-full bg-primary shadow-[0_0_14px_3px_rgba(228,247,10,0.7)]"
          initial={{ top: "8%" }}
          animate={{ top: ["8%", "88%", "8%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* corner brackets */}
      {["left-1 top-1 border-l-2 border-t-2", "right-1 top-1 border-r-2 border-t-2", "bottom-1 left-1 border-b-2 border-l-2", "bottom-1 right-1 border-b-2 border-r-2"].map(
        (cls) => (
          <span key={cls} className={`absolute size-3 rounded-[3px] border-foreground/70 ${cls}`} />
        ),
      )}
    </div>
  );
}

function ResultCard() {
  const variants = useMotionVariants();
  const reduceMotion = useReducedMotion() ?? false;

  const rows: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: 14 },
        show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
      };

  const badge: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.6 },
        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 18 } },
      };

  return (
    <motion.div
      variants={variants.fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="relative mx-auto w-full min-w-0 max-w-xl"
    >
      <div
        aria-hidden
        className="absolute -inset-3 rounded-[28px] bg-primary/10 blur-2xl sm:-inset-5 sm:rounded-[36px]"
      />

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.14, delayChildren: 0.25 } } }}
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.35)] sm:rounded-3xl sm:p-6 md:p-7"
      >
        {/* header */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 sm:rounded-2xl sm:p-4">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 sm:size-11">
            {!reduceMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <ShieldCheck className="relative size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Tekshirish namunasi</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">Demo ma’lumotlar</p>
          </div>
          <span className="shrink-0 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Demo
          </span>
        </div>

        {/* body: QR + rows */}
        <div className="mt-4 flex flex-col gap-5 sm:mt-5 sm:flex-row sm:items-center">
          <QrScanner reduceMotion={reduceMotion} />

          <div className="min-w-0 flex-1">
            {[
              ["Mock ID", "MK-290706526"],
              ["CEFR daraja", "B2"],
            ].map(([label, value]) => (
              <motion.div
                key={label}
                variants={rows}
                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="break-all text-right font-mono text-xs font-bold sm:text-sm">{value}</span>
              </motion.div>
            ))}

            <motion.div variants={rows} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="text-muted-foreground">Holati</span>
              <motion.span
                variants={badge}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300"
              >
                <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                NAMUNA
              </motion.span>
            </motion.div>
          </div>
        </div>

        <p className="mt-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground sm:mt-3">
          Bu blok faqat interfeys namunasi; haqiqiy natija yoki tasdiqni bildirmaydi.
        </p>
      </motion.div>
    </motion.div>
  );
}

export function VerificationSection() {
  const variants = useMotionVariants();
  const reduceMotion = useReducedMotion();
  const tap = reduceMotion ? undefined : { scale: 0.97 };

  return (
    <section className="container-shell py-14 sm:py-20 lg:py-24">
      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + steps */}
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="min-w-0 text-center lg:text-left"
        >
          <motion.p
            variants={variants.fadeUp}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span className="size-2 rounded-full bg-primary" />
            Natijani tekshirish
          </motion.p>
          <motion.h2
            variants={variants.fadeUp}
            className="mx-auto mt-4 max-w-xl text-balance text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl lg:mx-0 lg:text-[2.65rem]"
          >
            Natija ma’lumotlarini QR orqali tekshiring.
          </motion.h2>
          <motion.p
            variants={variants.fadeUp}
            className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:mx-0"
          >
            Natija qaydnomasidagi QR kod orqali mavjud natija ma’lumotlarini tekshirish sahifasiga o‘ting.
          </motion.p>

          <motion.ol variants={variants.stagger} className="mx-auto mt-7 max-w-lg space-y-3 text-left lg:mx-0">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <motion.li
                key={title}
                variants={variants.fadeUp}
                className="group flex items-start gap-3.5 rounded-2xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-card/70"
              >
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-foreground transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                  <Icon className="size-[18px]" aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                    {index + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold tracking-tight">{title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{body}</span>
                </span>
              </motion.li>
            ))}
          </motion.ol>

          <motion.div variants={variants.fadeUp}>
            <motion.div whileTap={tap} className="mt-6 flex sm:mt-7 sm:inline-flex">
              <Link
                href="/result"
                className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                Natijani tekshirish
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right: demo result card */}
        <ResultCard />
      </div>
    </section>
  );
}