import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { DashboardOverview } from '../types/api'
import { DashboardPage } from './DashboardPage'

const overview: DashboardOverview = {
  totals: [
    { currency: 'USD', balance: '12500.00', accounts: 1 },
    { currency: 'HKD', balance: '48000.00', accounts: 1 },
  ],
  payeeCount: 2,
  month: [
    { currency: 'USD', incoming: '18.75', outgoing: '292.00' },
    { currency: 'HKD', incoming: '0.00', outgoing: '0.00' },
  ],
  series: (['USD', 'HKD'] as const).map((currency) => ({
    currency,
    points: Array.from({ length: 30 }, (_, index) => ({
      date: `2026-10-${String(index + 1).padStart(2, '0')}`,
      incoming: index === 29 ? '18.75' : '0.00',
      outgoing: index === 29 ? '42.00' : '0.00',
    })),
  })),
  recent: [
    {
      id: 'txn-1',
      reference: 'SEED-TXN-005',
      direction: 'OUTGOING',
      amount: '42.00',
      currency: 'USD',
      counterpartyAccountNumber: 'MB-2001-0001',
      accountId: 'account-1',
      note: 'Coffee beans',
      createdAt: '2026-10-31T10:00:00.000Z',
    },
  ],
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    token: 'jwt',
    user: {
      id: 'user-1',
      username: 'admin',
      name: 'Admin',
      email: 'admin@minibank.dev',
      role: 'OPERATOR',
    },
    sessionExpired: false,
  })
  fetchMock = vi.fn().mockResolvedValue(jsonResponse(overview))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DashboardPage', () => {
  it('greets the user and shows one balance card per currency', async () => {
    renderDashboard()

    expect(
      await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Admin/ }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/USD\s12,500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/HKD\s48,000\.00/)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('switches the cash-flow currency', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByText(/USD\s12,500\.00/)

    expect(screen.getByText(/\+USD\s18\.75/)).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Currency' }))
    await user.click(await screen.findByTitle('HKD'))

    expect(await screen.findByText(/\+HKD\s0\.00/)).toBeInTheDocument()
    expect(screen.queryByText(/\+USD\s18\.75/)).not.toBeInTheDocument()
  })

  it('reads out the hovered day from the chart', async () => {
    const { container } = renderDashboard()
    await screen.findByText(/USD\s12,500\.00/)

    const groups = container.querySelectorAll('svg rect[tabindex="0"]')
    expect(groups).toHaveLength(30)

    fireEvent.mouseOver(groups[29])
    expect(screen.getByText(/Oct 30 · In USD\s18\.75 · Out USD\s42\.00/)).toBeInTheDocument()

    fireEvent.mouseOut(groups[29])
    expect(
      screen.getByText('Hover or focus a day for details'),
    ).toBeInTheDocument()
  })

  it('links recent activity to the account statement', async () => {
    renderDashboard()

    const link = await screen.findByRole('link', { name: 'View transactions' })
    expect(link).toHaveAttribute('href', '/accounts/account-1/transactions')
    expect(screen.getByText('SEED-TXN-005')).toBeInTheDocument()
    expect(screen.getByText(/-USD\s42\.00/)).toBeInTheDocument()
  })
})
