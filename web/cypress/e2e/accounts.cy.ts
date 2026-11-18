/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

describe('accounts', () => {
  it('logs in with the admin demo account and lists balances', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)
    cy.visit('/accounts')

    cy.contains('h1', 'Accounts').should('be.visible')
    cy.contains(/USD\s12,500\.00/).should('be.visible')
    cy.contains(/HKD\s48,000\.00/).should('be.visible')
    cy.screenshot('accounts-page', { capture: 'viewport' })
  })
})
