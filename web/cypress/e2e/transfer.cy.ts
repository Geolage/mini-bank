/// <reference types="cypress" />

import { ADMIN, VISITOR, signIn } from '../support/session'

describe('transfer', () => {
  it('submits with an idempotency key and refreshes accounts', () => {
    cy.viewport(1180, 720)

    // The POST is stubbed so the seeded demo balances stay deterministic for the
    // rest of the suite; the real transfer path is covered by API e2e + live checks.
    let accountsRequests = 0
    cy.intercept('GET', '/api/accounts', () => {
      accountsRequests += 1
    }).as('accounts')
    cy.intercept('POST', '/api/transfers', {
      statusCode: 201,
      body: {
        id: 'cypress-txn',
        reference: 'TXN-CYPRESS-1',
        status: 'COMPLETED',
      },
    }).as('transfer')

    signIn(ADMIN)
    cy.get('.ant-menu').contains('a', 'Transfer').click()
    cy.location('pathname').should('eq', '/transfer')
    cy.contains('•••• 0001').should('be.visible')

    cy.get('#toAccountNumber').type('MB-2001-0001')
    cy.get('#amount').type('100.00')
    cy.contains('button', 'Submit transfer').click()

    cy.wait('@transfer')
      .its('request.headers')
      .should('have.property', 'idempotency-key')
      .and(
        'match',
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )

    cy.contains('Transfer submitted').should('be.visible')
    cy.contains('TXN-CYPRESS-1').should('be.visible')
    cy.window().should(() => {
      expect(accountsRequests).to.be.greaterThan(1)
    })
  })

  it('hides transfer from viewers and blocks direct access', () => {
    cy.viewport(1180, 720)
    signIn(VISITOR)

    cy.get('.ant-menu').should('not.contain', 'Transfer')

    cy.visit('/transfer')
    cy.contains('403').should('be.visible')
    cy.contains('requires the Operator role').should('be.visible')
  })
})
