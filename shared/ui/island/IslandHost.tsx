"use client";

import { usePathname } from "next/navigation";
import { Island } from "./Island";

const HIDDEN_PREFIXES = ["/login", "/register"];

export function IslandHost() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <Island
      key={pathname}
      compact={<span>Steply</span>}
      expanded={<div>Kengaygan kontent</div>}
    />
  );
}