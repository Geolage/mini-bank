/// <reference types="cypress" />

import { ADMIN, VISITOR, signIn } from '../support/session'

describe('application shell', () => {
  it('shows operator navigation and keeps accounts selected on transaction history', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('.ant-pro-sider-menu').within(() => {
      cy.contains('Accounts').should('be.visible')
      cy.contains('Transfer').should('be.visible')
      cy.contains('Audit log').should('be.visible')
      cy.contains('Settings').should('be.visible')
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
    signIn(VISITOR)

    cy.get('.ant-pro-sider-menu').within(() => {
      cy.contains('Accounts').should('be.visible')
      cy.contains('Settings').should('be.visible')
      cy.contains('Transfer').should('not.exist')
      cy.contains('Audit log').should('not.exist')
    })

    cy.visit('/audit')
    cy.contains('403').should('be.visible')
    cy.contains('requires the Operator role').should('be.visible')
  })

  it('sends the sidebar logo back to accounts', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.visit('/audit')
    cy.get('.ant-pro-sider-logo').find('a').click()

    cy.location('pathname').should('eq', '/accounts')
  })
})
