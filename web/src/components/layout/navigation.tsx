import {
  AuditOutlined,
  BankOutlined,
  ContactsOutlined,
  DashboardOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { MessageKey } from '../../i18n/types'
import type { Role } from '../../types/api'

export interface MenuRoute {
  path: string
  nameKey: MessageKey
  icon: ReactNode
}

export interface BreadcrumbTrailItem {
  labelKey: MessageKey
  to?: string
}

export function buildMenuRoutes(role: Role | null): MenuRoute[] {
  const routes: MenuRoute[] = [
    {
      path: '/dashboard',
      nameKey: 'nav.dashboard',
      icon: <DashboardOutlined />,
    },
    { path: '/accounts', nameKey: 'nav.accounts', icon: <BankOutlined /> },
    { path: '/payees', nameKey: 'nav.payees', icon: <ContactsOutlined /> },
  ]

  if (role === 'OPERATOR') {
    routes.push(
      { path: '/transfer', nameKey: 'nav.transfer', icon: <SwapOutlined /> },
      { path: '/audit', nameKey: 'nav.audit', icon: <AuditOutlined /> },
    )
  }

  routes.push({
    path: '/settings',
    nameKey: 'nav.settings',
    icon: <SettingOutlined />,
  })

  return routes
}

export function getSelectedMenuKeys(pathname: string): string[] {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return ['/dashboard']
  }
  if (pathname === '/accounts' || pathname.startsWith('/accounts/')) {
    return ['/accounts']
  }
  if (pathname === '/payees' || pathname.startsWith('/payees/')) {
    return ['/payees']
  }
  if (pathname === '/transfer' || pathname.startsWith('/transfer/')) {
    return ['/transfer']
  }
  if (pathname === '/audit' || pathname.startsWith('/audit/')) {
    return ['/audit']
  }
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return ['/settings']
  }
  return []
}

export function getBreadcrumbTrail(pathname: string): BreadcrumbTrailItem[] {
  if (pathname === '/dashboard') {
    return [{ labelKey: 'nav.dashboard' }]
  }
  if (pathname === '/accounts') {
    return [{ labelKey: 'nav.accounts' }]
  }
  if (/^\/accounts\/[^/]+\/transactions$/.test(pathname)) {
    return [
      { labelKey: 'nav.accounts', to: '/accounts' },
      { labelKey: 'breadcrumb.transactionHistory' },
    ]
  }
  if (pathname === '/payees') {
    return [{ labelKey: 'nav.payees' }]
  }
  if (pathname === '/transfer') {
    return [{ labelKey: 'nav.transfer' }]
  }
  if (pathname === '/audit') {
    return [{ labelKey: 'nav.audit' }]
  }
  if (pathname === '/settings') {
    return [{ labelKey: 'nav.settings' }]
  }
  return []
}
