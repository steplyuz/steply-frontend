/**
 * Admin paneli uchun yagona dizayn uslublari.
 * Ranglar faqat dizayn tokenlaridan (globals.css): error / success / warning / info / primary / muted / border.
 */

/** Forma maydonlari (input, select, textarea) — barcha admin sahifalarida bir xil. */
export const adminInput =
  'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary'

/** Asosiy tugma (primary). */
export const adminButtonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50'

/** Ikkilamchi tugma (chegarali). */
export const adminButtonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40'

/** Xavfli amal tugmasi (o'chirish, bekor qilish). */
export const adminButtonDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-error/30 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/10 disabled:opacity-40'

/** Karta / bo'lim qutisi. */
export const adminCard = 'rounded-xl border border-border bg-card p-5'

export type AdminTone = 'error' | 'success' | 'warning' | 'info'

/** Xabar qutisi uchun ohang klasslari. */
export const adminToneClasses: Record<AdminTone, string> = {
  error: 'border-error/30 bg-error/10 text-error',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-info/30 bg-info/10 text-info',
}
