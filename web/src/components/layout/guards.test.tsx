import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../app/authStore'
import type { User } from '../../types/api'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireRole } from './RequireRole'

const operator: User = {
  id: 'operator-1',
  name: 'Alex Chen',
  email: 'operator@minibank.dev',
  role: 'OPERATOR',
}

const viewer: User = {
  id: 'viewer-1',
  name: 'Jamie Lee',
  email: 'viewer@minibank.dev',
  role: 'VIEWER',
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

beforeEach(() => {
  localStorage.clear()
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
    expect(screen.getByText(/requires the operator role/)).toBeInTheDocument()
  })
})
