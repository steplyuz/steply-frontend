'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'
import { RoleSidebar } from '@/components/layout/role-sidebar'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { useAuth } from '@/lib/auth/auth-context'

const displayFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--admin-display-font' })
const ALLOWED_ROLES = ['teacher', 'teacher_expert', 'speaking_evaluator', 'admin', 'super_admin']

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.replace('/login?next=/teacher-expert'); return }
    if (user && !ALLOWED_ROLES.includes(user.global_role)) router.replace('/dashboard')
  }, [isLoading, isAuthenticated, user, router])
  const authorized = isAuthenticated && !!user && ALLOWED_ROLES.includes(user.global_role)
  if (isLoading || !authorized) return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  return <div className={`admin-theme ${displayFont.variable} min-h-svh bg-background text-foreground`}>
    <RoleSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} basePath="/teacher-expert" />
    <div className="min-h-svh lg:pl-[272px]"><div className="flex min-h-svh flex-col"><AdminTopbar onMenuClick={() => setSidebarOpen(true)} /><main className="min-w-0 flex-1">{children}</main></div></div>
  </div>
}
