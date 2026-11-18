import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import type { User } from '../types/api'
import { LoginPage } from './LoginPage'

const operator: User = {
  id: 'operator-1',
  name: 'Alex Chen',
  email: 'operator@minibank.dev',
  role: 'OPERATOR',
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

let fetchMock: ReturnType<typeof vi.fn>

function mockLogin(response: Response) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    if (String(input) === '/api/auth/login') return Promise.resolve(response)
    return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
  })
}

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accounts" element={<h1>Accounts screen</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('shows validation messages when submitted empty', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
  })

  it('fills the operator demo credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Use operator' }))

    expect(screen.getByLabelText('Email')).toHaveValue('operator@minibank.dev')
    expect(screen.getByLabelText('Password')).toHaveValue('Password123!')
  })

  it('stores the session and redirects after a successful sign-in', async () => {
    const user = userEvent.setup()
    mockLogin(jsonResponse({ accessToken: 'jwt-token', user: operator }))
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'operator@minibank.dev')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Accounts screen' })).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('mini-bank.auth') ?? '{}')).toMatchObject({
      token: 'jwt-token',
    })
  })

  it('shows the API error when sign-in fails', async () => {
    const user = userEvent.setup()
    mockLogin(
      jsonResponse({ statusCode: 401, message: 'Invalid credentials' }, 401),
    )
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'operator@minibank.dev')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('reports an unreachable API', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'operator@minibank.dev')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Cannot reach the API. Make sure the backend is running.'),
    ).toBeInTheDocument()
  })
})
