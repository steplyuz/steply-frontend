import Link from "next/link";

/* -------------------------------------------------------------------------- */
/* FOOTER                                                                       */
/* -------------------------------------------------------------------------- */

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8 sm:py-10">
      <div className="container-shell flex flex-col items-center justify-between gap-5 sm:flex-row">
        <Link href="/" aria-label="Steply bosh sahifasi" className="inline-flex shrink-0">
          <img src="/logo-full.png" alt="Steply" className="h-9 w-auto object-contain" />
        </Link>
        <nav
          aria-label="Pastki navigatsiya"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
        >
          <Link href="/mock" className="transition-colors hover:text-foreground">
            Mock imtihonlar
          </Link>
          <Link href="/result" className="transition-colors hover:text-foreground">
            Natijalar
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Kirish
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Steply</p>
      </div>
    </footer>
  );
}