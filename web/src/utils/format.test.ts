import { describe, expect, it } from 'vitest'
import { formatDateTime, formatMoney, maskAccountNumber } from './format'

describe('formatMoney', () => {
  it('formats USD with two decimals', () => {
    expect(formatMoney('12500', 'USD')).toBe('$12,500.00')
  })

  it('formats HKD', () => {
    expect(formatMoney('48000.00', 'HKD')).toBe('HK$48,000.00')
  })

  it('falls back to zero for invalid input', () => {
    expect(formatMoney('not-a-number', 'USD')).toBe('$0.00')
  })
})

describe('maskAccountNumber', () => {
  it('keeps only the last four characters', () => {
    expect(maskAccountNumber('MB-1001-0001')).toBe('•••• 0001')
  })
})

describe('locale-aware formatting', () => {
  it('formats USD with the English grouping by default', () => {
    expect(formatMoney('12500', 'USD')).toBe('$12,500.00')
  })

  it('formats USD with the Chinese locale marker', () => {
    expect(formatMoney('12500', 'USD', 'zh-CN')).toBe('US$12,500.00')
  })

  it('formats dates per locale', () => {
    const iso = '2026-10-31T10:00:00.000Z'

    expect(formatDateTime(iso)).toContain('Oct 31, 2026')
    expect(formatDateTime(iso, 'zh-CN')).toContain('2026年10月31日')
  })
})
