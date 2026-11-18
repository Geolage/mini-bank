import '@ant-design/v5-patch-for-react-19'
import { App as AntdApp, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from './queryClient'

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#047857',
    colorLink: '#047857',
    colorLinkHover: '#065f46',
    colorLinkActive: '#065f46',
    colorTextSecondary: '#475569',
    // Typography type="secondary" resolves to this token, not colorTextSecondary.
    colorTextDescription: '#475569',
    borderRadius: 8,
    fontFamily:
      '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme} locale={enUS}>
        <AntdApp component={false}>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
