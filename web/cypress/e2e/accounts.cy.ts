/// <reference types="cypress" />

describe('accounts', () => {
  it('logs in with the operator demo account and lists balances', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')

    cy.get('input[name="email"]').type('operator@minibank.dev')
    cy.get('input[name="password"]').type('Password123!')
    cy.contains('button', 'Sign in').click()

    cy.location('pathname').should('eq', '/accounts')
    cy.contains('h1', 'Accounts').should('be.visible')
    cy.contains('$12,500.00').should('be.visible')
    cy.contains('HK$48,000.00').should('be.visible')
    cy.screenshot('accounts-page', { capture: 'viewport' })
  })
})
