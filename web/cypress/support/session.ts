/// <reference types="cypress" />

export const ADMIN = { identifier: 'admin', password: '11111111' }
export const VISITOR = { identifier: 'visitor', password: '00000000' }
export const CHECKER = { identifier: 'checker', password: '22222222' }

export function fillLogin(identifier: string, password: string) {
  cy.get('input[name="identifier"]').type(identifier)
  cy.get('input[name="password"]').type(password)
  cy.contains('button', 'Sign in').click()
}

export function signIn({ identifier, password }: typeof ADMIN) {
  cy.visit('/login')
  fillLogin(identifier, password)
  cy.location('pathname').should('eq', '/dashboard')
}
