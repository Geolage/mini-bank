import '@ant-design/v5-patch-for-react-19'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { applyDayjsLocale } from '../i18n/locales'
import { usePreferencesStore } from './preferencesStore'
import { getConfigProps } from './antdConfig'
import { queryClient } from './queryClient'

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = usePreferencesStore((state) => state.locale)
  const themeId = usePreferencesStore((state) => state.themeId)

  useEffect(() => {
    applyDayjsLocale(locale)
    document.documentElement.lang = locale
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider {...getConfigProps(locale, themeId)}>
        <AntdApp component={false}>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
