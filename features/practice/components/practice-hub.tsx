"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Sparkles,
} from "lucide-react";
import { useApi } from "@/shared/api/use-api";
import type { PracticeCatalog, PracticeSkill } from "@/shared/api/types";
import {
  isBlockedForUser,
  isPremiumTest,
} from "@/features/practice/lib/access";
import { usePaidAccess } from "@/features/practice/lib/use-paid-access";
import { useSpeakingGrading } from "@/features/speaking/lib/access";
import { FOCUS } from "@/shared/lib/brand";
import { Uz, useAlphabet } from "@/shared/providers/alphabet-provider";
import { SpeakingGradingNotice } from "@/features/speaking/components/speaking-grading-notice";
import { SpeakingHistory } from "@/features/speaking/components/speaking-history";
import { SpeakingLockedActions } from "@/features/speaking/components/speaking-locked";
import {
  SKILLS,
  LockedBadge,
  PremiumLockButton,
  isPracticeVisible,
} from "./skill-practice";
import { PRACTICE_CONFIG, SKILL_ORDER, type HubTest } from "./practice-config";
import {
  Badge,
  ErrorBox,
  Loading,
  PageHeader,
  btn,
} from "@/shared/ui/dashboard-kit";
import { PracticeActionLink } from "@/shared/ui/action-button";

const PAGE_SIZE = 12;

type Card = HubTest & {
  raw: any;
  part: string | null;
  premium: boolean;
  locked: boolean;
};

