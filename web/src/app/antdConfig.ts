import type { ConfigProviderProps } from 'antd'
import { antdLocale } from '../i18n/locales'
import type { Locale } from '../i18n/types'
import { getThemePreset, type ThemeId } from '../theme/presets'

/**
 * Shared so tests configure AntD exactly like the app does. AntD also inserts a space
 * between two CJK characters in buttons ("登 录"), which would make the accessible name
 * differ from the message catalogue and break Chinese selectors.
 */
export function getConfigProps(locale: Locale, themeId: ThemeId): ConfigProviderProps {
  return {
    theme: getThemePreset(themeId).config,
    locale: antdLocale[locale],
    button: { autoInsertSpace: false },
  }
}
