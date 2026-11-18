import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Locale } from '../i18n/types'
import { THEME_PRESETS, type ThemeId } from '../theme/presets'

export const PREF_STORAGE_KEY = 'mini-bank.preferences'

export const DEFAULT_LOCALE: Locale = 'zh-CN'
export const DEFAULT_THEME_ID: ThemeId = 'antd-blue'

export interface Preferences {
  locale: Locale
  themeId: ThemeId
}

interface PreferencesState extends Preferences {
  setLocale: (locale: Locale) => void
  setThemeId: (themeId: ThemeId) => void
  resetPreferences: () => void
}

const KNOWN_LOCALES: Locale[] = ['en-US', 'zh-CN']
const KNOWN_THEMES: ThemeId[] = THEME_PRESETS.map((preset) => preset.id)

/**
 * persist reads storage before the app mounts, so a storage that throws (private
 * mode, disabled cookies) must not take the whole app down.
 */
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Storage unavailable: preferences stay in memory for this session.
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Ignore, same reason as above.
    }
  },
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && KNOWN_LOCALES.includes(value as Locale)
}

// A preset can be renamed or dropped between releases and localStorage outlives the build
// that wrote it, so an unknown id falls back instead of selecting a theme that is gone.
function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && KNOWN_THEMES.includes(value as ThemeId)
}

export function loadPreferences(): Preferences {
  const raw = safeStorage.getItem(PREF_STORAGE_KEY)
  if (!raw) return { locale: DEFAULT_LOCALE, themeId: DEFAULT_THEME_ID }

  try {
    const parsed = JSON.parse(raw) as { state?: Partial<Preferences> }
    const state = parsed.state ?? {}
    return {
      locale: isLocale(state.locale) ? state.locale : DEFAULT_LOCALE,
      themeId: isThemeId(state.themeId) ? state.themeId : DEFAULT_THEME_ID,
    }
  } catch {
    return { locale: DEFAULT_LOCALE, themeId: DEFAULT_THEME_ID }
  }
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      themeId: DEFAULT_THEME_ID,
      setLocale: (locale) => set({ locale }),
      setThemeId: (themeId) => set({ themeId }),
      resetPreferences: () =>
        set({ locale: DEFAULT_LOCALE, themeId: DEFAULT_THEME_ID }),
    }),
    { name: PREF_STORAGE_KEY, storage: createJSONStorage(() => safeStorage) },
  ),
)
