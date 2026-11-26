import type { TransferOrderListParams, TransferOrderStatus } from '../types/api'
import {
  readPageSize,
  readPositiveInt,
  setOrDeleteParam,
} from '../utils/urlParams'

export const DEFAULT_APPROVAL_PAGE_SIZE = 20
export const APPROVAL_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export type ApprovalStatusFilter = TransferOrderStatus | 'ALL'

const ORDER_STATUSES: TransferOrderStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]

export function readApprovalParams(
  params: URLSearchParams,
): TransferOrderListParams {
  const page = readPositiveInt(params.get('page'), 1)
  const pageSize = readPageSize(
    params.get('pageSize'),
    DEFAULT_APPROVAL_PAGE_SIZE,
  )
  const status = params.get('status')

  if (status === 'ALL') return { page, pageSize }

  return {
    page,
    pageSize,
    status: isOrderStatus(status) ? status : 'PENDING',
  }
}

export function readApprovalStatusFilter(
  params: URLSearchParams,
): ApprovalStatusFilter {
  const status = params.get('status')

  if (status === 'ALL') return 'ALL'
  return isOrderStatus(status) ? status : 'PENDING'
}

export function withApprovalStatus(
  params: URLSearchParams,
  status: ApprovalStatusFilter,
): URLSearchParams {
  const next = new URLSearchParams(params)

  if (status === 'ALL') {
    next.set('status', 'ALL')
  } else {
    setOrDeleteParam(next, 'status', status === 'PENDING' ? undefined : status)
  }

  next.delete('page')
  return next
}

export function withApprovalPagination(
  params: URLSearchParams,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'page', page > 1 ? String(page) : undefined)
  setOrDeleteParam(
    next,
    'pageSize',
    pageSize !== DEFAULT_APPROVAL_PAGE_SIZE ? String(pageSize) : undefined,
  )
  return next
}

function isOrderStatus(value: string | null): value is TransferOrderStatus {
  return value !== null && ORDER_STATUSES.includes(value as TransferOrderStatus)
}
