import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from 'antd'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { Account, AccountTransaction, Paginated } from '../types/api'
import { TransactionsPage } from './TransactionsPage'

const account: Account = {
  id: 'account-1',
  accountNumber: 'MB-1001-0001',
  type: 'CHECKING',
  currency: 'USD',
  balance: '12500.00',
}

const incoming: AccountTransaction = {
  id: 'txn-in',
  reference: 'SEED-TXN-006',
  fromAccountId: 'account-2',
  toAccountId: 'account-1',
  amount: '18.75',
  currency: 'USD',
  status: 'COMPLETED',
  note: 'Lunch',
  createdAt: '2026-10-29T11:31:58.296Z',
}

const outgoing: AccountTransaction = {
  id: 'txn-out',
  reference: 'SEED-TXN-005',
  fromAccountId: 'account-1',
  toAccountId: 'account-2',
  amount: '42.00',
  currency: 'USD',
  status: 'COMPLETED',
  note: 'Coffee beans',
  createdAt: '2026-10-29T11:31:58.295Z',
}

const page: Paginated<AccountTransaction> = {
  items: [incoming, outgoing],
  page: 1,
  pageSize: 20,
  total: 2,
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function renderTransactionsPage(
  initialEntry = '/accounts/account-1/transactions',
) {
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
          <Routes>
            <Route path="/accounts" element={<div>Accounts overview</div>} />
            <Route
              path="/accounts/:accountId/transactions"
              element={<TransactionsPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </App>,
  )
}

let fetchMock: ReturnType<typeof vi.fn>

function mockApi(
  transactionResponse: Response = jsonResponse(page),
  accountResponse: Response = jsonResponse(account),
) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/accounts/account-1') {
      return Promise.resolve(accountResponse)
    }
    if (url.startsWith('/api/accounts/account-1/transactions')) {
      return Promise.resolve(transactionResponse)
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
}

function transactionRequestUrl() {
  return fetchMock.mock.calls
    .map(([input]) => String(input))
    .find((url) => url.includes('/transactions'))
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TransactionsPage', () => {
  it('announces a loading state', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderTransactionsPage()

    expect(screen.getByText('Loading transactions…')).toBeInTheDocument()
  })

  it('renders the account summary and statement rows', async () => {
    mockApi()
    renderTransactionsPage()

    expect(await screen.findByText('SEED-TXN-006')).toBeInTheDocument()
    expect(screen.getByText('SEED-TXN-005')).toBeInTheDocument()
    expect(screen.getByText('•••• 0001')).toBeInTheDocument()
    expect(screen.getByText(/USD\s12,500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\+USD\s18\.75/)).toBeInTheDocument()
    expect(screen.getByText(/-USD\s42\.00/)).toBeInTheDocument()
    expect(screen.getByText('Incoming')).toBeInTheDocument()
    expect(screen.getByText('Outgoing')).toBeInTheDocument()

    expect(transactionRequestUrl()).toBe(
      '/api/accounts/account-1/transactions?page=1&pageSize=20',
    )
  })

  it('sends URL filters to the API', async () => {
    mockApi(
      jsonResponse({
        items: [outgoing],
        page: 2,
        pageSize: 10,
        total: 25,
      }),
    )

    renderTransactionsPage(
      '/accounts/account-1/transactions?page=2&pageSize=10&type=OUTGOING&from=2026-10-01&to=2026-10-31',
    )

    await waitFor(() =>
      expect(transactionRequestUrl()).toBe(
        '/api/accounts/account-1/transactions?page=2&pageSize=10&type=OUTGOING&from=2026-10-01&to=2026-10-31',
      ),
    )
  })

  it('renders an empty state when no transactions match', async () => {
    mockApi(jsonResponse({ items: [], page: 1, pageSize: 20, total: 0 }))
    renderTransactionsPage()

    expect(
      await screen.findByText('No transactions match these filters.'),
    ).toBeInTheDocument()
  })

  it('renders an API error with a retry action', async () => {
    mockApi(
      jsonResponse({ statusCode: 500, message: 'Database unavailable' }, 500),
    )
    renderTransactionsPage()

    expect(
      await screen.findByText('Could not load transactions'),
    ).toBeInTheDocument()
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('navigates back to the accounts page', async () => {
    mockApi()
    renderTransactionsPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to accounts' }),
    )

    expect(screen.getByText('Accounts overview')).toBeInTheDocument()
  })

  it('exports every filtered row as a CSV download', async () => {
    mockApi()
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:mock'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    renderTransactionsPage()
    await screen.findByText('SEED-TXN-006')

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }))

    await waitFor(() => expect(blobs).toHaveLength(1))
    // Blob.text() strips the BOM during UTF-8 decoding, so check the raw bytes.
    const bytes = new Uint8Array(await blobs[0].arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const text = await blobs[0].text()
    expect(text).toContain('Reference')
    expect(text).toContain('SEED-TXN-006')
    expect(text).toContain('SEED-TXN-005')
    expect(text).toContain('Lunch')
    expect(await screen.findByText('Exported 2 rows')).toBeInTheDocument()
  })

  it('prints a statement sheet with all filtered rows', async () => {
    mockApi()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { container } = renderTransactionsPage()
    await screen.findByText('SEED-TXN-006')

    await userEvent.click(
      screen.getByRole('button', { name: 'Print statement' }),
    )

    await waitFor(() => expect(printSpy).toHaveBeenCalled())
    const sheet = container.querySelector('.print-sheet')
    expect(sheet).not.toBeNull()
    expect(sheet!.textContent).toContain('Account statement')
    expect(sheet!.textContent).toContain('SEED-TXN-006')
    expect(sheet!.textContent).toContain('SEED-TXN-005')
  })
})
