/// <reference types="cypress" />

import { ADMIN, VISITOR, signIn } from '../support/session'

const BLUE_SELECTED = 'rgb(9, 75, 176)'
const EMERALD_SELECTED = 'rgb(6, 95, 70)'
const ELEGANT_SELECTED = 'rgb(8, 87, 168)'

function readPreferences() {
  return cy
    .window()
    .then((win) =>
      JSON.parse(win.localStorage.getItem('mini-bank.preferences') ?? '{}'),
    )
}

function noHorizontalOverflow(win: Cypress.AUTWindow) {
  expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth)
}

describe('settings', () => {
  it('switches the language from the header on the sign-in page', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')

    cy.get('button[aria-label="Language: English"]').click()
    cy.get('[role=menuitem]').contains('简体中文').click()

    cy.contains('label', '账号').should('be.visible')
    cy.get('html').should('have.attr', 'lang', 'zh-CN')
    cy.window().then(noHorizontalOverflow)
    cy.screenshot('login-page-zh', { capture: 'viewport' })
  })

  it('localises Ant Design widgets, not only our own copy', () => {
    cy.viewport(1180, 720)
    signIn(VISITOR)

    cy.get('button[aria-label="Language: English"]').click()
    cy.get('[role=menuitem]').contains('简体中文').click()

    cy.contains('a', '查看交易').first().click()
    cy.location('pathname').should('match', /\/accounts\/.+\/transactions$/)

    cy.get('input[placeholder="开始日期"]').should('exist')
    cy.get('input[placeholder="结束日期"]').should('exist')
    cy.contains('.ant-select-selection-item', '条/页').should('be.visible')
    cy.get('.ant-pagination-prev').should('have.attr', 'title', '上一页')
  })

  it('opens in Chinese when the browser has no stored preference', () => {
    cy.viewport(1180, 720)
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('mini-bank.preferences')
      },
    })

    cy.contains('label', '账号').should('be.visible')
    cy.get('input[name="identifier"]').should(
      'have.attr',
      'placeholder',
      '请输入账号',
    )
    cy.get('input[name="password"]').should('have.attr', 'placeholder', '请输入密码')
    cy.get('html').should('have.attr', 'lang', 'zh-CN')
  })

  it('persists the language chosen in Settings across reloads', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('.ant-menu').contains('a', 'Settings').click()
    cy.contains('h1', 'Settings').should('be.visible')

    cy.contains('label', '简体中文').click()
    cy.contains('h1', '设置').should('be.visible')
    cy.contains('button', '恢复默认').should('be.visible')
    cy.window().then(noHorizontalOverflow)
    readPreferences().its('state.locale').should('eq', 'zh-CN')

    cy.get('.ant-menu').contains('a', '账户').click()
    cy.contains('h1', '账户').should('be.visible')
    cy.contains(/USD\s12,500\.00/).should('be.visible')
    cy.contains('a', '查看交易').should('be.visible')
    cy.window().then(noHorizontalOverflow)
    cy.screenshot('accounts-page-zh', { capture: 'viewport' })

    cy.reload()
    cy.contains('h1', '账户').should('be.visible')

    cy.visit('/settings')
    cy.contains('label', 'English').click()
    cy.contains('h1', 'Settings').should('be.visible')
    readPreferences().its('state.locale').should('eq', 'en-US')

    cy.contains('label', '简体中文').click()
    cy.contains('button', '恢复默认').click()
    cy.contains('h1', '设置').should('be.visible')
    cy.contains('已恢复默认设置。').should('be.visible')
    readPreferences().its('state.locale').should('eq', 'zh-CN')
  })

  it('persists the theme and restores the AntD blue default', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)
    cy.visit('/settings')

    cy.get('.ant-menu-item-selected').should('have.css', 'color', BLUE_SELECTED)

    cy.contains('label', 'Emerald').click()
    cy.get('.ant-menu-item-selected').should('have.css', 'color', EMERALD_SELECTED)
    readPreferences().its('state.themeId').should('eq', 'emerald')

    cy.reload()
    cy.get('.ant-menu-item-selected').should('have.css', 'color', EMERALD_SELECTED)

    cy.contains('button', 'Restore defaults').click()
    cy.get('.ant-menu-item-selected').should('have.css', 'color', BLUE_SELECTED)
    readPreferences().its('state.themeId').should('eq', 'antd-blue')
  })

  it('pins the header controls to one aligned row at the top right', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    // The header actions mount a tick after the route, so wait for all three before
    // measuring; the rect lookups below are synchronous.
    cy.get('button[aria-label^="Theme:"]').should('be.visible')
    cy.get('button[aria-label^="Language:"]').should('be.visible')
    cy.get('button[aria-label="Account menu"]').should('be.visible')

    cy.window().then((win) => {
      const rect = (selector: string) => {
        const element = win.document.querySelector(selector)
        assert.exists(element, selector)
        return element!.getBoundingClientRect()
      }

      const theme = rect('button[aria-label^="Theme:"]')
      const language = rect('button[aria-label^="Language:"]')
      const account = rect('button[aria-label="Account menu"]')

      for (const box of [theme, language, account]) {
        expect(box.height).to.equal(40)
        expect(Math.abs(box.top - language.top)).to.be.lessThan(1)
        // Inside the fixed header band at the very top of the viewport.
        expect(box.top).to.be.lessThan(56)
      }

      // Ordered left to right and hugging the top-right corner.
      expect(account.right).to.be.greaterThan(language.right)
      expect(language.right).to.be.greaterThan(theme.right)
      expect(win.innerWidth - account.right).to.be.lessThan(48)
    })
  })

  it('switches the palette from the header and keeps it', () => {
    cy.viewport(1180, 720)
    signIn(ADMIN)

    cy.get('button[aria-label="Theme: Calm Blue"]').click()
    cy.get('[role=menuitem]').contains('Elegant Blue').click()

    cy.get('.ant-menu-item-selected').should('have.css', 'color', ELEGANT_SELECTED)
    readPreferences().its('state.themeId').should('eq', 'elegant-blue')

    cy.reload()
    cy.get('button[aria-label="Theme: Elegant Blue"]').should('be.visible')
    cy.get('.ant-menu-item-selected').should('have.css', 'color', ELEGANT_SELECTED)
  })

  it('lets a visitor sign in with an email address and hides operator pages', () => {
    cy.viewport(1180, 720)
    cy.visit('/login')
    cy.get('input[name="identifier"]').type('visitor@minibank.dev')
    cy.get('input[name="password"]').type('00000000')
    cy.contains('button', 'Sign in').click()

    cy.location('pathname').should('eq', '/accounts')
    cy.get('.ant-pro-sider-menu').within(() => {
      cy.contains('Transfer').should('not.exist')
      cy.contains('Audit log').should('not.exist')
      cy.contains('Settings').should('be.visible')
    })

    cy.visit('/settings')
    cy.contains('h1', 'Settings').should('be.visible')
  })
})
