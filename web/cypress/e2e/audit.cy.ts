/// <reference types="cypress" />

function signIn(email: string) {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type('Password123!')
  cy.contains('button', 'Sign in').click()
  cy.location('pathname').should('eq', '/accounts')
}

describe('audit log', () => {
  it('lists entries and keeps action filters in the URL', () => {
    cy.viewport(1180, 720)
    signIn('operator@minibank.dev')

    cy.get('.ant-menu').contains('a', 'Audit log').click()
    cy.location('pathname').should('eq', '/audit')

    cy.contains('SEED_TRANSACTIONS_CREATED').should('be.visible')
    cy.contains('SEED_ACCOUNTS_CREATED').should('be.visible')
    cy.contains('Alex Chen').should('be.visible')
    cy.contains('1–2 of 2').should('be.visible')

    cy.get('input[placeholder="TRANSFER_CREATED"]').type(
      'SEED_ACCOUNTS_CREATED{enter}',
    )
    cy.location('search').should('contain', 'action=SEED_ACCOUNTS_CREATED')
    cy.contains('SEED_TRANSACTIONS_CREATED').should('not.exist')
    cy.contains('SEED_ACCOUNTS_CREATED').should('be.visible')

    cy.reload()
    cy.location('search').should('contain', 'action=SEED_ACCOUNTS_CREATED')
    cy.contains('SEED_ACCOUNTS_CREATED').should('be.visible')
  })

  it('shows an empty state when no entries match', () => {
    cy.viewport(1180, 720)
    signIn('operator@minibank.dev')

    cy.visit('/audit?action=NOT_A_REAL_ACTION')
    cy.contains('No audit entries match these filters.').should('be.visible')
  })
})
