import type { ReactNode } from 'react'
import { useAuthStore } from '../../app/authStore'
import { ForbiddenPage } from '../../pages/ForbiddenPage'
import type { Role } from '../../types/api'

export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[]
  children: ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  const requiredRoles: Role[] = Array.isArray(role) ? role : [role]

  if (!user || !requiredRoles.includes(user.role)) {
    return <ForbiddenPage requiredRole={requiredRoles} />
  }

  return <>{children}</>
}
