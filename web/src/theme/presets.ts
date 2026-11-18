import type { ThemeConfig } from 'antd'
import type { MessageKey } from '../i18n/types'

export type ThemeId =
  | 'antd-blue'
  | 'elegant-blue'
  | 'aurora-purple'
  | 'emerald'
  | 'volcano'
  | 'slate'

export interface ThemePreset {
  id: ThemeId
  nameKey: MessageKey
  swatch: string
  config: ThemeConfig
  sider: {
    colorBgMenuItemHover: string
    colorBgMenuItemSelected: string
    colorTextMenuSelected: string
    colorTextMenuActive: string
  }
}

function build(id: ThemeId, primary: string, hover: string, soft: string): ThemePreset {
  return {
    id,
    nameKey: `settings.theme.${id}` as MessageKey,
    swatch: primary,
    config: {
      token: {
        colorPrimary: primary,
        colorLink: primary,
        colorLinkHover: hover,
        colorLinkActive: hover,
        colorTextSecondary: '#475569',
        // Typography type="secondary" resolves to this token, not colorTextSecondary.
        colorTextDescription: '#475569',
        borderRadius: 8,
        fontFamily:
          '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      },
    },
    sider: {
      colorBgMenuItemHover: '#f8fafc',
      colorBgMenuItemSelected: soft,
      colorTextMenuSelected: hover,
      colorTextMenuActive: hover,
    },
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  build('antd-blue', '#0f5ed8', '#094bb0', '#e8f1fe'),
  build('elegant-blue', '#0b6fd1', '#0857a8', '#e8f2fb'),
  build('aurora-purple', '#722ed1', '#531cab', '#f9f0ff'),
  build('emerald', '#047857', '#065f46', '#ecfdf5'),
  build('volcano', '#d4380d', '#ad2102', '#fff2e8'),
  build('slate', '#334155', '#1e293b', '#f1f5f9'),
]

export function getThemePreset(id: ThemeId): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0]
}
