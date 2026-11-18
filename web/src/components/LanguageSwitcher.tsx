import { GlobalOutlined } from '@ant-design/icons'
import { Button, Dropdown, Grid } from 'antd'
import type { MenuProps } from 'antd'
import { usePreferencesStore } from '../app/preferencesStore'
import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/types'

export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const screens = Grid.useBreakpoint()
  const setLocale = usePreferencesStore((state) => state.setLocale)

  const items: MenuProps['items'] = [
    { key: 'en-US', label: t('app.languageEnglish') },
    { key: 'zh-CN', label: t('app.languageChinese') },
  ]

  const current =
    locale === 'zh-CN' ? t('app.languageChinese') : t('app.languageEnglish')

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [locale],
        onClick: ({ key }) => setLocale(key as Locale),
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        aria-label={`${t('app.language')}: ${current}`}
        style={{ height: 40 }}
      >
        <GlobalOutlined aria-hidden="true" />
        {screens.md ? (
          <span style={{ marginInlineStart: 8 }}>{current}</span>
        ) : null}
      </Button>
    </Dropdown>
  )
}
