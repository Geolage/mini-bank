import { describe, expect, it } from 'vitest'
import { formatDateTime, formatMoney, maskAccountNumber } from './format'

// Intl separates the ISO code from the number with a no-break space.
const NBSP = '\u00a0'

describe('formatMoney', () => {
  it('formats USD with the ISO code and two decimals', () => {
    expect(formatMoney('12500', 'USD')).toBe(`USD${NBSP}12,500.00`)
  })

  it('keeps every currency distinguishable instead of sharing a $ symbol', () => {
    expect(formatMoney('48000.00', 'HKD')).toBe(`HKD${NBSP}48,000.00`)
    expect(formatMoney('1500.00', 'CNY')).toBe(`CNY${NBSP}1,500.00`)
  })

  it('falls back to zero for invalid input', () => {
    expect(formatMoney('not-a-number', 'USD')).toBe(`USD${NBSP}0.00`)
  })
})

describe('maskAccountNumber', () => {
  it('keeps only the last four characters', () => {
    expect(maskAccountNumber('MB-1001-0001')).toBe('•••• 0001')
  })
})

describe('locale-aware formatting', () => {
  it('uses the same ISO code in both locales', () => {
    expect(formatMoney('12500', 'USD', 'en-US')).toBe(`USD${NBSP}12,500.00`)
    expect(formatMoney('12500', 'USD', 'zh-CN')).toBe(`USD${NBSP}12,500.00`)
  })

  it('keeps the thousands grouping per locale', () => {
    expect(formatMoney('1234567.5', 'USD', 'zh-CN')).toBe(`USD${NBSP}1,234,567.50`)
  })

  it('formats dates per locale', () => {
    const iso = '2026-10-31T10:00:00.000Z'

    expect(formatDateTime(iso)).toContain('Oct 31, 2026')
    expect(formatDateTime(iso, 'zh-CN')).toContain('2026年10月31日')
  })
})
