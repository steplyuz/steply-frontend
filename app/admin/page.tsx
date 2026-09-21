"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  FileText,
  Headphones,
  Mic2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  PenLine,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

import {
  adminApi,
  listeningApi,
  mockExamsApi,
  readingApi,
  speakingApi,
  writingApi,
} from "@/lib/api/endpoints";
import { authenticatedDownload } from "@/lib/api/download";
import type {
  AdminStatistics,
  ListeningTest,
  MockExam,
  ReadingTest,
  SpeakingTestSummary,
  WritingExam,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiRequestError } from "@/lib/api/client";

const CEFR_LEVELS = ["Multilevel", "B1", "B2", "C1"];

const EMPTY_FORM = {
  title: "",
  price: 0,
  cefr_level: "B1",
  duration_minutes: 180,
  description: "",
  reading_id: "",
  listening_id: "",
  writing_id: "",
  speaking_id: "",
  is_active: true,
};

type SkillKey =
  | "reading_id"
  | "listening_id"
  | "writing_id"
  | "speaking_id";

type SkillOption = {
  id: string;
  title: string;
  level: string;
};

const MOCK_JSON = `{
  "title": "Mock B1 #1",
  "cefr_level": "B1",
  "duration_minutes": 180,
  "reading_id": "READ-xxxxxxxx",
  "listening_id": "LIST-xxxxxxxx",
  "writing_id": "WRIT-xxxxxxxx",
  "speaking_id": "SPEAK-xxxxxxxx"
}`;

// Keep in sync with `.container-shell` in app/globals.css.
const container =
  "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10";

const ease = [0.22, 1, 0.36, 1] as const;

