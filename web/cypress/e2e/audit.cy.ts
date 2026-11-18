/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

describe('audit log', () => {
  it('lists entries and keeps action filters in the URL', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('.ant-menu').contains('a', 'Audit log').click()
    cy.location('pathname').should('eq', '/audit')

    // Other specs write payee audit entries, so the seed rows are not guaranteed to sit
    // on page one; narrow to them explicitly instead of assuming their position.
    cy.get('.ant-table-tbody tr.ant-table-row').should(
      'have.length.greaterThan',
      0,
    )
    cy.contains('admin@minibank.dev').should('be.visible')

    cy.get('input[placeholder="TRANSFER_CREATED"]').type(
      'SEED_TRANSACTIONS_CREATED{enter}',
    )
    cy.location('search').should('contain', 'action=SEED_TRANSACTIONS_CREATED')
    cy.contains('SEED_TRANSACTIONS_CREATED').should('be.visible')
    cy.contains('1–1 of 1').should('be.visible')

    // The details cell clips visually but keeps the full payload in the DOM and under a
    // tooltip, so nothing is unreadable. The code element is partly hidden by the cell,
    // which is exactly why the hover needs force.
    cy.get('.ant-table-tbody tr.ant-table-row')
      .first()
      .find('td')
      .last()
      .should('contain.text', '"source":"seed"')
      .find('code')
      .trigger('mouseover', { force: true })
    cy.get('.ant-tooltip')
      .should('be.visible')
      .and('contain.text', '"source":"seed"')
    cy.get('.ant-table-tbody tr.ant-table-row')
      .first()
      .find('td')
      .last()
      .find('code')
      .trigger('mouseout', { force: true })

    cy.get('input[placeholder="TRANSFER_CREATED"]')
      .clear()
      .type('SEED_ACCOUNTS_CREATED{enter}')
    cy.location('search').should('contain', 'action=SEED_ACCOUNTS_CREATED')
    cy.contains('SEED_TRANSACTIONS_CREATED').should('not.exist')
    cy.contains('SEED_ACCOUNTS_CREATED').should('be.visible')

    cy.reload()
    cy.location('search').should('contain', 'action=SEED_ACCOUNTS_CREATED')
    cy.contains('SEED_ACCOUNTS_CREATED').should('be.visible')
  })

  it('shows an empty state when no entries match', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.visit('/audit?action=NOT_A_REAL_ACTION')
    cy.contains('No audit entries match these filters.').should('be.visible')
  })
})
