import { ProCard } from '@ant-design/pro-components'
import { Alert, Button, Flex, Radio, Space, Typography } from 'antd'
import { useState } from 'react'
import { usePreferencesStore } from '../app/preferencesStore'
import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/types'
import { THEME_PRESETS, type ThemeId } from '../theme/presets'

const { Title, Text } = Typography

export function SettingsPage() {
  const { locale, t } = useI18n()
  const themeId = usePreferencesStore((state) => state.themeId)
  const setLocale = usePreferencesStore((state) => state.setLocale)
  const setThemeId = usePreferencesStore((state) => state.setThemeId)
  const resetPreferences = usePreferencesStore(
    (state) => state.resetPreferences,
  )
  const [restored, setRestored] = useState(false)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ margin: 0, fontSize: 24 }}>
          {t('settings.title')}
        </Title>
        <Text type="secondary">{t('settings.subtitle')}</Text>
      </div>

      <Flex vertical gap={16}>
        <ProCard title={t('settings.languageGroup')} bordered headerBordered>
          <div role="radiogroup" aria-label={t('settings.languageGroup')}>
            <Radio.Group
              name="locale"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <Space size={12}>
                <Radio value="en-US">{t('app.languageEnglish')}</Radio>
                <Radio value="zh-CN">{t('app.languageChinese')}</Radio>
              </Space>
            </Radio.Group>
          </div>
        </ProCard>

        <ProCard title={t('settings.themeGroup')} bordered headerBordered>
          <div role="radiogroup" aria-label={t('settings.themeGroup')}>
            <Radio.Group
              name="theme"
              value={themeId}
              onChange={(event) => setThemeId(event.target.value as ThemeId)}
            >
              <Flex wrap gap={16}>
                {THEME_PRESETS.map((preset) => (
                  <Radio key={preset.id} value={preset.id}>
                    {/* One element child: AntD drops the checked state when a Radio
                        receives an element and a text node together. */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: preset.swatch,
                        }}
                      />
                      {t(preset.nameKey)}
                    </span>
                  </Radio>
                ))}
              </Flex>
            </Radio.Group>
          </div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginTop: 12 }}
          >
            {t('settings.themeDefaultHint')}
          </Text>
        </ProCard>

        <div>
          <Button
            onClick={() => {
              resetPreferences()
              setRestored(true)
            }}
          >
            {t('settings.reset')}
          </Button>
        </div>

        {restored ? (
          <Alert
            type="success"
            showIcon
            message={t('settings.resetDone')}
            closable
            onClose={() => setRestored(false)}
          />
        ) : null}
      </Flex>
    </div>
  )
}
