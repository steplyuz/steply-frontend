"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAlphabet } from "@/shared/providers/alphabet-provider";

// DIQQAT: "code" qiymatlari alphabet-provider dagi lang qiymatlariga mos bo'lishi kerak
const LANGUAGES = [
  { code: "uz-latn", label: "O'zbekcha (lotin)", short: "o'z" },
  { code: "uz-cyrl", label: "Ўзбекча (кирилл)", short: "ўз" },
  { code: "ru", label: "Русский", short: "ru" },
  { code: "en", label: "English", short: "en" },
] as const;

export function LanguageSwitcher() {
  // DIQQAT: setLang nomi boshqacha bo'lsa, shu yerda o'zgartiring
  const { lang, setLang } = useAlphabet();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Tashqariga bosilganda yoki Escape bosilganda menyuni yopish
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span>{current.short}</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
          {LANGUAGES.map((item) => {
            const selected = item.code === current.code;
            return (
              <li key={item.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <span className={selected ? "font-semibold" : ""}>
                    {item.label}
                  </span>
                  {selected && (
                    <Check
                      className="size-4 text-primary-strong"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
