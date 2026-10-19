import {
  BookOpen, CreditCard, GraduationCap, Headphones, LayoutDashboard, Mic, Pencil, Settings, UserRound, ChartNoAxesCombined,
} from 'lucide-react'
import type { Tone } from '@/lib/brand'

// Kabinet navigatsiyasi va sahifa sarlavhalari uchun yagona manba:
// sidebar menyusi ham, topbar sarlavhasi ham shu yerdan oladi.

export type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean; tone?: Tone }
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
      { href: '/dashboard/reading', label: 'Reading', icon: BookOpen, tone: 'blue' },
      { href: '/dashboard/listening', label: 'Listening', icon: Headphones, tone: 'purple' },
      { href: '/dashboard/writing', label: 'Writing', icon: Pencil, tone: 'orange' },
      { href: '/dashboard/speaking', label: 'Speaking', icon: Mic, tone: 'red' },
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
  '/dashboard/reading': 'Practice testlar va natijalar',
  '/dashboard/listening': 'Audio testlar va natijalar',
  '/dashboard/writing': 'Yozma topshiriqlar va natijalar',
  '/dashboard/speaking': 'Ovoz yozish va natijalar',
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
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (!match) return { title: 'Shaxsiy kabinet' }
  return { title: match.label, description: PAGE_DESC[match.href] }
}
