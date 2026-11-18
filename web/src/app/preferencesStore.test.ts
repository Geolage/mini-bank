import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadPreferences,
  usePreferencesStore,
  PREF_STORAGE_KEY,
} from './preferencesStore'

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'zh-CN', themeId: 'antd-blue' })
})

describe('loadPreferences', () => {
  it('defaults to Chinese and the AntD blue theme', () => {
    expect(loadPreferences()).toEqual({ locale: 'zh-CN', themeId: 'antd-blue' })
  })

  it('reads a stored preference', () => {
    localStorage.setItem(
      PREF_STORAGE_KEY,
      JSON.stringify({
        state: { locale: 'zh-CN', themeId: 'emerald' },
        version: 0,
      }),
    )

    expect(loadPreferences()).toEqual({ locale: 'zh-CN', themeId: 'emerald' })
  })

  it('ignores an unknown stored locale', () => {
    localStorage.setItem(
      PREF_STORAGE_KEY,
      JSON.stringify({
        state: { locale: 'fr-FR', themeId: 'emerald' },
        version: 0,
      }),
    )

    expect(loadPreferences().locale).toBe('zh-CN')
    expect(loadPreferences().themeId).toBe('emerald')
  })

  it('drops a stored theme that no longer exists', () => {
    localStorage.setItem(
      PREF_STORAGE_KEY,
      JSON.stringify({
        state: { locale: 'zh-CN', themeId: 'geekblue' },
        version: 0,
      }),
    )

    expect(loadPreferences()).toEqual({ locale: 'zh-CN', themeId: 'antd-blue' })
  })

  it('falls back to defaults when localStorage throws', () => {
    const original = window.localStorage.getItem
    window.localStorage.getItem = () => {
      throw new Error('blocked')
    }

    expect(loadPreferences()).toEqual({ locale: 'zh-CN', themeId: 'antd-blue' })
    window.localStorage.getItem = original
  })
})

describe('usePreferencesStore', () => {
  it('persists a locale change', () => {
    usePreferencesStore.getState().setLocale('en-US')

    expect(usePreferencesStore.getState().locale).toBe('en-US')
    expect(localStorage.getItem(PREF_STORAGE_KEY)).toContain('en-US')
  })

  it('resets both preferences', () => {
    usePreferencesStore.getState().setLocale('en-US')
    usePreferencesStore.getState().setThemeId('volcano')
    usePreferencesStore.getState().resetPreferences()

    expect(usePreferencesStore.getState()).toMatchObject({
      locale: 'zh-CN',
      themeId: 'antd-blue',
    })
  })
})