const reveal: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;

    for (const key of [
      "items",
      "data",
      "results",
      "tests",
      "exams",
    ]) {
      if (Array.isArray(v[key])) {
        return v[key] as T[];
      }
    }
  }

  return [];
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  description: string;
  icon: typeof Users;
}) {
  return (
    <motion.div
      variants={reveal}
      className="group relative overflow-hidden rounded-[22px] border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(21,21,21,0.05)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-4 text-foreground" />
        </div>

        <span className="size-1.5 rounded-full bg-primary" />
      </div>

      <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
        {value ?? "—"}
      </p>

      <p className="mt-1 text-sm font-semibold">{label}</p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

function SkillSelector({
  label,
  icon: Icon,
  value,
  options,
  loading,
  onChange,
}: {
  label: string;
  icon: typeof BookOpen;
  value: string;
  options: SkillOption[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  const selected = options.find((item) => item.id === value);

  return (
    <div className="rounded-2xl border border-border bg-background p-4 transition-colors duration-200 focus-within:border-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-card border border-border">
            <Icon className="size-3.5 text-foreground" />
          </div>

          <div>
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              Skill test
            </p>
          </div>
        </div>

        {selected && (
          <Check className="size-4 text-primary-strong" />
        )}
      </div>

      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="mt-3 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {loading
            ? "Testlar yuklanmoqda..."
            : `${label} testini tanlang`}
        </option>

        {options.map((test) => (
          <option value={test.id} key={test.id}>
            {test.id} — {test.title} [{test.level}]
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] =
    useState<AdminStatistics | null>(null);

  const [exams, setExams] =
    useState<MockExam[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  const [advanced, setAdvanced] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const [busy, setBusy] =
    useState<Record<string, boolean>>({});

  const [tests, setTests] = useState<
    Record<SkillKey, SkillOption[]>
  >({
    reading_id: [],
    listening_id: [],
    writing_id: [],
    speaking_id: [],
  });

  const shouldReduceMotion = useReducedMotion();

  const isAdmin = user?.global_role === "admin";
  const isEvaluator = user?.global_role === "speaking_evaluator";

  // Teacher (speaking_evaluator) uchun Mock Center boshqaruv paneli emas,
  // balki alohida, soddalashtirilgan "Baholash markazi" ko'rsatiladi —
  // shu sabab bu sahifaga kelib qolsa avtomatik o'sha yerga yo'naltiriladi.
  useEffect(() => {
    if (isEvaluator) router.replace("/admin/speaking/assessments");
  }, [isEvaluator, router]);

  useEffect(() => {
    if (!isAdmin) return;

    adminApi
      .statistics()
      .then(setStats)
      .catch(() =>
        setError("Statistikani yuklab bo‘lmadi"),
      );

    mockExamsApi
      .adminList()
      .then((x) => setExams(asArray<MockExam>(x)))
      .catch(() => setExams([]));

    loadSkillTests();
  }, [isAdmin]);

  async function loadSkillTests() {
    setLoadingTests(true);
    setError(null);

    try {
      const [r, l, w, s] = await Promise.all([
        readingApi.getAll(),
        listeningApi.getAll(),
        writingApi.getAll(),
        speakingApi.listTests(),
      ]);

      const reading = asArray<ReadingTest>(r).map(
        (x) => ({
          id: x.id,
          title: x.title,
          level: x.cefr_level || "—",
        }),
      );

      const listening = asArray<ListeningTest>(l).map(
        (x) => ({
          id: x.id,
          title: x.title,
          level: x.level || "—",
        }),
      );

      const writing = asArray<WritingExam>(w).map(
        (x) => ({
          id: x.id,
          title: x.title,
          level: x.cefr_level || "—",
        }),
      );

      const speaking = asArray<SpeakingTestSummary>(s).map(
        (x) => ({
          id: x.id,
          title: x.title,
          level: "Speaking",
        }),
      );

      setTests({
        reading_id: reading,
        listening_id: listening,
        writing_id: writing,
        speaking_id: speaking,
      });
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Skill testlarini yuklab bo‘lmadi",
      );
    } finally {
      setLoadingTests(false);
    }
  }

  function setF<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  }

  async function refreshExams() {
    try {
      const result = await mockExamsApi.adminList();
      setExams(asArray<MockExam>(result));
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Mocklarni yuklab bo‘lmadi",
      );
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError(null);

    const missing = (
      Object.keys(tests) as SkillKey[]
    ).filter((key) => !form[key].trim());

    if (missing.length) {
      setError(
        "Mock yaratish uchun Reading, Listening, Writing va Speaking testlarining barchasini tanlang.",
      );
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        price: Number(form.price),
        cefr_level: form.cefr_level,
        duration_minutes: Number(
          form.duration_minutes,
        ),
        is_active: form.is_active,
        description:
          form.description.trim() || null,
        reading_id: form.reading_id,
        listening_id: form.listening_id,
        writing_id: form.writing_id,
        speaking_id: form.speaking_id,
      };

      await mockExamsApi.create(payload);

      await refreshExams();

      setForm(EMPTY_FORM);
      setAdvanced(false);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Mock yaratishda xatolik",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (
      !confirm(
        `"${id}" mock imtihonini o‘chirishni tasdiqlaysizmi?`,
      )
    ) {
      return;
    }

    setBusy((b) => ({
      ...b,
      [id]: true,
    }));

    setError(null);

    try {
      await mockExamsApi.remove(id);

      setExams(
        (prev) =>
          prev?.filter((x) => x.id !== id) ?? null,
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "O‘chirishda xatolik",
      );
    } finally {
      setBusy((b) => ({
        ...b,
        [id]: false,
      }));
    }
  }

  async function download(
    url: string,
    filename: string,
  ) {
    setBusy((b) => ({
      ...b,
      [filename]: true,
    }));

    await authenticatedDownload(url, {
      filename,
      onError: setError,
    });

    setBusy((b) => ({
      ...b,
      [filename]: false,
    }));
  }

  if (isLoading || isEvaluator) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <ShieldAlert className="size-5 text-muted-foreground" />
        </div>

        <div>
          <p className="font-semibold">
            Administrator ruxsati kerak
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Bu bo‘limga faqat administratorlar kira oladi.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-semibold text-background"
        >
          Kabinetga qaytish
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  const skillMeta: Array<{
    key: SkillKey;
    label: string;
    icon: typeof BookOpen;
  }> = [
    {
      key: "reading_id",
      label: "Reading",
      icon: BookOpen,
    },
    {
      key: "listening_id",
      label: "Listening",
      icon: Headphones,
    },
    {
      key: "writing_id",
      label: "Writing",
      icon: PenLine,
    },
    {
      key: "speaking_id",
      label: "Speaking",
      icon: Mic2,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ============================================================
          HEADER
      ============================================================ */}
      <section className="border-b border-border bg-card">
        <div className={`${container} py-8 sm:py-10`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: 15,
                    }
              }
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                    }
              }
              transition={{
                duration: 0.55,
                ease,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Admin Console
                </p>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Mock Center
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Reading, Listening, Writing va Speaking
                testlarini bitta mock imtihonga
                biriktiring.
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowJson((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong bg-card px-4 text-xs font-semibold transition-all hover:border-foreground"
              >
                <FileText className="size-3.5" />
                Namuna JSON
                {showJson ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={loadSkillTests}
                disabled={loadingTests}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${
                    loadingTests ? "animate-spin" : ""
                  }`}
                />
                Sync
              </button>
            </div>
          </div>

          {showJson && (
            <motion.div
              initial={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      height: 0,
                    }
              }
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      height: "auto",
                    }
              }
              className="mt-6 overflow-hidden rounded-2xl border border-border bg-foreground"
            >
              <pre className="overflow-x-auto p-5 text-xs leading-6 text-background/60">
                {MOCK_JSON}
              </pre>
            </motion.div>
          )}
        </div>
      </section>

      <div className={`${container} py-8 sm:py-10`}>
        {/* ============================================================
            ERROR
        ============================================================ */}
        {error && (
          <motion.div
            initial={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 0,
                    y: -5,
                  }
            }
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 1,
                    y: 0,
                  }
            }
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />

            <div>
              <p className="font-semibold">
                Amalni bajarishda xatolik
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* ============================================================
            STATISTICS
        ============================================================ */}
        <motion.section
          variants={stagger}
          initial={shouldReduceMotion ? "visible" : "hidden"}
          animate="visible"
          className="grid gap-4 sm:grid-cols-3"
        >
          <StatCard
            label="Jami foydalanuvchilar"
            value={stats?.total_users}
            description="Platformadagi barcha foydalanuvchilar"
            icon={Users}
          />

          <StatCard
            label="Topshirilgan imtihonlar"
            value={stats?.total_exams_taken}
            description="Barcha yakunlangan imtihonlar"
            icon={BarChart3}
          />

          <StatCard
            label="Bugungi foydalanuvchilar"
            value={stats?.users_today}
            description="Bugun platformaga kirganlar"
            icon={Users}
          />
        </motion.section>

        {/* ============================================================
            WORKSPACE
        ============================================================ */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          {/* ========================================================
              CREATE
          ======================================================== */}
          <motion.div
            initial={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 0,
                    y: 20,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 1,
                    y: 0,
                  }
            }
            viewport={{
              once: true,
              margin: "-70px",
            }}
            transition={{
              duration: 0.55,
              ease,
            }}
            className="rounded-[26px] border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Plus className="size-4" />
                  </div>

                  <h2 className="font-semibold">
                    Yangi mock yaratish
                  </h2>
                </div>

                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Barcha 4 skillni birlashtirib yangi
                  mock imtihon yarating.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-foreground px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                4 / 4
              </span>
            </div>

            <form
              onSubmit={handleCreate}
              className="mt-7 space-y-5"
            >
              {/* Basic */}
              <div>
                <FieldLabel>Asosiy ma'lumot</FieldLabel>

                <div className="space-y-3">
                  <input
                    required
                    minLength={3}
                    value={form.title}
                    onChange={(e) =>
                      setF("title", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                    placeholder="Mock B1 #1"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>CEFR</FieldLabel>

                      <select
                        value={form.cefr_level}
                        onChange={(e) =>
                          setF(
                            "cefr_level",
                            e.target.value,
                          )
                        }
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                      >
                        {CEFR_LEVELS.map((level) => (
                          <option key={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>
                        Narx (so‘m)
                      </FieldLabel>

                      <input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) =>
                          setF(
                            "price",
                            Number(e.target.value),
                          )
                        }
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>
                      Davomiyligi
                    </FieldLabel>

                    <div className="relative">
                      <Clock3 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        type="number"
                        min={30}
                        max={360}
                        value={form.duration_minutes}
                        onChange={(e) =>
                          setF(
                            "duration_minutes",
                            Number(e.target.value),
                          )
                        }
                        className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-16 text-sm outline-none focus:border-foreground"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
                        MIN
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <FieldLabel>
                  Skill testlarini biriktirish
                </FieldLabel>

                <div className="space-y-2.5">
                  {skillMeta.map(
                    ({ key, label, icon: Icon }) => (
                      <SkillSelector
                        key={key}
                        label={label}
                        icon={Icon}
                        value={form[key]}
                        options={tests[key]}
                        loading={loadingTests}
                        onChange={(value) =>
                          setF(key, value)
                        }
                      />
                    ),
                  )}
                </div>
              </div>

              {/* Advanced */}
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setAdvanced((v) => !v)
                  }
                  className="flex w-full items-center justify-between text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary-strong" />
                    Qo‘shimcha sozlamalar
                  </span>

                  {advanced ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {advanced && (
                  <motion.div
                    initial={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: 0,
                            height: 0,
                          }
                    }
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            height: "auto",
                          }
                    }
                    className="mt-4 space-y-4"
                  >
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setF(
                          "description",
                          e.target.value,
                        )
                      }
                      className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-foreground"
                      placeholder="Imtihon haqida qisqacha..."
                    />

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) =>
                          setF(
                            "is_active",
                            e.target.checked,
                          )
                        }
                        className="size-4 accent-primary"
                      />

                      Foydalanuvchilarga ko‘rinsin
                    </label>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  saving || loadingTests
                }
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    Mock yaratish
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* ========================================================
              MOCK LIST
          ======================================================== */}
          <motion.div
            initial={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 0,
                    y: 20,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: 1,
                    y: 0,
                  }
            }
            viewport={{
              once: true,
              margin: "-70px",
            }}
            transition={{
              duration: 0.55,
              ease,
            }}
            className="min-w-0 rounded-[26px] border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <BarChart3 className="size-4" />
                  </div>

                  <h2 className="font-semibold">
                    Mock imtihonlar
                  </h2>
                </div>

                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Yaratilgan mocklar va biriktirilgan
                  skill testlar.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshExams}
                className="flex size-9 items-center justify-center rounded-full border border-border transition-all hover:border-foreground hover:bg-background"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {exams === null ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-40 animate-pulse rounded-2xl bg-muted"
                    />
                  ))}
                </>
              ) : exams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center">
                  <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Hali mock yaratilmagan
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Chap tomondagi forma orqali
                    birinchi mockni yarating.
                  </p>
                </div>
              ) : (
                exams.map((exam) => (
                  <motion.article
                    key={exam.id}
                    layout
                    className="group rounded-2xl border border-border p-4 transition-all duration-300 hover:border-border-strong hover:shadow-[0_15px_40px_rgba(21,21,21,0.045)]"
                  >
                    {/* Exam header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-foreground px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
                            {exam.cefr_level}
                          </span>

                          <span className="text-[10px] text-muted-foreground">
                            {exam.id}
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-sm font-semibold">
                          {exam.title}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock3 className="size-3" />
                          {exam.duration_minutes} daqiqa
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(exam.id)
                        }
                        disabled={!!busy[exam.id]}
                        aria-label={`${exam.title} ni o‘chirish`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {busy[exam.id] ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Skills */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {skillMeta.map(
                        ({
                          key,
                          label,
                        }) => (
                          <div
                            key={key}
                            className="min-w-0 rounded-xl bg-muted px-3 py-2.5"
                          >
                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                              {label}
                            </p>

                            <p className="mt-1 truncate font-mono text-[9px] font-medium text-foreground">
                              {exam[key] ||
                                "Biriktirilmagan"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-muted pt-3">
                      <span className="mr-auto text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        PDF
                      </span>

                      {(
                        [
                          [
                            "Reading",
                            mockExamsApi.readingPaperUrl(
                              exam.id,
                            ),
                            `${exam.id}-reading.pdf`,
                            BookOpen,
                          ],
                          [
                            "Listening",
                            mockExamsApi.listeningPaperUrl(
                              exam.id,
                            ),
                            `${exam.id}-listening.pdf`,
                            Headphones,
                          ],
                          [
                            "Writing",
                            mockExamsApi.writingPaperUrl(
                              exam.id,
                            ),
                            `${exam.id}-writing.pdf`,
                            PenLine,
                          ],
                        ] as const
                      ).map(
                        ([
                          label,
                          url,
                          file,
                          Icon,
                        ]) => (
                          <button
                            type="button"
                            key={label}
                            onClick={() =>
                              download(
                                url,
                                file,
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-[9px] font-semibold transition-all hover:border-foreground hover:bg-background"
                          >
                            {busy[file] ? (
                              <RefreshCw className="size-3 animate-spin" />
                            ) : (
                              <Icon className="size-3" />
                            )}

                            {label}
                          </button>
                        ),
                      )}
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </motion.div>
        </section>

        {/* ============================================================
            QUICK NAVIGATION
        ============================================================ */}
        <section className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Quick access
              </p>

              <p className="mt-1 text-sm font-semibold">
                Skill boshqaruvi
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                [
                  "/admin/reading",
                  "Reading",
                  BookOpen,
                ],
                [
                  "/admin/listening",
                  "Listening",
                  Headphones,
                ],
                [
                  "/admin/writing",
                  "Writing",
                  PenLine,
                ],
                [
                  "/admin/speaking/questions",
                  "Speaking",
                  Mic2,
                ],
                [
                  "/admin/mock",
                  "Sessiyalar",
                  Calendar,
                ],
              ].map(
                ([href, label, Icon]) => (
                  <Link
                    key={String(href)}
                    href={String(href)}
                    className="group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground"
                  >
                    <Icon className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    {String(label)}
                    <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                download(
                  adminApi.exportUsersUrl(),
                  "users_export.xlsx",
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="size-3.5" />
              Foydalanuvchilarni Excel'da yuklab olish
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}