export function PracticeHub() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t: tr } = useAlphabet();

  const requested = params.get("skill") as PracticeSkill | null;
  const active: PracticeSkill =
    requested && SKILL_ORDER.includes(requested) ? requested : "reading";
  const cfg = PRACTICE_CONFIG[active];
  const { tint, accent, icon: SkillIcon } = SKILLS[active];

  const catalog = useApi<PracticeCatalog>("/practice/tests");
  const results = useApi<any[]>(cfg.resultsPath);
  const speaking = useSpeakingGrading();
  const paid = usePaidAccess();
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [active]);

  // Faqat ko'rinadigan testlar (is_practice / is_active filtri) ko'nikma bo'yicha
  const visibleBySkill = useMemo(() => {
    const out = {} as Record<PracticeSkill, any[]>;
    for (const s of SKILL_ORDER) {
      out[s] = (catalog.data?.items?.[s] ?? []).filter(isPracticeVisible);
    }
    return out;
  }, [catalog.data]);

  const catalogReady = !catalog.loading && !catalog.error && !!catalog.data;
  const available = useMemo(
    () => SKILL_ORDER.filter((s) => visibleBySkill[s].length > 0),
    [visibleBySkill],
  );
  // Kirish faqat shu ko'nikmada testlar bo'lsa ochiq
  const activeHasTests = catalogReady && visibleBySkill[active].length > 0;

  // Testi yo'q ko'nikmada turgan bo'lsa, testi bor birinchi ko'nikmaga avtomatik o'tkazamiz
  useEffect(() => {
    if (!catalogReady || available.length === 0) return;
    if (!available.includes(active)) {
      router.replace(`${pathname}?skill=${available[0]}`, { scroll: false });
    }
  }, [catalogReady, available, active, pathname, router]);

  const select = (s: PracticeSkill) =>
    router.replace(`${pathname}?skill=${s}`, { scroll: false });

  const cards: Card[] = useMemo(() => {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });

    return visibleBySkill[active]
      .map((raw: any) => ({
        ...PRACTICE_CONFIG[active].toTest(raw),
        raw,
        part: raw.practice_part_number
          ? `Part ${raw.practice_part_number}`
          : null,
        premium: isPremiumTest(raw),
        locked: isBlockedForUser(raw, paid),
      }))
      .sort((a, b) => collator.compare(b.title, a.title));
  }, [visibleBySkill, active, paid]);

  const pages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const visible = cards.slice(offset, offset + PAGE_SIZE);

  const speakingState =
    active === "speaking"
      ? speaking.loading
        ? "loading"
        : speaking.canGrade
          ? "open"
          : "locked"
      : "open";

  const renderAction = (t: Card) => {
    if (t.locked) return <PremiumLockButton cls="w-full" />;
    if (speakingState === "locked")
      return <SpeakingLockedActions testId={t.id} title={t.title} />;
    if (speakingState === "loading") return null;
    return (
      <PracticeActionLink
        href={`${cfg.testBaseHref}/${t.id}`}
        variant="start"
        label="Boshlash"
        className="w-full"
      />
    );
  };

  const accentVar = { "--skill-accent": accent } as CSSProperties;

  return (
    <div className="space-y-6 pb-6 sm:space-y-8">
      <PageHeader
        title="Practice"
        desc={tr(
          "Ko'nikmani tanlang, testni boshlang va natijangizni kuzating.",
        )}
        eyebrow="Mashq"
        action={
          <>
            <span className="rounded-full bg-primary-strong px-4 py-2 text-xs font-semibold tabular-nums text-white">
              <span className="text-brand-glow">
                {catalog.loading ? "—" : cards.length}
              </span>{" "}
              <Uz>ta test</Uz>
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold tabular-nums text-foreground ring-1 ring-[#0F3D26]/[0.06]">
              {results.loading ? "—" : (results.data?.length ?? 0)}{" "}
              <Uz>ta yakunlangan</Uz>
            </span>
          </>
        }
      />

      {/* Ko'nikmalar tabi va natijalar tugmasi bir qatorda */}
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label={tr("Ko'nikmalar")}
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto rounded-full bg-white p-1.5 ring-1 ring-[#0F3D26]/[0.06]"
        >
          {SKILL_ORDER.map((s) => {
            const on = s === active;
            const empty = catalogReady && visibleBySkill[s].length === 0;
            const { icon: Icon } = SKILLS[s];
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                aria-disabled={empty}
                disabled={empty}
                onClick={() => select(s)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-95 motion-reduce:transition-none ${
                  on
                    ? "bg-primary-strong text-white"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                } ${empty ? "cursor-not-allowed opacity-40 hover:bg-foreground/5 active:scale-100" : ""} ${FOCUS}`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full ${on ? "bg-brand-glow text-primary-strong" : ""}`}
                  style={on ? undefined : { color: SKILLS[s].accent }}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={2.25}
                  />
                </span>
                {PRACTICE_CONFIG[s].label}
                <span
                  className={`text-xs tabular-nums ${on ? "text-white/60" : "text-foreground/40"}`}
                >
                  {catalog.loading ? "" : visibleBySkill[s].length}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href={`/dashboard/practice/results?skill=${active}`}
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary-strong px-4 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 motion-reduce:transition-none ${FOCUS}`}
        >
          <Uz>Natijalar</Uz>
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {active === "speaking" && activeHasTests && (
        <div className="space-y-3">
          <SpeakingGradingNotice />
          <Link href="/dashboard/cefr?skill=speaking" className={btn.outline}>
            <Sparkles className="size-4" /> <Uz>AI baholash va kamchiliklar</Uz>
          </Link>
        </div>
      )}

      <section aria-label="Mavjud testlar" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2
            id="available-tests-heading"
            className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            <Uz>Mavjud testlar</Uz>
          </h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: tint, color: accent }}
          >
            {cfg.desc}
          </span>
        </div>

        {catalog.loading ? (
          <Loading rows={3} />
        ) : catalog.error ? (
          <ErrorBox message={catalog.error.message} onRetry={catalog.reload} />
        ) : !activeHasTests ? (
          <div className="rounded-3xl border border-dashed border-primary-strong/20 bg-white px-5 py-12 text-center">
            <span
              className="mx-auto flex size-12 items-center justify-center rounded-2xl"
              style={{ background: tint, color: accent }}
            >
              <SkillIcon aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-foreground">
              {available.length === 0 ? (
                <Uz>Hozircha hech qanday test mavjud emas.</Uz>
              ) : (
                <Uz>Bu ko'nikma bo'yicha testlar hozircha yo'q.</Uz>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Uz>Yangi testlar qo'shilganda shu yerda ko'rinadi.</Uz>
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((t, i) => {
                const metas = t.meta.filter(
                  (m): m is string => !!m && !/mini-?test/i.test(m),
                );
                const num = cards.length - (offset + i);
                return (
                  <article
                    key={t.id}
                    style={accentVar}
                    className="group relative flex min-h-48 flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-[#0F3D26]/[0.06] transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-strong/10 hover:ring-[var(--skill-accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-1 -top-3 z-0 select-none font-display text-[6.5rem] font-semibold leading-none tracking-tighter transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      style={{ color: `${accent}24` }}
                    >
                      {num}
                    </span>

                    <div className="relative z-10 min-w-0 pr-16">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {t.part && (
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: tint, color: accent }}
                          >
                            {t.part}
                          </span>
                        )}
                        {t.free && (
                          <Badge tone="green">
                            <Uz>Bepul</Uz>
                          </Badge>
                        )}
                        {t.locked ? (
                          <LockedBadge />
                        ) : t.premium ? (
                          <Badge tone="amber">
                            <Crown aria-hidden="true" className="mr-1 size-3" />
                            Premium
                          </Badge>
                        ) : null}
                      </div>

                      <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
                        {t.title}
                      </h3>

                      {metas.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {metas.map((m, k) => (
                            <span
                              key={`${m}-${k}`}
                              className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-semibold text-foreground/70"
                            >
                              {/daqiqa|min/i.test(m) ? (
                                <Clock3 aria-hidden="true" className="size-3" />
                              ) : null}
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">{renderAction(t)}</div>
                  </article>
                );
              })}
            </div>

            {pages > 1 && (
              <nav
                aria-label={tr("Sahifalar")}
                className="flex items-center justify-center gap-2 pt-2"
              >
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full border border-primary-strong/70 bg-transparent px-4 text-sm font-bold text-primary-strong transition-colors hover:bg-card disabled:opacity-40 ${FOCUS}`}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />{" "}
                  <Uz>Oldingi</Uz>
                </button>
                <span className="px-2 text-sm font-semibold tabular-nums text-muted-foreground">
                  {safePage} / {pages}
                </span>
                <button
                  type="button"
                  disabled={safePage === pages}
                  onClick={() => setPage(safePage + 1)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full bg-gradient-to-br from-primary to-primary-strong px-4 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40 ${FOCUS}`}
                >
                  <Uz>Keyingi</Uz>{" "}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {active === "speaking" && activeHasTests && <SpeakingHistory />}
    </div>
  );
}
