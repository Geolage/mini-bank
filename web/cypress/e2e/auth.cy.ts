/// <reference types="cypress" />

import { ADMIN, VISITOR, fillLogin, signIn } from '../support/session'

describe('authentication', () => {
  it('returns to the attempted route after signing in', () => {
    cy.viewport(1180, 720)
    cy.visit('/audit')
    cy.location('pathname').should('eq', '/login')

    fillLogin(ADMIN.identifier, ADMIN.password)

    cy.location('pathname').should('eq', '/audit')
    cy.contains('h1', 'Audit log').should('be.visible')
  })

  it('signs in with the email address too', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')

    fillLogin('ADMIN@minibank.dev', ADMIN.password)

    cy.location('pathname').should('eq', '/dashboard')
    cy.contains('h1', /Good (morning|afternoon|evening), Admin/).should(
      'be.visible',
    )
  })

  it('signs out from the user menu', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('button[aria-label="Account menu"]').click()
    cy.contains('Sign out').click()

    cy.location('pathname').should('eq', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('mini-bank.auth')).to.equal(null)
    })
  })

  it('clears cached account data between sessions', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)
    cy.contains(/USD\s12,500\.00/).should('be.visible')

    cy.get('button[aria-label="Account menu"]').click()
    cy.contains('Sign out').click()
    cy.location('pathname').should('eq', '/login')

    signIn(VISITOR)
    cy.contains(/USD\s3,200\.00/).should('be.visible')
    cy.contains(/USD\s12,500\.00/).should('not.exist')
  })

  it('shows an API error for invalid credentials and stays on login', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    fillLogin('no-such-user', 'WrongPassword!')

    cy.contains('Invalid username or password').should('be.visible')
    cy.location('pathname').should('eq', '/login')
  })

  it('clears an invalid session and redirects on 401', () => {
    cy.visit('/login')
    cy.window().then((win) => {
      win.localStorage.setItem(
        'mini-bank.auth',
        JSON.stringify({
          token: 'invalid-token',
          user: {
            id: 'expired',
            username: 'expired',
            name: 'Expired User',
            email: 'expired@minibank.dev',
            role: 'VIEWER',
          },
        }),
      )
    })

    cy.visit('/accounts')
    cy.location('pathname').should('eq', '/login')
    cy.contains('Your session has expired. Please sign in again.').should(
      'be.visible',
    )
    cy.window().then((win) => {
      expect(win.localStorage.getItem('mini-bank.auth')).to.equal(null)
    })
  })
})
