import { redirect } from 'next/navigation'

// Practice endi bitta sahifada: /dashboard/practice
export default function Page() {
  redirect('/dashboard/practice?skill=listening')
}
