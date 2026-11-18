/// <reference types="cypress" />

function signIn(email: string) {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type('Password123!')
  cy.contains('button', 'Sign in').click()
  cy.location('pathname').should('eq', '/accounts')
}

describe('application shell', () => {
  it('shows operator navigation and keeps accounts selected on transaction history', () => {
    cy.viewport(1180, 720)
    signIn('operator@minibank.dev')

    cy.get('.ant-pro-sider-menu').within(() => {
      cy.contains('Accounts').should('be.visible')
      cy.contains('Transfer').should('be.visible')
      cy.contains('Audit log').should('be.visible')
    })

    cy.contains('a', 'View transactions').first().click()
    cy.location('pathname').should('match', /\/accounts\/.+\/transactions$/)

    cy.get('.ant-breadcrumb').within(() => {
      cy.contains('Accounts').should('be.visible')
      cy.contains('Transaction history').should('be.visible')
    })
    cy.get('.ant-menu-item-selected').should('contain', 'Accounts')
    cy.window().then((win) => {
      expect(win.document.documentElement.scrollWidth).to.be.at.most(
        win.innerWidth,
      )
    })
    cy.screenshot('transaction-history', { capture: 'viewport' })
  })

  it('hides operator navigation from viewers and blocks direct audit access', () => {
    cy.viewport(1180, 720)
    signIn('viewer@minibank.dev')

    cy.get('.ant-pro-sider-menu').within(() => {
      cy.contains('Accounts').should('be.visible')
      cy.contains('Transfer').should('not.exist')
      cy.contains('Audit log').should('not.exist')
    })

    cy.visit('/audit')
    cy.contains('403').should('be.visible')
    cy.contains('requires the operator role').should('be.visible')
  })
})
