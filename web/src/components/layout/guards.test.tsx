import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../app/authStore'
import { usePreferencesStore } from '../../app/preferencesStore'
import type { User } from '../../types/api'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireRole } from './RequireRole'

const operator: User = {
  id: 'operator-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
}

const viewer: User = {
  id: 'viewer-1',
  username: 'visitor',
  name: 'Visitor',
  email: 'visitor@minibank.dev',
  role: 'VIEWER',
}

const checker: User = {
  id: 'checker-1',
  username: 'checker',
  name: 'Checker',
  email: 'checker@minibank.dev',
  role: 'CHECKER',
}

function renderAuditRoute() {
  return render(
    <MemoryRouter initialEntries={['/audit']}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <RequireRole role="OPERATOR">
                <div>Audit content</div>
              </RequireRole>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

function renderApprovalsRoute() {
  return render(
    <MemoryRouter initialEntries={['/approvals']}>
      <Routes>
        <Route
          path="/approvals"
          element={
            <RequireRole role={['OPERATOR', 'CHECKER']}>
              <div>Approvals content</div>
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
  useAuthStore.setState({ token: null, user: null })
})

describe('route guards', () => {
  it('redirects unauthenticated users to login', () => {
    renderAuditRoute()

    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders protected content for a signed-in operator', () => {
    useAuthStore.setState({ token: 'jwt', user: operator })
    renderAuditRoute()

    expect(screen.getByText('Audit content')).toBeInTheDocument()
  })

  it('renders 403 for a signed-in viewer', () => {
    useAuthStore.setState({ token: 'jwt', user: viewer })
    renderAuditRoute()

    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.getByText(/requires the Operator role/)).toBeInTheDocument()
  })

  it('lets a checker reach a multi-role route', () => {
    useAuthStore.setState({ token: 'jwt', user: checker })
    renderApprovalsRoute()

    expect(screen.getByText('Approvals content')).toBeInTheDocument()
  })

  it('renders 403 with every allowed role for a viewer', () => {
    useAuthStore.setState({ token: 'jwt', user: viewer })
    renderApprovalsRoute()

    expect(screen.getByText('403')).toBeInTheDocument()
    expect(
      screen.getByText(/requires the Operator \/ Checker role/),
    ).toBeInTheDocument()
  })
})
