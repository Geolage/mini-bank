/// <reference types="cypress" />

import { ADMIN, signIn } from '../support/session'

const suffix = String(1000 + (Date.now() % 9000))
const ACCOUNT = `MB-9001-${suffix}`

function openPayees() {
  signIn(ADMIN)
  cy.get('.ant-menu').contains('a', 'Payees').click()
  cy.location('pathname').should('eq', '/payees')
  cy.contains('h1', 'Payees').should('be.visible')
}

function rowFor(name: string) {
  return cy.contains('.ant-table-tbody tr.ant-table-row', name)
}

describe('payees', () => {
  it('lists, searches, creates, edits and deletes with undo', () => {
    cy.viewport(1180, 720)
    openPayees()

    cy.contains('Visitor checking').should('be.visible')
    cy.contains('Visitor HKD').should('be.visible')

    cy.get('input[placeholder="Search name, account or bank"]').type('hkd{enter}')
    cy.location('search').should('contain', 'q=hkd')
    cy.contains('Visitor HKD').should('be.visible')
    cy.contains('Visitor checking').should('not.exist')

    cy.reload()
    cy.location('search').should('contain', 'q=hkd')
    cy.contains('Visitor HKD').should('be.visible')

    cy.contains('button', 'Clear filters').click()
    cy.contains('Visitor checking').should('be.visible')

    cy.contains('button', 'New payee').click()
    cy.get('.ant-drawer-open #name').type('Cypress payee')
    cy.get('.ant-drawer-open #accountNumber').type(ACCOUNT)
    cy.get('.ant-drawer-open #note').type('Created by the e2e suite')
    cy.get('.ant-drawer-open').contains('button', 'Save').click()
    cy.contains('Payee saved').should('be.visible')
    rowFor('Cypress payee').should('be.visible')

    rowFor('Cypress payee').contains('button', 'Edit').click()
    cy.get('.ant-drawer-open #name').clear().type('Cypress payee renamed')
    cy.get('.ant-drawer-open').contains('button', 'Save').click()
    cy.contains('Payee updated').should('be.visible')
    rowFor('Cypress payee renamed').should('be.visible')

    rowFor('Cypress payee renamed').contains('button', 'Delete').click()
    cy.contains('Deleted “Cypress payee renamed”').should('be.visible')
    rowFor('Cypress payee renamed').should('not.exist')

    cy.contains('button', 'Undo').click()
    cy.contains('Restored').should('be.visible')
    rowFor('Cypress payee renamed').should('be.visible')

    rowFor('Cypress payee renamed').contains('button', 'Delete').click()
    cy.contains('Deleted “Cypress payee renamed”').should('be.visible')
    cy.reload()
    cy.contains('Cypress payee renamed').should('not.exist')
  })

  it('bulk deletes selected payees and restores them', () => {
    cy.viewport(1180, 720)
    openPayees()

    cy.get('.ant-table-tbody tr.ant-table-row .ant-checkbox-input').eq(0).check()
    cy.get('.ant-table-tbody tr.ant-table-row .ant-checkbox-input').eq(1).check()
    cy.contains('2 selected').should('be.visible')
    cy.contains('button', 'Delete selected').click()

    cy.contains('Deleted 2 payees').should('be.visible')
    cy.get('.ant-table-tbody tr.ant-table-row').should('have.length', 0)

    cy.contains('button', 'Undo').click()
    cy.contains('Restored').should('be.visible')
    cy.contains('Visitor checking').should('be.visible')
    cy.contains('Visitor HKD').should('be.visible')
  })

  it('prefills a transfer from the payee detail drawer', () => {
    cy.viewport(1180, 720)
    openPayees()

    cy.contains('Visitor checking').click()
    cy.get('.ant-drawer-open').contains('MB-2001-0001').should('be.visible')
    cy.get('.ant-drawer-open')
      .contains('button', 'Transfer to this payee')
      .scrollIntoView()
      .click()

    cy.location('pathname').should('eq', '/transfer')
    cy.location('search').should('contain', 'to=MB-2001-0001')
    cy.get('#toAccountNumber').should('have.value', 'MB-2001-0001')
  })

  it('keeps payees available to viewers but hides the transfer action', () => {
    cy.viewport(1180, 720)
    signIn({ identifier: 'visitor', password: '00000000' })
    cy.get('.ant-menu').contains('a', 'Payees').click()

    cy.contains('Admin checking').should('be.visible')
    cy.contains('Admin checking').click()
    cy.get('.ant-drawer-open').contains('MB-1001-0001').should('be.visible')
    cy.get('.ant-drawer-open')
      .contains('button', 'Transfer to this payee')
      .should('not.exist')
  })
})
