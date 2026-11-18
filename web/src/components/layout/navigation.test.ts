import { describe, expect, it } from 'vitest'
import {
  buildMenuRoutes,
  getBreadcrumbTrail,
  getSelectedMenuKeys,
} from './navigation'

describe('navigation', () => {
  it('limits viewers to account navigation', () => {
    expect(buildMenuRoutes('VIEWER').map((route) => route.path)).toEqual([
      '/accounts',
    ])
    expect(buildMenuRoutes(null).map((route) => route.path)).toEqual([
      '/accounts',
    ])
  })

  it('adds transfer and audit entries for operators', () => {
    expect(buildMenuRoutes('OPERATOR').map((route) => route.path)).toEqual([
      '/accounts',
      '/transfer',
      '/audit',
    ])
  })

  it('keeps accounts selected on the transaction history route', () => {
    expect(getSelectedMenuKeys('/accounts')).toEqual(['/accounts'])
    expect(getSelectedMenuKeys('/accounts/abc/transactions')).toEqual([
      '/accounts',
    ])
    expect(getSelectedMenuKeys('/transfer')).toEqual(['/transfer'])
    expect(getSelectedMenuKeys('/audit')).toEqual(['/audit'])
    expect(getSelectedMenuKeys('/unknown')).toEqual([])
  })

  it('builds breadcrumbs only for known routes', () => {
    expect(getBreadcrumbTrail('/accounts')).toEqual([{ label: 'Accounts' }])
    expect(getBreadcrumbTrail('/accounts/abc/transactions')).toEqual([
      { label: 'Accounts', to: '/accounts' },
      { label: 'Transaction history' },
    ])
    expect(getBreadcrumbTrail('/transfer')).toEqual([{ label: 'Transfer' }])
    expect(getBreadcrumbTrail('/audit')).toEqual([{ label: 'Audit log' }])
    expect(getBreadcrumbTrail('/unknown')).toEqual([])
  })
})
