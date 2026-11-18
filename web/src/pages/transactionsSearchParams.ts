import type { TransactionDirection, TransactionListParams } from '../types/api'
import {
  isDateOnly,
  readPageSize,
  readPositiveInt,
  setOrDeleteParam,
} from '../utils/urlParams'

export const DEFAULT_TRANSACTION_PAGE_SIZE = 20
export const TRANSACTION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export function readTransactionParams(
  params: URLSearchParams,
): TransactionListParams {
  const type = params.get('type')
  const from = params.get('from')
  const to = params.get('to')

  return {
    page: readPositiveInt(params.get('page'), 1),
    pageSize: readPageSize(
      params.get('pageSize'),
      DEFAULT_TRANSACTION_PAGE_SIZE,
    ),
    ...(isDirection(type) ? { type } : {}),
    ...(isDateOnly(from) ? { from } : {}),
    ...(isDateOnly(to) ? { to } : {}),
  }
}

export function withTransactionPagination(
  params: URLSearchParams,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'page', page > 1 ? String(page) : undefined)
  setOrDeleteParam(
    next,
    'pageSize',
    pageSize !== DEFAULT_TRANSACTION_PAGE_SIZE ? String(pageSize) : undefined,
  )
  return next
}

export function withTransactionFilters(
  params: URLSearchParams,
  filters: Pick<TransactionListParams, 'type' | 'from' | 'to'>,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'type', filters.type)
  setOrDeleteParam(next, 'from', filters.from)
  setOrDeleteParam(next, 'to', filters.to)
  next.delete('page')
  return next
}

function isDirection(value: string | null): value is TransactionDirection {
  return value === 'INCOMING' || value === 'OUTGOING'
}
