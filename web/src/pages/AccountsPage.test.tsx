import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { Account, User } from '../types/api'
import { AccountsPage } from './AccountsPage'

const operator: User = {
  id: 'operator-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
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

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function renderAccountsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AccountsPage', () => {
  it('announces a loading state while accounts load', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    renderAccountsPage()

    expect(screen.getByText('Loading accounts…')).toBeInTheDocument()
  })

  it('renders account balances and transaction links', async () => {
    localStorage.setItem(
      'mini-bank.auth',
      JSON.stringify({ token: 'jwt', user: operator }),
    )
    useAuthStore.setState({ token: 'jwt', user: operator })
    fetchMock.mockResolvedValue(jsonResponse(accounts))

    renderAccountsPage()

    expect(await screen.findByText(/USD\s12,500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/HKD\s48,000\.00/)).toBeInTheDocument()
    expect(screen.getByText('•••• 0001')).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: /view transactions/i })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute(
      'href',
      '/accounts/account-1/transactions',
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer jwt')
  })

  it('refetches when Refresh is clicked', async () => {
    fetchMock.mockResolvedValue(jsonResponse(accounts))
    renderAccountsPage()

    await screen.findByText(/USD\s12,500\.00/)
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('renders an empty state', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))
    renderAccountsPage()

    expect(await screen.findByText('No accounts yet')).toBeInTheDocument()
    expect(
      screen.getByText('Seed the database to create demo accounts.'),
    ).toBeInTheDocument()
  })

  it('renders the API error with a retry action', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { statusCode: 500, message: 'Database unavailable' },
        500,
      ),
    )
    renderAccountsPage()

    expect(
      await screen.findByText('Could not load accounts'),
    ).toBeInTheDocument()
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('clears the session when the API returns 401', async () => {
    localStorage.setItem(
      'mini-bank.auth',
      JSON.stringify({ token: 'expired', user: operator }),
    )
    useAuthStore.setState({ token: 'expired', user: operator })
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401),
    )

    renderAccountsPage()

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull())
    expect(localStorage.getItem('mini-bank.auth')).toBeNull()
  })
})
