import type { Locale } from '../i18n/types'

export function formatMoney(
  amount: string | number,
  currency: string,
  locale: Locale = 'en-US',
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // ISO 4217 codes, not symbols: "$" would mean USD in en-US and US$ in zh-CN, and
    // HKD/CNY collide the same way. A banking console has to stay unambiguous.
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.slice(-4)}`
}

export function formatDateTime(
  isoDate: string,
  locale: Locale = 'en-US',
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}
