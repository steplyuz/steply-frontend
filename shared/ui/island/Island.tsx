"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const CONTENT_OUT_MS = 120;

// Laptop: tez, bounce yo'q. damping > 2*sqrt(stiffness*mass) bo'lgani uchun
// (48 > 2*sqrt(600*0.8) ≈ 43.8) spring overshoot qilmaydi.
const DESKTOP_CLOSE: Transition = { type: "spring", stiffness: 600, damping: 48, mass: 0.8 };
const TOUCH_CLOSE: Transition = { type: "spring", stiffness: 520, damping: 44 };
const OPEN: Transition = { type: "spring", stiffness: 420, damping: 32 };
const INSTANT: Transition = { duration: 0 };

// Kontent yopilishda yuqoriga va biroz kichrayib yo'qoladi.
const contentVariants = {
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  hidden: { opacity: 0, y: -6, scale: 0.97, transition: { duration: CONTENT_OUT_MS / 1000, ease: "easeIn" } },
} as const;

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

type IslandProps = { compact: ReactNode; expanded: ReactNode };

export function Island({ compact, expanded }: IslandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduce = useReducedMotion();
  const fine = useFinePointer();

  const open = useCallback(() => {
    clearTimeout(timer.current);
    setShowContent(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setShowContent(false);
    timer.current = setTimeout(
      () => {
        const hadFocus = ref.current?.contains(document.activeElement) ?? false;
        setIsOpen(false);
        setShowContent(true);
        if (hadFocus) ref.current?.focus({ preventScroll: true });
      },
      reduce ? 0 : CONTENT_OUT_MS,
    );
  }, [reduce]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen, close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Yopilayotganda pill compact holatiga qaytadi, yopilish paytida spring tanlanadi.
  const pillTransition = reduce ? INSTANT : isOpen ? OPEN : fine ? DESKTOP_CLOSE : TOUCH_CLOSE;

  return (
    <div style={wrapperStyle}>
      <motion.div
        ref={ref}
        layout
        role={isOpen ? "dialog" : "button"}
        aria-label={isOpen ? undefined : "Ochish"}
        aria-expanded={isOpen}
        tabIndex={isOpen ? -1 : 0}
        onClick={() => !isOpen && open()}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            open();
          }
        }}
        transition={pillTransition}
        style={{
          ...pillStyle,
          transformOrigin: "top center",
          borderRadius: isOpen ? 28 : 999,
          cursor: isOpen ? "default" : "pointer",
        }}
      >
        <motion.div
          variants={contentVariants}
          initial="shown"
          animate={showContent ? "shown" : "hidden"}
          style={contentStyle}
        >
          {isOpen ? expanded : compact}
        </motion.div>
      </motion.div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top, 0px) + 12px)",
  left: 0,
  right: 0,
  zIndex: 50,
  display: "flex",
  justifyContent: "center",
  padding: "0 12px",
  pointerEvents: "none",
};

const pillStyle: React.CSSProperties = {
  background: "#000",
  color: "#fff",
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  maxWidth: "100%",
  pointerEvents: "auto",
  outline: "none",
};

const contentStyle: React.CSSProperties = { padding: "10px 16px" };