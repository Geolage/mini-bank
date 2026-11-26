import { describe, expect, it } from 'vitest'
import {
  buildMenuRoutes,
  getBreadcrumbTrail,
  getSelectedMenuKeys,
} from './navigation'

describe('navigation', () => {
  it('limits viewers to account, payee and settings navigation', () => {
    expect(buildMenuRoutes('VIEWER').map((route) => route.path)).toEqual([
      '/dashboard',
      '/accounts',
      '/payees',
      '/settings',
    ])
    expect(buildMenuRoutes(null).map((route) => route.path)).toEqual([
      '/dashboard',
      '/accounts',
      '/payees',
      '/settings',
    ])
  })

  it('adds transfer, approval and audit entries for operators', () => {
    expect(buildMenuRoutes('OPERATOR').map((route) => route.path)).toEqual([
      '/dashboard',
      '/accounts',
      '/payees',
      '/transfer',
      '/approvals',
      '/audit',
      '/settings',
    ])
  })

  it('adds the approvals entry for checkers', () => {
    expect(buildMenuRoutes('CHECKER').map((route) => route.path)).toEqual([
      '/dashboard',
      '/accounts',
      '/payees',
      '/approvals',
      '/settings',
    ])
  })

  it('keeps accounts selected on the transaction history route', () => {
    expect(getSelectedMenuKeys('/dashboard')).toEqual(['/dashboard'])
    expect(getSelectedMenuKeys('/accounts')).toEqual(['/accounts'])
    expect(getSelectedMenuKeys('/accounts/abc/transactions')).toEqual([
      '/accounts',
    ])
    expect(getSelectedMenuKeys('/transfer')).toEqual(['/transfer'])
    expect(getSelectedMenuKeys('/payees')).toEqual(['/payees'])
    expect(getSelectedMenuKeys('/approvals')).toEqual(['/approvals'])
    expect(getSelectedMenuKeys('/audit')).toEqual(['/audit'])
    expect(getSelectedMenuKeys('/unknown')).toEqual([])
  })

  it('builds breadcrumbs for known routes', () => {
    expect(getBreadcrumbTrail('/dashboard')).toEqual([
      { labelKey: 'nav.dashboard' },
    ])
    expect(getBreadcrumbTrail('/accounts')).toEqual([
      { labelKey: 'nav.accounts' },
    ])
    expect(getBreadcrumbTrail('/accounts/abc/transactions')).toEqual([
      { labelKey: 'nav.accounts', to: '/accounts' },
      { labelKey: 'breadcrumb.transactionHistory' },
    ])
    expect(getBreadcrumbTrail('/transfer')).toEqual([
      { labelKey: 'nav.transfer' },
    ])
    expect(getBreadcrumbTrail('/approvals')).toEqual([
      { labelKey: 'nav.approvals' },
    ])
    expect(getBreadcrumbTrail('/audit')).toEqual([{ labelKey: 'nav.audit' }])
    expect(getBreadcrumbTrail('/payees')).toEqual([{ labelKey: 'nav.payees' }])
    expect(getBreadcrumbTrail('/settings')).toEqual([
      { labelKey: 'nav.settings' },
    ])
    expect(getBreadcrumbTrail('/unknown')).toEqual([])
  })

  it('names menu entries with message keys so they can be translated', () => {
    expect(buildMenuRoutes('OPERATOR').map((route) => route.nameKey)).toEqual([
      'nav.dashboard',
      'nav.accounts',
      'nav.payees',
      'nav.transfer',
      'nav.approvals',
      'nav.audit',
      'nav.settings',
    ])
  })
})
