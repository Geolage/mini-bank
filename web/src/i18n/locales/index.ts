// Deep ESM paths on purpose: antd/locale/* is a CommonJS shim, and Vite's pre-bundler wraps
// it in an extra { default: ... } layer, so ConfigProvider would receive that wrapper object
// and silently fall back to English for every built-in string (date pickers, pagination).
import enUSAntd from 'antd/es/locale/en_US'
import zhCNAntd from 'antd/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import type { Locale } from '../types'

export const antdLocale = { 'en-US': enUSAntd, 'zh-CN': zhCNAntd } as const

export function applyDayjsLocale(locale: Locale): void {
  dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : 'en')
}

// Deterministic starting point; AppProviders re-applies the stored preference.
applyDayjsLocale('en-US')
