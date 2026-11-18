import { describe, expect, it } from 'vitest'
import { formatMoney, maskAccountNumber } from './format'

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
