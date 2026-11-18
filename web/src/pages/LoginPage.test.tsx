import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../app/authStore'
import { getConfigProps } from '../app/antdConfig'
import { usePreferencesStore } from '../app/preferencesStore'
import type { User } from '../types/api'
import { LoginPage } from './LoginPage'

const admin: User = {
  id: 'admin-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
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
  const { locale, themeId } = usePreferencesStore.getState()

  return render(
    <ConfigProvider {...getConfigProps(locale, themeId)}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accounts" element={<h1>Accounts screen</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ConfigProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null })
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
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

    expect(await screen.findByText('Account is required')).toBeInTheDocument()
    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
  })

  it('fills the admin demo credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Use admin' }))

    expect(screen.getByLabelText('Account')).toHaveValue('admin')
    expect(screen.getByLabelText('Password')).toHaveValue('11111111')
  })

  it('stores the session and redirects after a successful sign-in', async () => {
    const user = userEvent.setup()
    mockLogin(jsonResponse({ accessToken: 'jwt-token', user: admin }))
    renderLoginPage()

    await user.type(screen.getByLabelText('Account'), 'admin')
    await user.type(screen.getByLabelText('Password'), '11111111')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { name: 'Accounts screen' }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('mini-bank.auth') ?? '{}')).toMatchObject({
      token: 'jwt-token',
    })

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body).toEqual({ identifier: 'admin', password: '11111111' })
  })

  it('shows the API error when sign-in fails', async () => {
    const user = userEvent.setup()
    mockLogin(
      jsonResponse({ statusCode: 401, message: 'Invalid username or password' }, 401),
    )
    renderLoginPage()

    await user.type(screen.getByLabelText('Account'), 'admin')
    await user.type(screen.getByLabelText('Password'), '00000000')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('reports an unreachable API', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderLoginPage()

    await user.type(screen.getByLabelText('Account'), 'admin')
    await user.type(screen.getByLabelText('Password'), '11111111')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Cannot reach the API. Make sure the backend is running.'),
    ).toBeInTheDocument()
  })

  it('renders Chinese labels when the locale is zh-CN', async () => {
    usePreferencesStore.setState({ locale: 'zh-CN', themeId: 'antd-blue' })
    renderLoginPage()

    expect(await screen.findByRole('heading', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByLabelText('账号')).toHaveAttribute(
      'placeholder',
      '请输入账号',
    )
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'placeholder',
      '请输入密码',
    )
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '填入管理员' })).toBeInTheDocument()
  })
})
