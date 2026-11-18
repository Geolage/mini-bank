import { describe, expect, it } from 'vitest'
import {
  readAuditParams,
  withAuditFilters,
  withAuditPagination,
} from './auditSearchParams'

describe('readAuditParams', () => {
  it('applies defaults for missing parameters', () => {
    expect(readAuditParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('parses pagination and filters', () => {
    const params = new URLSearchParams(
      'page=2&pageSize=10&action=TRANSFER_CREATED&actorId=3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69&from=2026-10-01&to=2026-10-31',
    )

    expect(readAuditParams(params)).toEqual({
      page: 2,
      pageSize: 10,
      action: 'TRANSFER_CREATED',
      actorId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
      from: '2026-10-01',
      to: '2026-10-31',
    })
  })

  it('drops invalid dates', () => {
    expect(
      readAuditParams(new URLSearchParams('from=yesterday&to=2026-10-31')),
    ).toEqual({ page: 1, pageSize: 20, to: '2026-10-31' })
  })
})

describe('withAuditPagination', () => {
  it('omits default values while preserving filters', () => {
    const current = new URLSearchParams('page=3&pageSize=50&action=TRANSFER_CREATED')

    expect(withAuditPagination(current, 1, 20).toString()).toBe(
      'action=TRANSFER_CREATED',
    )
  })

  it('stores non-default pagination', () => {
    const next = withAuditPagination(new URLSearchParams(), 2, 50)

    expect(next.get('page')).toBe('2')
    expect(next.get('pageSize')).toBe('50')
  })
})

describe('withAuditFilters', () => {
  it('resets the page and stores filters', () => {
    const current = new URLSearchParams('page=4&pageSize=50&action=OLD')

    const next = withAuditFilters(current, {
      action: 'TRANSFER_CREATED',
      from: '2026-10-01',
      to: '2026-10-31',
    })

    expect(next.get('page')).toBeNull()
    expect(next.get('pageSize')).toBe('50')
    expect(next.get('action')).toBe('TRANSFER_CREATED')
    expect(next.get('from')).toBe('2026-10-01')
    expect(next.get('to')).toBe('2026-10-31')
  })

  it('clears filters while keeping the page size', () => {
    const current = new URLSearchParams(
      'page=4&pageSize=50&action=TRANSFER_CREATED&from=2026-10-01&to=2026-10-31',
    )

    expect(withAuditFilters(current, {}).toString()).toBe('pageSize=50')
  })
})
