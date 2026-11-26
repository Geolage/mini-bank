import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from 'antd'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { Paginated, TransferOrder, User } from '../types/api'
import { ApprovalsPage } from './ApprovalsPage'

const checker: User = {
  id: 'checker-1',
  username: 'checker',
  name: 'Checker',
  email: 'checker@minibank.dev',
  role: 'CHECKER',
}

const operator: User = {
  id: 'operator-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
}

const pendingOrder: TransferOrder = {
  id: 'order-1',
  reference: 'ORD-1',
  status: 'PENDING',
  amount: '10000.00',
  currency: 'USD',
  note: 'Invoice 42',
  createdAt: '2026-11-19T10:00:00.000Z',
  decidedAt: null,
  decisionNote: null,
  maker: { id: 'operator-1', name: 'Admin', username: 'admin' },
  checker: null,
  fromAccount: {
    id: 'account-1',
    accountNumber: 'MB-1001-0001',
    type: 'CHECKING',
  },
  toAccount: {
    id: 'account-2',
    accountNumber: 'MB-2001-0001',
    type: 'CHECKING',
  },
  transactionId: null,
}

const orderPage: Paginated<TransferOrder> = {
  items: [pendingOrder],
  page: 1,
  pageSize: 20,
  total: 1,
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

let fetchMock: ReturnType<typeof vi.fn>

function mockApi(
  listResponse: Response = jsonResponse(orderPage),
  decisionResponse: Response = jsonResponse(
    { id: 'txn-1', reference: 'TXN-1', status: 'COMPLETED' },
    201,
  ),
) {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (init?.method === 'POST' && url.startsWith('/api/transfer-orders/')) {
        return Promise.resolve(decisionResponse)
      }

      if (url.startsWith('/api/transfer-orders')) {
        return Promise.resolve(listResponse)
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    },
  )
}

function listRequestUrl() {
  return fetchMock.mock.calls
    .map(([input]) => String(input))
    .find((url) => url.includes('/transfer-orders?'))
}

function renderApprovals(initialEntry = '/approvals') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <App>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <ApprovalsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </App>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: 'jwt', user: checker })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ApprovalsPage', () => {
  it('loads pending orders by default with checker actions', async () => {
    mockApi()
    renderApprovals()

    expect(await screen.findByText('ORD-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(listRequestUrl()).toBe(
      '/api/transfer-orders?page=1&pageSize=20&status=PENDING',
    )
  })

  it('approves an order with an optional note', async () => {
    mockApi()
    renderApprovals()
    await screen.findByText('ORD-1')

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(
      within(dialog).getByLabelText('Note (optional)'),
      'Checked invoice',
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Approve and post' }),
    )

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([input]) => String(input) === '/api/transfer-orders/order-1/approve',
        ),
      ).toBe(true),
    )
    const postCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === '/api/transfer-orders/order-1/approve',
    ) as [string, RequestInit]
    expect(JSON.parse(String(postCall[1].body))).toEqual({
      decisionNote: 'Checked invoice',
    })
    expect(
      await screen.findByText('Transfer approved and posted'),
    ).toBeInTheDocument()
  })

  it('requires a reason before rejecting', async () => {
    mockApi(
      jsonResponse(orderPage),
      jsonResponse(
        { id: 'order-1', reference: 'ORD-1', status: 'REJECTED' },
        201,
      ),
    )
    renderApprovals()
    await screen.findByText('ORD-1')

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Reject order' }),
    )
    expect(
      await within(dialog).findByText('Give a reason for rejecting this order'),
    ).toBeInTheDocument()

    await userEvent.type(
      within(dialog).getByLabelText('Decision note'),
      'Missing invoice',
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Reject order' }),
    )

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([input]) => String(input) === '/api/transfer-orders/order-1/reject',
        ),
      ).toBe(true),
    )
    const postCall = fetchMock.mock.calls.find(
      ([input]) => String(input) === '/api/transfer-orders/order-1/reject',
    ) as [string, RequestInit]
    expect(JSON.parse(String(postCall[1].body))).toEqual({
      decisionNote: 'Missing invoice',
    })
    expect(
      await screen.findByText('Transfer order rejected'),
    ).toBeInTheDocument()
  })

  it('lets the maker cancel their own pending order', async () => {
    useAuthStore.setState({ token: 'jwt', user: operator })
    mockApi(
      jsonResponse(orderPage),
      jsonResponse(
        { id: 'order-1', reference: 'ORD-1', status: 'CANCELLED' },
        201,
      ),
    )
    renderApprovals()
    await screen.findByText('ORD-1')

    expect(
      screen.queryByRole('button', { name: 'Approve' }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel order' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Yes, cancel it' }),
    )

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([input]) => String(input) === '/api/transfer-orders/order-1/cancel',
        ),
      ).toBe(true),
    )
    expect(
      await screen.findByText('Transfer order cancelled'),
    ).toBeInTheDocument()
  })

  it('honours an all-status filter from the URL', async () => {
    mockApi(jsonResponse({ items: [], page: 2, pageSize: 10, total: 0 }))
    renderApprovals('/approvals?status=ALL&page=2&pageSize=10')

    await waitFor(() =>
      expect(listRequestUrl()).toBe('/api/transfer-orders?page=2&pageSize=10'),
    )
    expect(
      await screen.findByText('No transfer orders match these filters.'),
    ).toBeInTheDocument()
  })

  it('renders an API error with a retry action', async () => {
    mockApi(
      jsonResponse({ statusCode: 500, message: 'Database unavailable' }, 500),
    )
    renderApprovals()

    expect(
      await screen.findByText('Could not load transfer orders'),
    ).toBeInTheDocument()
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })
})
