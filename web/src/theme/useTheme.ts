import { usePreferencesStore } from '../app/preferencesStore'
import { getThemePreset, type ThemePreset } from './presets'

export function useTheme(): ThemePreset {
  const themeId = usePreferencesStore((state) => state.themeId)
  return getThemePreset(themeId)
}
