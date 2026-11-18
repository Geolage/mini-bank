import enUSAntd from 'antd/locale/en_US'
import zhCNAntd from 'antd/locale/zh_CN'
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
