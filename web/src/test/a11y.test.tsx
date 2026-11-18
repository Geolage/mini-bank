import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import { usePreferencesStore } from '../app/preferencesStore'
import { AppLayout } from '../components/layout/AppLayout'
import { RequireRole } from '../components/layout/RequireRole'
import { AccountsPage } from '../pages/AccountsPage'
import { AuditPage } from '../pages/AuditPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PayeesPage } from '../pages/PayeesPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TransactionsPage } from '../pages/TransactionsPage'
import { TransferPage } from '../pages/TransferPage'
import type {
  Account,
  AccountTransaction,
  AuditLog,
  Paginated,
  User,
} from '../types/api'
import { expectNoAccessibilityViolations } from './a11y'

const operator: User = {
  id: 'operator-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
}

const viewer: User = {
  id: 'viewer-1',
  username: 'visitor',
  name: 'Visitor',
  email: 'visitor@minibank.dev',
  role: 'VIEWER',
}

const accounts: Account[] = [
  {
    id: 'account-1',
    accountNumber: 'MB-1001-0001',
    type: 'CHECKING',
    currency: 'USD',
    balance: '12500.00',
  },
  {
    id: 'account-2',
    accountNumber: 'MB-1001-0002',
    type: 'SAVINGS',
    currency: 'HKD',
    balance: '48000.00',
  },
]

const transactions: Paginated<AccountTransaction> = {
  items: [
    {
      id: 'txn-in',
      reference: 'SEED-TXN-006',
      fromAccountId: 'account-2',
      toAccountId: 'account-1',
      amount: '18.75',
      currency: 'USD',
      status: 'COMPLETED',
      note: 'Lunch',
      createdAt: '2026-10-29T11:31:58.296Z',
    },
    {
      id: 'txn-out',
      reference: 'SEED-TXN-005',
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      amount: '42.00',
      currency: 'USD',
      status: 'COMPLETED',
      note: 'Coffee beans',
      createdAt: '2026-10-29T11:31:58.295Z',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 2,
}

const auditLogs: Paginated<AuditLog> = {
  items: [
    {
      id: 'audit-1',
      actor: { id: 'operator-1', name: 'Admin', email: 'admin@minibank.dev' },
      action: 'TRANSFER_CREATED',
      resourceType: 'Transaction',
      resourceId: 'txn-out',
      metadata: { reference: 'TXN-abc' },
      createdAt: '2026-10-31T10:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
}

let fetchMock: ReturnType<typeof vi.fn>

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function stubApi() {
  fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input).split('?')[0] ?? ''

    if (init?.method === 'POST' && path === '/api/auth/login') {
      return Promise.resolve(jsonResponse({ accessToken: 'jwt', user: operator }))
    }
    if (init?.method === 'POST' && path === '/api/transfers') {
      return Promise.resolve(jsonResponse({ id: 'txn-new', reference: 'TXN-abc' }))
    }
    if (path === '/api/accounts') return Promise.resolve(jsonResponse(accounts))
    if (path === '/api/accounts/account-1') {
      return Promise.resolve(jsonResponse(accounts[0]))
    }
    if (path.endsWith('/transactions')) {
      return Promise.resolve(jsonResponse(transactions))
    }
    if (path === '/api/audit-logs') return Promise.resolve(jsonResponse(auditLogs))
    if (path === '/api/payees') {
      return Promise.resolve(
        jsonResponse({
          items: [
            {
              id: 'payee-1',
              name: 'Visitor checking',
              accountNumber: 'MB-2001-0001',
              bankName: 'MiniBank',
              note: 'Dinner splits',
              createdAt: '2026-11-05T08:00:00.000Z',
              updatedAt: '2026-11-05T09:00:00.000Z',
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        }),
      )
    }

    return Promise.reject(new Error(`Unexpected fetch: ${path}`))
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderShell(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/accounts" element={<AccountsPage />} />
            <Route
              path="/accounts/:accountId/transactions"
              element={<TransactionsPage />}
            />
            <Route
              path="/transfer"
              element={
                <RequireRole role="OPERATOR">
                  <TransferPage />
                </RequireRole>
              }
            />
            <Route
              path="/audit"
              element={
                <RequireRole role="OPERATOR">
                  <AuditPage />
                </RequireRole>
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/payees" element={<PayeesPage />} />
            <Route
              path="/forbidden"
              element={
                <RequireRole role="OPERATOR">
                  <div>Protected content</div>
                </RequireRole>
              }
            />
          </Route>
          <Route path="/missing" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
  useAuthStore.setState({ token: 'jwt', user: operator })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  stubApi()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('accessibility', () => {
  it('sign-in page is accessible', async () => {
    useAuthStore.setState({ token: null, user: null })
    const { container } = renderWithProviders(<LoginPage />)

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('accounts page inside the app shell is accessible', async () => {
    const { container } = renderShell('/accounts')

    expect(await screen.findByText('•••• 0001')).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('transaction history is accessible', async () => {
    const { container } = renderShell('/accounts/account-1/transactions')

    expect(await screen.findByText('SEED-TXN-006')).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('transfer page is accessible', async () => {
    const { container } = renderShell('/transfer')

    expect(
      await screen.findByRole('button', { name: 'Submit transfer' }),
    ).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('audit log is accessible', async () => {
    const { container } = renderShell('/audit')

    expect(await screen.findByText('TRANSFER_CREATED')).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('payees page is accessible', async () => {
    const { container } = renderShell('/payees')

    expect(await screen.findByText('Visitor checking')).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('settings page is accessible in both languages', async () => {
    for (const locale of ['en-US', 'zh-CN'] as const) {
      usePreferencesStore.setState({ locale, themeId: 'antd-blue' })
      const { container, unmount } = renderShell('/settings')

      expect(
        await screen.findByRole('heading', {
          name: locale === 'zh-CN' ? '设置' : 'Settings',
        }),
      ).toBeInTheDocument()
      await expectNoAccessibilityViolations(container)
      unmount()
    }
  })

  it('403 page is accessible', async () => {
    useAuthStore.setState({ token: 'jwt', user: viewer })
    const { container } = renderShell('/forbidden')

    expect(await screen.findByText('403')).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('404 page is accessible', async () => {
    const { container } = renderShell('/missing')

    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })

  it('exposes form validation errors to assistive tech', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ token: null, user: null })
    renderWithProviders(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const identifier = screen.getByLabelText('Account')
    expect(
      await screen.findByText('Account is required'),
    ).toBeInTheDocument()
    expect(identifier).toHaveAttribute('aria-invalid', 'true')
    const describedBy = identifier.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(
      describedBy.some((id) =>
        document.getElementById(id)?.textContent?.includes('Account is required'),
      ),
    ).toBe(true)
  })

  it('keeps the skip link first in the tab order and pointed at main content', async () => {
    const user = userEvent.setup()
    renderShell('/accounts')

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    await user.tab()

    expect(document.activeElement).toBe(skipLink)
    expect(skipLink.getAttribute('href')).toBe('#main-content')
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('announces loading and empty states', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderShell('/audit')

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading audit logs…')
  })
})
