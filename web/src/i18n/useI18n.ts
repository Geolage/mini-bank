import { usePreferencesStore } from '../app/preferencesStore'
import { makeTranslator } from './translate'
import type { Locale, MessageKey } from './types'

export function useI18n() {
  const locale = usePreferencesStore((state) => state.locale)
  const setLocale = usePreferencesStore((state) => state.setLocale)

  return { locale, setLocale, t: makeTranslator(locale) }
}

export type Translate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string

export type { Locale, MessageKey }
