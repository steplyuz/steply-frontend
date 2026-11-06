import {
  BookOpen, CreditCard, GraduationCap, Headphones, LayoutDashboard, Mic, Pencil, Settings, UserRound, ChartNoAxesCombined,
} from 'lucide-react'
import type { Tone } from '@/lib/brand'

// Kabinet navigatsiyasi va sahifa sarlavhalari uchun yagona manba:
// sidebar menyusi ham, topbar sarlavhasi ham shu yerdan oladi.

export type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean; tone?: Tone; also?: string[] }
export type NavGroup = { title?: string; items: NavItem[] }

export const DASHBOARD_NAV: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Mashq',
    items: [
      { href: '/dashboard/practice', label: 'Practice', icon: BookOpen, tone: 'blue', also: ['/dashboard/reading', '/dashboard/listening', '/dashboard/writing', '/dashboard/speaking'] },
      { href: '/dashboard/analysis', label: 'Analysis', icon: ChartNoAxesCombined, tone: 'blue' },
      { href: '/dashboard/mock-exams', label: 'Mock Exam', icon: GraduationCap, tone: 'purple' },
    ],
  },
  {
    title: 'Hisob',
    items: [
      { href: '/dashboard/billing', label: 'Tarif va to‘lovlar', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
    ],
  },
]

export const PROFILE_ITEM: NavItem = { href: '/dashboard/profile', label: 'Profil', icon: UserRound }

export const isExternalHref = (href: string) => /^https?:\/\//.test(href)

const PAGE_DESC: Record<string, string> = {
  '/dashboard': 'Practice bo‘limlari va o‘quv rejangiz',
  '/dashboard/practice': 'Reading, Listening, Writing va Speaking testlari',
  '/dashboard/analysis': 'Mavjud tahlil videolari va foydalanish limiti',
  '/dashboard/mock-exams': 'Mock Exam katalogi va xaridlar',
  '/dashboard/billing': 'Obuna, buyurtmalar va to‘lovlar',
  '/dashboard/settings': 'Hisob sozlamalari',
  '/dashboard/profile': 'Shaxsiy ma’lumotlar, avatar va kontaktlar',
}

/** Joriy yo'lga mos topbar sarlavhasi va tavsifi (eng uzun mos keladigan prefiks). */
export function pageMeta(pathname: string): { title: string; description?: string } {
  const all = [...DASHBOARD_NAV.flatMap((g) => g.items), PROFILE_ITEM].filter((i) => !isExternalHref(i.href))
  const match = all
    .filter((i) => (i.exact ? pathname === i.href : [i.href, ...(i.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`))))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (!match) return { title: 'Shaxsiy kabinet' }
  return { title: match.label, description: PAGE_DESC[match.href] }
}
