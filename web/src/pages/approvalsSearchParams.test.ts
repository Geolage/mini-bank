import { describe, expect, it } from 'vitest'
import {
  DEFAULT_APPROVAL_PAGE_SIZE,
  readApprovalParams,
  readApprovalStatusFilter,
  withApprovalPagination,
  withApprovalStatus,
} from './approvalsSearchParams'

describe('approvalsSearchParams', () => {
  it('defaults to pending orders on page one', () => {
    expect(readApprovalParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: DEFAULT_APPROVAL_PAGE_SIZE,
      status: 'PENDING',
    })
    expect(readApprovalStatusFilter(new URLSearchParams())).toBe('PENDING')
  })

  it('reads status, page and page size from the URL', () => {
    const search = new URLSearchParams('status=REJECTED&page=3&pageSize=10')
    expect(readApprovalParams(search)).toEqual({
      page: 3,
      pageSize: 10,
      status: 'REJECTED',
    })
    expect(readApprovalStatusFilter(search)).toBe('REJECTED')
  })

  it('treats status=ALL as no status filter', () => {
    const search = new URLSearchParams('status=ALL')
    expect(readApprovalParams(search)).toEqual({
      page: 1,
      pageSize: DEFAULT_APPROVAL_PAGE_SIZE,
    })
    expect(readApprovalStatusFilter(search)).toBe('ALL')
  })

  it('ignores invalid values and falls back to pending', () => {
    const search = new URLSearchParams('status=NOPE&page=0&pageSize=500')
    expect(readApprovalParams(search)).toEqual({
      page: 1,
      pageSize: DEFAULT_APPROVAL_PAGE_SIZE,
      status: 'PENDING',
    })
  })

  it('writes the status filter and resets pagination', () => {
    const next = withApprovalStatus(
      new URLSearchParams('status=APPROVED&page=4'),
      'REJECTED',
    )
    expect(next.get('status')).toBe('REJECTED')
    expect(next.get('page')).toBeNull()
  })

  it('drops the default status but keeps ALL explicit', () => {
    expect(
      withApprovalStatus(new URLSearchParams('status=REJECTED'), 'PENDING').get(
        'status',
      ),
    ).toBeNull()
    expect(withApprovalStatus(new URLSearchParams(), 'ALL').get('status')).toBe(
      'ALL',
    )
  })

  it('writes pagination and drops defaults', () => {
    const next = withApprovalPagination(new URLSearchParams(), 2, 50)
    expect(next.get('page')).toBe('2')
    expect(next.get('pageSize')).toBe('50')

    const defaults = withApprovalPagination(next, 1, DEFAULT_APPROVAL_PAGE_SIZE)
    expect(defaults.get('page')).toBeNull()
    expect(defaults.get('pageSize')).toBeNull()
  })
})
