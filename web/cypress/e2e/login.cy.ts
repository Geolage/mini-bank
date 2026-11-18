/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

describe('login', () => {
  it('signs in with the admin demo account and shows accounts', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    cy.screenshot('login-page', { capture: 'viewport' })

    signIn(ADMIN)

    cy.contains('h1', 'Accounts').should('be.visible')
  })
})
