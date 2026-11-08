import type { ElementType } from 'react'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChartNoAxesCombined,
  CreditCard,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mic2,
  PenLine,
  Users,
} from 'lucide-react'

/**
 * Admin / evaluator navigatsiyasi — YAGONA manba.
 * Sidebar (menyu), topbar (breadcrumb) va faol holat shu yerdan hisoblanadi;
 * yangi sahifa qo'shilganda faqat shu faylga yozish kifoya.
 */

export interface NavItem {
  href: string
  label: string
  icon: ElementType
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Sidebar kengligi (px). Layout chetlamasi ham shu qiymatdan olinadi. */
export const ADMIN_SIDEBAR_WIDTH = 272

const ADMIN_NAV: NavSection[] = [
  {
    title: 'Boshqaruv',
    items: [
      { href: '/admin', label: 'Boshqaruv paneli', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
      { href: '/admin/mock-exams', label: 'Mock imtihonlar', icon: GraduationCap },
      { href: '/admin/analysis', label: 'Analysis videolari', icon: ChartNoAxesCombined },
      { href: '/admin/exam-dates', label: 'Imtihon sanalari', icon: CalendarDays },
    ],
  },
  {
    title: 'Testlar bazasi',
    items: [
      { href: '/admin/reading', label: 'Reading', icon: BookOpen },
      { href: '/admin/listening', label: 'Listening', icon: Headphones },
      { href: '/admin/writing', label: 'Writing', icon: PenLine },
      { href: '/admin/speaking/questions', label: 'Speaking', icon: Mic2 },
    ],
  },
  {
    title: 'Baholash',
    items: [
      { href: '/admin/writing/grading', label: 'Writing baholash', icon: CheckCircle2 },
      { href: '/admin/speaking/assessments', label: 'Speaking baholash', icon: CheckCircle2 },
    ],
  },
  {
    title: 'Moliya',
    items: [{ href: '/admin/billing', label: "Obunalar va to'lovlar", icon: CreditCard }],
  },
]

const TEACHER_NAV: NavSection[] = [
  {
    title: 'Baholash',
    items: [
      { href: '/teacher-expert', label: 'Boshqaruv paneli', icon: LayoutDashboard },
      { href: '/teacher-expert/writing', label: 'Writing baholash', icon: PenLine },
      { href: '/teacher-expert/speaking', label: 'Speaking baholash', icon: Mic2 },
      { href: '/teacher-expert/history', label: 'Bajarilganlar', icon: CheckCircle2 },
    ],
  },
]

export function getNavSections(role: string): NavSection[] {
  if (role === 'admin' || role === 'super_admin') return ADMIN_NAV
  if (role === 'teacher') return TEACHER_NAV
  return []
}

function matches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Pathga eng uzun mos keladigan menyu bandini topadi (bir vaqtda bitta band faol bo'ladi). */
export function findActiveItem(pathname: string, sections: NavSection[]): { item: NavItem; section: NavSection } | null {
  let best: { item: NavItem; section: NavSection } | null = null
  for (const section of sections) {
    for (const item of section.items) {
      if (!matches(pathname, item.href)) continue
      if (!best || item.href.length > best.item.href.length) best = { item, section }
    }
  }
  return best
}

export function isNavItemActive(pathname: string, href: string, sections: NavSection[]): boolean {
  return findActiveItem(pathname, sections)?.item.href === href
}

/** Ichki sahifa (masalan /admin/reading/abc123) uchun breadcrumb oxirgi bo'lagi. */
function detailSuffix(pathname: string, itemHref: string): string | null {
  if (pathname === itemHref) return null
  if (/^\/admin\/(reading|listening|writing)\/[^/]+$/.test(pathname)) return 'Tahrirlash'
  return 'Batafsil'
}

export interface Breadcrumb {
  section: string | null
  title: string
  detail: string | null
}

export function getBreadcrumb(pathname: string, sections: NavSection[]): Breadcrumb {
  const found = findActiveItem(pathname, sections)
  if (!found) return { section: null, title: 'Admin', detail: null }
  const isHome = pathname === found.item.href && found.section.items[0] === found.item
  return {
    section: isHome ? null : found.section.title,
    title: found.item.label,
    detail: detailSuffix(pathname, found.item.href),
  }
}
