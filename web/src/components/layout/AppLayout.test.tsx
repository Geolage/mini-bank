import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../app/authStore'
import { usePreferencesStore } from '../../app/preferencesStore'
import { AppProviders } from '../../app/AppProviders'
import { AppLayout } from './AppLayout'
import type { User } from '../../types/api'

const admin: User = {
  id: 'u1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
}

function renderShell() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/accounts']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="accounts" element={<h1>Accounts page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
  useAuthStore.setState({ token: 'jwt', user: admin })
})

describe('AppLayout', () => {
  it('puts the theme, language and account controls in one header row', () => {
    renderShell()

    const language = screen.getByRole('button', { name: 'Language: English' })
    const theme = screen.getByRole('button', { name: 'Theme: Calm Blue' })
    const account = screen.getByRole('button', { name: 'Account menu' })

    const row = language.closest('.ant-flex')
    expect(row).not.toBeNull()
    expect(row).toContainElement(theme)
    expect(row).toContainElement(account)
  })

  it('translates the menu when the locale changes', async () => {
    usePreferencesStore.setState({ locale: 'zh-CN', themeId: 'antd-blue' })
    renderShell()

    expect(await screen.findByRole('menuitem', { name: /账户/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /转账/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /审计日志/ })).toBeInTheDocument()
  })

  it('keeps operator-only entries out of a viewer menu', async () => {
    useAuthStore.setState({
      token: 'jwt',
      user: { ...admin, username: 'visitor', name: 'Visitor', role: 'VIEWER' },
    })
    renderShell()

    expect(await screen.findByRole('menuitem', { name: /Accounts/ })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Transfer/ })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: /Audit log/ })).toBeNull()
  })

  it('points the logo at the accounts page', async () => {
    renderShell()

    await screen.findByRole('menuitem', { name: /Accounts/ })
    expect(screen.getByRole('link', { name: /MiniBank/ })).toHaveAttribute(
      'href',
      '/accounts',
    )
  })
})
