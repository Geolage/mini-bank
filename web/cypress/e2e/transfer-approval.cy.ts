/// <reference types="cypress" />

import { ADMIN, CHECKER, signIn } from '../support/session'

describe('transfer approval', () => {
  before(() => {
    // Approval moves real money in the demo database, so start from the seeded balances.
    cy.task('resetDemoData', null, { timeout: 180_000 })
  })

  after(() => {
    // Leave the demo database seeded for the specs that run after this one and for the
    // next suite run; otherwise the next start inherits a 2,500.00 balance and extra rows.
    cy.task('resetDemoData', null, { timeout: 180_000 })
  })

  it('queues a large transfer and posts it after checker approval', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('.ant-menu').contains('a', 'Transfer').click()
    cy.get('#toAccountNumber').type('MB-2001-0001')
    cy.get('#amount').type('10000.00')
    cy.contains('button', 'Submit transfer').click()

    cy.contains('Submitted for approval').should('be.visible')
    cy.contains(/ORD-/).should('be.visible')

    cy.window().then((win) => win.localStorage.clear())
    signIn(CHECKER)

    cy.get('.ant-menu').contains('a', 'Approvals').click()
    cy.location('pathname').should('eq', '/approvals')
    cy.get('.ant-table-tbody tr.ant-table-row').should(
      'have.length.greaterThan',
      0,
    )

    cy.contains('button', 'Approve').first().click()
    cy.get('.ant-modal').contains('button', 'Approve and post').click()
    cy.contains('Transfer approved and posted').should('be.visible')

    cy.window().then((win) => win.localStorage.clear())
    signIn(ADMIN)

    cy.get('.ant-menu').contains('a', 'Accounts').click()
    cy.contains(/USD\s2,500\.00/).should('be.visible')
  })
})
