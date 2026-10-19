import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { FOCUS, LIME } from "@/lib/brand";

/* -------------------------------------------------------------------------- */
/* FOOTER                                                                       */
/* -------------------------------------------------------------------------- */

const COLUMNS = [
  {
    title: "Mashqlar",
    links: [
      { href: "/dashboard/reading", label: "Reading" },
      { href: "/dashboard/listening", label: "Listening" },
      { href: "/dashboard/writing", label: "Writing" },
      { href: "/dashboard/speaking", label: "Speaking" },
    ],
  },
  {
    title: "Imtihon va tarif",
    links: [
      { href: "/dashboard/mock-exams", label: "Mock Exam" },
      { href: "/dashboard/billing", label: "Tariflar" },
      { href: "/login", label: "Kirish" },
    ],
  },
  {
    title: "Kompaniya",
    links: [
      { href: "/about", label: "Biz haqimizda" },
      { href: "/contact", label: "Aloqa" },
    ],
  },
  {
    title: "Huquqiy",
    links: [
      { href: "/terms", label: "Shartlar" },
      { href: "/privacy", label: "Maxfiylik" },
    ],
  },
];

/** Dekorativ halqa — faqat bezak */
function Circle({ color, width = 20, className = "" }: { color: string; width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{ border: `${width}px solid ${color}` }}
    />
  );
}

function ContactPill({ href, icon, label, external }: { href: string; icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white/85 transition hover:bg-white/15 hover:text-white motion-reduce:transition-none ${FOCUS}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}

export function Footer() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const supportTelegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM?.trim();
  const telegramHref = supportTelegram
    ? supportTelegram.startsWith("http") ? supportTelegram : `https://t.me/${supportTelegram.replace(/^@/, "")}`
    : undefined;

  return (
    <footer className="bg-background">
      {/* Asosiy panel */}
      <div className="relative isolate overflow-hidden bg-foreground text-white">
        <Circle color="rgba(255,255,255,0.05)" width={22} className="-right-20 -top-24 size-64 sm:-right-24 sm:-top-28 sm:size-96" />

        <div className="container-shell relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-6">
          {/* Brend + aloqa */}
          <div className="flex flex-col items-start gap-5 lg:col-span-2">
            <Link href="/" aria-label="Steply bosh sahifasi" className={`inline-flex shrink-0 rounded-2xl bg-white px-4 py-2.5 ${FOCUS}`}>
              <img src="/logo.png" alt="Steply" className="h-8 w-auto object-contain" />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-white/60">
              Imtihonga tayyorgarlikni qulay, tushunarli va natijaga yo‘naltirilgan qiling.
            </p>
            <div className="flex flex-wrap gap-2">
              {supportEmail && <ContactPill href={`mailto:${supportEmail}`} icon={<Mail aria-hidden="true" className="size-4 shrink-0" />} label={supportEmail} />}
              {supportTelegram && telegramHref && <ContactPill href={telegramHref} external icon={<MessageCircle aria-hidden="true" className="size-4 shrink-0" />} label="Telegram" />}
              {!supportEmail && !supportTelegram && <ContactPill href="/contact" icon={<Mail aria-hidden="true" className="size-4 shrink-0" />} label="Biz bilan bog‘lanish" />}
            </div>
          </div>

          {/* Havolalar */}
          <nav aria-label="Pastki navigatsiya" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:col-span-4">
            {COLUMNS.map(col => (
              <div key={col.title}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: LIME }}>{col.title}</h2>
                <ul className="mt-4 space-y-1">
                  {col.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`-mx-2 inline-flex min-h-10 items-center rounded-full px-2 text-sm font-medium text-white/70 transition-colors hover:text-white motion-reduce:transition-none ${FOCUS}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Steply. Barcha huquqlar himoyalangan.</p>
          <p>Farg‘ona, O‘zbekiston</p>
        </div>
        </div>
      </div>
    </footer>
  );
}