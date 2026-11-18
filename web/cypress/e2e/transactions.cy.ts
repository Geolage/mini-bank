/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

function openFirstAccountTransactions() {
  signIn(ADMIN)
  cy.contains('a', 'View transactions').first().click()
  cy.location('pathname').should('match', /\/accounts\/.+\/transactions$/)
  cy.contains('h1', 'Transaction history').should('be.visible')
}

describe('transaction history', () => {
  it('loads statement rows from the API', () => {
    cy.viewport(1180, 720)
    openFirstAccountTransactions()

    cy.contains('Current balance').should('be.visible')
    cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 4)
    cy.contains('SEED-TXN-006').should('be.visible')
    cy.contains('SEED-TXN-005').should('be.visible')
    cy.contains('Incoming').should('be.visible')
    cy.contains('Outgoing').should('be.visible')
    cy.contains('1–4 of 4').should('be.visible')

    cy.get('.ant-table-thead th').eq(3).should('have.css', 'text-align', 'center')
    cy.get('.ant-table-tbody tr.ant-table-row')
      .first()
      .find('td')
      .eq(3)
      .should('have.css', 'text-align', 'center')

    cy.screenshot('transaction-history', { capture: 'viewport' })
  })

  it('applies direction filters and keeps them in the URL after reload', () => {
    cy.viewport(1180, 720)
    openFirstAccountTransactions()

    cy.get('.ant-select').first().click()
    cy.contains('.ant-select-item-option-content', 'Outgoing').click()

    cy.location('search').should('contain', 'type=OUTGOING')
    cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 2)
    cy.contains('SEED-TXN-005').should('be.visible')
    cy.contains('SEED-TXN-001').should('be.visible')
    cy.contains('SEED-TXN-006').should('not.exist')

    cy.reload()
    cy.location('search').should('contain', 'type=OUTGOING')
    cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 2)
  })

  it('paginates server-side from URL state', () => {
    cy.viewport(1180, 720)
    openFirstAccountTransactions()

    cy.location('pathname').then((pathname) => {
      cy.visit(`${pathname}?page=2&pageSize=2`)
      cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 2)
      cy.contains('SEED-TXN-002').should('be.visible')
      cy.contains('SEED-TXN-001').should('be.visible')
      cy.contains('3–4 of 4').should('be.visible')

      cy.reload()
      cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 2)
      cy.contains('SEED-TXN-002').should('be.visible')

      cy.visit(`${pathname}?from=2020-01-01&to=2020-12-31`)
      cy.contains('No transactions match these filters.').should('be.visible')
    })
  })
})
