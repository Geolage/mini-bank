import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { Account, User } from '../types/api'
import { TransferPage } from './TransferPage'

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

function renderTransferPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TransferPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

let fetchMock: ReturnType<typeof vi.fn>

function mockApi(
  transferResponse: Response = jsonResponse({
    id: 'txn-1',
    reference: 'TXN-abc',
    status: 'COMPLETED',
  }),
) {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (init?.method === 'POST' && url === '/api/transfers') {
        return Promise.resolve(transferResponse)
      }

      if (url.startsWith('/api/accounts')) {
        return Promise.resolve(jsonResponse(accounts))
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    },
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: 'jwt', user: operator })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TransferPage', () => {
  it('announces a loading state while accounts load', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderTransferPage()

    expect(screen.getByText('Loading accounts…')).toBeInTheDocument()
  })

  it('selects the first account by default', async () => {
    mockApi()
    renderTransferPage()

    expect(
      await screen.findByText(/•••• 0001 · USD\s12,500\.00/),
    ).toBeInTheDocument()
  })

  it('validates the required fields', async () => {
    mockApi()
    renderTransferPage()

    await screen.findByText(/•••• 0001 · USD\s12,500\.00/)
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit transfer' }),
    )

    expect(
      await screen.findByText('Enter the recipient account number'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter a positive amount with up to 2 decimal places'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'POST'),
    ).toBe(false)
  })

  it('submits a transfer with an idempotency key and refreshes accounts', async () => {
    mockApi()
    renderTransferPage()

    await screen.findByText(/•••• 0001 · USD\s12,500\.00/)
    await userEvent.type(
      screen.getByLabelText('To account number'),
      'MB-2001-0001',
    )
    await userEvent.type(screen.getByLabelText('Amount'), '100.00')
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit transfer' }),
    )

    expect(await screen.findByText('Transfer submitted')).toBeInTheDocument()
    expect(screen.getByText('TXN-abc')).toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
    ) as [string, RequestInit]
    expect(postCall[0]).toBe('/api/transfers')
    expect((postCall[1].headers as Headers).get('Idempotency-Key')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(JSON.parse(String(postCall[1].body))).toEqual({
      fromAccountId: 'account-1',
      toAccountNumber: 'MB-2001-0001',
      amount: '100.00',
    })

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          String(input).startsWith('/api/accounts'),
        ).length,
      ).toBeGreaterThanOrEqual(2),
    )
  })

  it('reports an order queued for approval', async () => {
    mockApi(
      jsonResponse(
        { id: 'order-1', reference: 'ORD-1', status: 'PENDING_APPROVAL' },
        201,
      ),
    )
    renderTransferPage()

    await screen.findByText(/•••• 0001 · USD\s12,500\.00/)
    await userEvent.type(
      screen.getByLabelText('To account number'),
      'MB-2001-0001',
    )
    await userEvent.type(screen.getByLabelText('Amount'), '10000.00')
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit transfer' }),
    )

    expect(
      await screen.findByText('Submitted for approval'),
    ).toBeInTheDocument()
    expect(screen.getByText('ORD-1')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'View approvals' }),
    ).toBeInTheDocument()
  })

  it('shows the API error when the transfer fails', async () => {
    mockApi(
      jsonResponse({ statusCode: 400, message: 'Insufficient funds' }, 400),
    )
    renderTransferPage()

    await screen.findByText(/•••• 0001 · USD\s12,500\.00/)
    await userEvent.type(
      screen.getByLabelText('To account number'),
      'MB-2001-0001',
    )
    await userEvent.type(screen.getByLabelText('Amount'), '99999.00')
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit transfer' }),
    )

    expect(await screen.findByText('Insufficient funds')).toBeInTheDocument()
  })
})
