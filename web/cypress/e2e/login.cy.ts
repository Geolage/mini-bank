/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

describe('login', () => {
  it('signs in with the admin demo account and shows accounts', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    cy.screenshot('login-page', { capture: 'viewport' })

    signIn(ADMIN)

    cy.contains('h1', /Good (morning|afternoon|evening), Admin/).should(
      'be.visible',
    )
    cy.contains('Cash flow · last 30 days').should('be.visible')
  })
})
