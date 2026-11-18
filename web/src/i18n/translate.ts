import type { Locale, MessageKey, Messages } from './types'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'

const catalogues: Record<Locale, Messages> = { 'en-US': enUS, 'zh-CN': zhCN }

export function resolveMessage(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages,
    )

  if (typeof value !== 'string') return `[${key}]`
  if (!vars) return value

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function makeTranslator(locale: Locale) {
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    resolveMessage(catalogues[locale], key, vars)
}
