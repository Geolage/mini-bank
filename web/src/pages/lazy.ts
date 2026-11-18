import { lazy } from 'react'

export const AccountsPage = lazy(() =>
  import('./AccountsPage').then((module) => ({ default: module.AccountsPage })),
)

export const AuditPage = lazy(() =>
  import('./AuditPage').then((module) => ({ default: module.AuditPage })),
)

export const DashboardPage = lazy(() =>
  import('./DashboardPage').then((module) => ({ default: module.DashboardPage })),
)

export const LoginPage = lazy(() =>
  import('./LoginPage').then((module) => ({ default: module.LoginPage })),
)

export const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

export const PayeesPage = lazy(() =>
  import('./PayeesPage').then((module) => ({ default: module.PayeesPage })),
)

export const SettingsPage = lazy(() =>
  import('./SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

export const TransactionsPage = lazy(() =>
  import('./TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  })),
)

export const TransferPage = lazy(() =>
  import('./TransferPage').then((module) => ({ default: module.TransferPage })),
)
