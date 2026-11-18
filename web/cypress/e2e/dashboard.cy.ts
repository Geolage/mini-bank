/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

describe('dashboard', () => {
  it('is the landing screen with balances, chart and recent activity', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.contains('h1', /Good (morning|afternoon|evening), Admin/).should(
      'be.visible',
    )
    cy.contains(/USD\s12,500\.00/).should('be.visible')
    cy.contains(/HKD\s48,000\.00/).should('be.visible')
    cy.contains('Cash flow · last 30 days').should('be.visible')
    cy.get('svg rect[tabindex="0"]').should('have.length', 30)
    cy.contains('SEED-TXN-006').should('be.visible')
    cy.screenshot('dashboard', { capture: 'viewport' })
  })

  it('reads out a hovered day and switches currency', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.contains('Cash flow · last 30 days').scrollIntoView()
    cy.get('svg rect[tabindex="0"]').last().trigger('mouseover')
    cy.contains(/In USD/).should('be.visible')

    cy.get('.ant-select').first().scrollIntoView({ block: 'center' }).click()
    cy.get('.ant-select-item-option').contains('HKD').click()
    cy.contains(/\+HKD\s300\.00/).scrollIntoView().should('be.visible')
    cy.contains(/-HKD\s1,200\.00/).should('be.visible')
    cy.get('svg rect[tabindex="0"]').should('have.length', 30)
  })

  it('jumps from recent activity to the statement and to a transfer', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.contains('a', 'View transactions').first().click()
    cy.location('pathname').should('match', /\/accounts\/.+\/transactions$/)

    cy.visit('/dashboard')
    cy.contains('button', 'New transfer').click()
    cy.location('pathname').should('eq', '/transfer')
  })
})
