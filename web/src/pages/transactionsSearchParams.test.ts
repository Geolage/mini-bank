import { describe, expect, it } from 'vitest'
import {
  readTransactionParams,
  withTransactionFilters,
  withTransactionPagination,
} from './transactionsSearchParams'

describe('readTransactionParams', () => {
  it('applies defaults for missing parameters', () => {
    expect(readTransactionParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('parses valid pagination and filters', () => {
    const params = new URLSearchParams(
      'page=3&pageSize=50&type=INCOMING&from=2026-10-01&to=2026-10-31',
    )

    expect(readTransactionParams(params)).toEqual({
      page: 3,
      pageSize: 50,
      type: 'INCOMING',
      from: '2026-10-01',
      to: '2026-10-31',
    })
  })

  it('falls back for invalid values', () => {
    const params = new URLSearchParams(
      'page=0&pageSize=101&type=SIDEWAYS&from=yesterday&to=2026/10/31',
    )

    expect(readTransactionParams(params)).toEqual({
      page: 1,
      pageSize: 20,
    })
  })
})

describe('withTransactionPagination', () => {
  it('omits default values while preserving filters', () => {
    const current = new URLSearchParams(
      'page=3&pageSize=50&type=OUTGOING&from=2026-10-01&to=2026-10-31',
    )

    const next = withTransactionPagination(current, 1, 20)

    expect(next.toString()).toBe('type=OUTGOING&from=2026-10-01&to=2026-10-31')
  })

  it('stores non-default pagination', () => {
    const next = withTransactionPagination(new URLSearchParams(), 2, 50)

    expect(next.get('page')).toBe('2')
    expect(next.get('pageSize')).toBe('50')
  })
})

describe('withTransactionFilters', () => {
  it('resets the page and stores filters', () => {
    const current = new URLSearchParams('page=4&pageSize=50&type=INCOMING')

    const next = withTransactionFilters(current, {
      type: 'OUTGOING',
      from: '2026-10-01',
      to: '2026-10-31',
    })

    expect(next.get('page')).toBeNull()
    expect(next.get('pageSize')).toBe('50')
    expect(next.get('type')).toBe('OUTGOING')
    expect(next.get('from')).toBe('2026-10-01')
    expect(next.get('to')).toBe('2026-10-31')
  })

  it('clears filters while keeping the page size', () => {
    const current = new URLSearchParams(
      'page=4&pageSize=50&type=INCOMING&from=2026-10-01&to=2026-10-31',
    )

    const next = withTransactionFilters(current, {})

    expect(next.toString()).toBe('pageSize=50')
  })
})
