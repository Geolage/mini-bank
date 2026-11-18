import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { RequireRole } from './components/layout/RequireRole'
import { RouteFallback } from './components/layout/RouteFallback'
import {
  AccountsPage,
  AuditPage,
  LoginPage,
  NotFoundPage,
  TransactionsPage,
  TransferPage,
} from './pages/lazy'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/accounts" replace /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'accounts/:accountId/transactions', element: <TransactionsPage /> },
      {
        path: 'transfer',
        element: (
          <RequireRole role="OPERATOR">
            <TransferPage />
          </RequireRole>
        ),
      },
      {
        path: 'audit',
        element: (
          <RequireRole role="OPERATOR">
            <AuditPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
