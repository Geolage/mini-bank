import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
}

// The app ships Chinese as the default locale, but the component tests assert English
// copy. Pin the preference before any store rehydrates it; tests that need another locale
// set it through usePreferencesStore explicitly.
localStorage.setItem(
  'mini-bank.preferences',
  JSON.stringify({ state: { locale: 'en-US', themeId: 'antd-blue' }, version: 0 }),
)
