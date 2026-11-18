import { AuditOutlined, BankOutlined, SwapOutlined } from '@ant-design/icons'
import type { MenuDataItem } from '@ant-design/pro-components'
import type { Role } from '../../types/api'

export interface BreadcrumbTrailItem {
  label: string
  to?: string
}

export function buildMenuRoutes(role: Role | null): MenuDataItem[] {
  const routes: MenuDataItem[] = [
    { path: '/accounts', name: 'Accounts', icon: <BankOutlined /> },
  ]

  if (role === 'OPERATOR') {
    routes.push(
      { path: '/transfer', name: 'Transfer', icon: <SwapOutlined /> },
      { path: '/audit', name: 'Audit log', icon: <AuditOutlined /> },
    )
  }

  return routes
}

export function getSelectedMenuKeys(pathname: string): string[] {
  if (pathname === '/accounts' || pathname.startsWith('/accounts/')) {
    return ['/accounts']
  }
  if (pathname === '/transfer' || pathname.startsWith('/transfer/')) {
    return ['/transfer']
  }
  if (pathname === '/audit' || pathname.startsWith('/audit/')) {
    return ['/audit']
  }
  return []
}

export function getBreadcrumbTrail(pathname: string): BreadcrumbTrailItem[] {
  if (pathname === '/accounts') {
    return [{ label: 'Accounts' }]
  }
  if (/^\/accounts\/[^/]+\/transactions$/.test(pathname)) {
    return [
      { label: 'Accounts', to: '/accounts' },
      { label: 'Transaction history' },
    ]
  }
  if (pathname === '/transfer') {
    return [{ label: 'Transfer' }]
  }
  if (pathname === '/audit') {
    return [{ label: 'Audit log' }]
  }
  return []
}
