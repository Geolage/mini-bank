/// <reference types="cypress" />

describe('login', () => {
  it('signs in with the operator demo account and shows accounts', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    cy.screenshot('login-page', { capture: 'viewport' })

    cy.get('input[name="email"]').type('operator@minibank.dev')
    cy.get('input[name="password"]').type('Password123!')
    cy.contains('button', 'Sign in').click()

    cy.location('pathname').should('eq', '/accounts')
    cy.contains('h1', 'Accounts').should('be.visible')
  })
})
