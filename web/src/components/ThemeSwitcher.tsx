import { SkinOutlined } from '@ant-design/icons'
import { Button, Dropdown, Grid, Space } from 'antd'
import type { MenuProps } from 'antd'
import { usePreferencesStore } from '../app/preferencesStore'
import { useI18n } from '../i18n/useI18n'
import { THEME_PRESETS, type ThemeId } from '../theme/presets'

export function ThemeSwitcher() {
  const { t } = useI18n()
  const screens = Grid.useBreakpoint()
  const themeId = usePreferencesStore((state) => state.themeId)
  const setThemeId = usePreferencesStore((state) => state.setThemeId)

  const current =
    THEME_PRESETS.find((preset) => preset.id === themeId) ?? THEME_PRESETS[0]
  const currentName = t(current.nameKey)

  const items: MenuProps['items'] = THEME_PRESETS.map((preset) => ({
    key: preset.id,
    label: (
      <Space size={8}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 3,
            background: preset.swatch,
          }}
        />
        {t(preset.nameKey)}
      </Space>
    ),
  }))

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [current.id],
        onClick: ({ key }) => setThemeId(key as ThemeId),
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        aria-label={`${t('app.theme')}: ${currentName}`}
        style={{ height: 40 }}
      >
        <SkinOutlined aria-hidden="true" />
        {screens.md ? <span style={{ marginInlineStart: 8 }}>{currentName}</span> : null}
      </Button>
    </Dropdown>
  )
}
