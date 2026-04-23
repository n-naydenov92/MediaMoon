import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { getFirstAccessibleModule } from '@/config/modules'

export default async function HomePage(): Promise<never> {
  const role = await getCurrentUserRole()
  if (!role) {
    redirect('/unauthorized')
  }
  const first = getFirstAccessibleModule(role)
  if (!first) {
    redirect('/unauthorized')
  }
  redirect(first.path)
}
