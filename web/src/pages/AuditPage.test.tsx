import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { AuditLog, Paginated } from '../types/api'
import { AuditPage } from './AuditPage'

const log: AuditLog = {
  id: 'audit-1',
  actor: {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'operator@minibank.dev',
  },
  action: 'TRANSFER_CREATED',
  resourceType: 'Transaction',
  resourceId: 'txn-1',
  metadata: { reference: 'TXN-abc' },
  createdAt: '2026-10-31T10:00:00.000Z',
}

const page: Paginated<AuditLog> = {
  items: [log],
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

function renderAuditPage(initialEntry = '/audit') {
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
          <Route path="/audit" element={<AuditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: 'jwt', user: null })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AuditPage', () => {
  it('announces a loading state', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderAuditPage()

    expect(screen.getByText('Loading audit logs…')).toBeInTheDocument()
  })

  it('renders audit entries with actor and metadata', async () => {
    fetchMock.mockResolvedValue(jsonResponse(page))
    renderAuditPage()

    expect(await screen.findByText('Alex Chen')).toBeInTheDocument()
    expect(screen.getByText('operator@minibank.dev')).toBeInTheDocument()
    expect(screen.getByText('TRANSFER_CREATED')).toBeInTheDocument()
    expect(screen.getByText('Transaction · txn-1…')).toBeInTheDocument()
    expect(screen.getByText('{"reference":"TXN-abc"}')).toBeInTheDocument()

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      '/api/audit-logs?page=1&pageSize=20',
    )
  })

  it('sends URL filters to the API', async () => {
    fetchMock.mockResolvedValue(jsonResponse(page))
    renderAuditPage('/audit?action=TRANSFER_CREATED&page=2&pageSize=10')

    await waitFor(() =>
      expect(String(fetchMock.mock.calls[0][0])).toBe(
        '/api/audit-logs?page=2&pageSize=10&action=TRANSFER_CREATED',
      ),
    )
  })

  it('renders an empty state', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], page: 1, pageSize: 20, total: 0 }),
    )
    renderAuditPage()

    expect(
      await screen.findByText('No audit entries match these filters.'),
    ).toBeInTheDocument()
  })

  it('renders an API error with a retry action', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 500, message: 'Database unavailable' }, 500),
    )
    renderAuditPage()

    expect(
      await screen.findByText('Could not load audit logs'),
    ).toBeInTheDocument()
    expect(screen.getByText('Database unavailable')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })
})
