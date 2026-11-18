import type { ReactNode } from 'react'
import { useAuthStore } from '../../app/authStore'
import { ForbiddenPage } from '../../pages/ForbiddenPage'
import type { Role } from '../../types/api'

export function RequireRole({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== role) {
    return <ForbiddenPage requiredRole={role} />
  }

  return <>{children}</>
}
