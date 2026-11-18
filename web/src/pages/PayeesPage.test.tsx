import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from 'antd'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { Paginated, Payee } from '../types/api'
import { PayeesPage } from './PayeesPage'

const payee: Payee = {
  id: 'payee-1',
  name: 'Visitor checking',
  accountNumber: 'MB-2001-0001',
  bankName: 'MiniBank',
  note: 'Dinner splits',
  createdAt: '2026-11-05T08:00:00.000Z',
  updatedAt: '2026-11-05T09:00:00.000Z',
}

const second: Payee = {
  ...payee,
  id: 'payee-2',
  name: 'Visitor HKD',
  accountNumber: 'MB-2001-0002',
  note: null,
}

const page: Paginated<Payee> = {
  items: [payee, second],
  page: 1,
  pageSize: 10,
  total: 2,
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function TransferProbe() {
  const [params] = useSearchParams()
  return <div>transfer target {params.get('to')}</div>
}

function renderPayees(initialEntry = '/payees') {
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
            <Route path="/payees" element={<PayeesPage />} />
            <Route path="/transfer" element={<TransferProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </App>,
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
  fetchMock = vi.fn().mockResolvedValue(jsonResponse(page))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PayeesPage', () => {
  it('lists saved payees with masked accounts', async () => {
    renderPayees()

    expect(await screen.findByText('Visitor checking')).toBeInTheDocument()
    expect(screen.getByText('•••• 0001')).toBeInTheDocument()
    expect(screen.getByText('Visitor HKD')).toBeInTheDocument()
  })

  it('sends the search term to the API', async () => {
    const user = userEvent.setup()
    renderPayees()
    await screen.findByText('Visitor checking')

    await user.type(
      screen.getByPlaceholderText('Search name, account or bank'),
      'hkd{enter}',
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('q=hkd'),
        expect.anything(),
      ),
    )
  })

  it('creates a payee from the drawer', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve(jsonResponse({ ...payee, id: 'payee-3' }, 201))
        }
        return Promise.resolve(jsonResponse(page))
      },
    )
    renderPayees()
    await screen.findByText('Visitor checking')

    await user.click(screen.getByRole('button', { name: 'New payee' }))
    await user.type(screen.getByLabelText('Display name'), 'Landlord')
    await user.type(screen.getByLabelText('Account number'), 'MB-1001-0002')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(post).toBeTruthy()
      expect(
        JSON.parse((post![1] as RequestInit).body as string),
      ).toMatchObject({
        name: 'Landlord',
        accountNumber: 'MB-1001-0002',
      })
    })
    expect(await screen.findByText('Payee saved')).toBeInTheDocument()
  })

  it('rejects a malformed account number before calling the API', async () => {
    const user = userEvent.setup()
    renderPayees()
    await screen.findByText('Visitor checking')

    await user.click(screen.getByRole('button', { name: 'New payee' }))
    await user.type(screen.getByLabelText('Display name'), 'Bad')
    await user.type(screen.getByLabelText('Account number'), '12345')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Use the MB-0000-0000 format'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(false)
  })

  it('deletes optimistically and offers undo', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse(payee))
        }
        if (init?.method === 'POST') {
          return Promise.resolve(jsonResponse(payee, 201))
        }
        return Promise.resolve(jsonResponse(page))
      },
    )
    renderPayees()
    await screen.findByText('Visitor checking')

    const row = screen.getByText('Visitor checking').closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Delete' }))

    expect(
      await screen.findByText('Deleted “Visitor checking”'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
        ),
      ).toBe(true),
    )

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
        ),
      ).toBe(true),
    )
  })

  it('bulk deletes the selected rows', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse(payee))
        }
        return Promise.resolve(jsonResponse(page))
      },
    )
    renderPayees()
    await screen.findByText('Visitor checking')

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])
    await user.click(checkboxes[2])
    await user.click(screen.getByRole('button', { name: 'Delete selected' }))

    await waitFor(() => {
      const deletes = fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
      )
      expect(deletes).toHaveLength(2)
    })
  })

  it('opens the detail drawer and prefills a transfer', async () => {
    const user = userEvent.setup()
    renderPayees()
    await screen.findByText('Visitor checking')

    await user.click(screen.getByText('Visitor checking'))

    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('MB-2001-0001')).toBeInTheDocument()

    await user.click(
      within(drawer).getByRole('button', { name: 'Transfer to this payee' }),
    )

    expect(
      await screen.findByText('transfer target MB-2001-0001'),
    ).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))
    renderPayees()

    expect(await screen.findByText('Could not load payees')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })
})
