/// <reference types="cypress" />

const PREFERENCES_KEY = 'mini-bank.preferences'

const EN_DEFAULT = { state: { locale: 'en-US', themeId: 'antd-blue' }, version: 0 }

// Cypress wipes storage between tests, but a shared browser profile can still carry
// preferences written by the very first page load of a test. Pin the English default on
// the load that finds nothing, so specs asserting English copy stay deterministic while a
// later reload inside the same test keeps whatever the test just changed.
Cypress.on('window:before:load', (win) => {
  try {
    if (!win.localStorage.getItem(PREFERENCES_KEY)) {
      win.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(EN_DEFAULT))
    }
  } catch {
    // Storage can be blocked; the app then falls back to the same defaults.
  }
})
