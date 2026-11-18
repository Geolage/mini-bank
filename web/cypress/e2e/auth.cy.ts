/// <reference types="cypress" />

function signIn(email: string) {
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type('Password123!')
  cy.contains('button', 'Sign in').click()
}

describe('authentication', () => {
  it('returns to the attempted route after signing in', () => {
    cy.viewport(1180, 720)
    cy.visit('/audit')
    cy.location('pathname').should('eq', '/login')

    signIn('operator@minibank.dev')

    cy.location('pathname').should('eq', '/audit')
    cy.contains('h1', 'Audit log').should('be.visible')
  })

  it('signs out from the user menu', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    signIn('operator@minibank.dev')
    cy.location('pathname').should('eq', '/accounts')

    cy.get('button[aria-label="Account menu"]').click()
    cy.contains('Sign out').click()

    cy.location('pathname').should('eq', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('mini-bank.auth')).to.equal(null)
    })
  })

  it('clears cached account data between sessions', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    signIn('operator@minibank.dev')
    cy.contains('$12,500.00').should('be.visible')

    cy.get('button[aria-label="Account menu"]').click()
    cy.contains('Sign out').click()
    cy.location('pathname').should('eq', '/login')

    signIn('viewer@minibank.dev')
    cy.location('pathname').should('eq', '/accounts')
    cy.contains('$3,200.00').should('be.visible')
    cy.contains('$12,500.00').should('not.exist')
  })

  it('shows an API error for invalid credentials and stays on login', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    cy.get('input[name="email"]').type('operator@minibank.dev')
    cy.get('input[name="password"]').type('WrongPassword!')
    cy.contains('button', 'Sign in').click()

    cy.contains('Invalid email or password').should('be.visible')
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
            name: 'Expired User',
            email: 'expired@minibank.dev',
            role: 'VIEWER',
          },
        }),
      )
    })

    cy.visit('/accounts')
    cy.location('pathname').should('eq', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('mini-bank.auth')).to.equal(null)
    })
  })
})
