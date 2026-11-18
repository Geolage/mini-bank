import type { PayeeListParams, PayeeSort } from '../types/api'
import {
  readPageSize,
  readPositiveInt,
  setOrDeleteParam,
} from '../utils/urlParams'

export const DEFAULT_PAYEE_PAGE_SIZE = 10
export const PAYEE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const PAYEE_SORTS: PayeeSort[] = [
  'name',
  'nameDesc',
  'updated',
  'created',
]

export function readPayeeParams(params: URLSearchParams): PayeeListParams {
  const q = params.get('q')?.trim()
  const sort = params.get('sort')

  return {
    page: readPositiveInt(params.get('page'), 1),
    pageSize: readPageSize(params.get('pageSize'), DEFAULT_PAYEE_PAGE_SIZE, 50),
    sort: isPayeeSort(sort) ? sort : 'name',
    ...(q ? { q } : {}),
  }
}

export function withPayeePagination(
  params: URLSearchParams,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'page', page > 1 ? String(page) : undefined)
  setOrDeleteParam(
    next,
    'pageSize',
    pageSize !== DEFAULT_PAYEE_PAGE_SIZE ? String(pageSize) : undefined,
  )
  return next
}

export function withPayeeFilters(
  params: URLSearchParams,
  filters: { q?: string; sort?: PayeeSort },
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'q', filters.q)
  setOrDeleteParam(
    next,
    'sort',
    filters.sort && filters.sort !== 'name' ? filters.sort : undefined,
  )
  next.delete('page')
  return next
}

function isPayeeSort(value: string | null): value is PayeeSort {
  return value !== null && (PAYEE_SORTS as string[]).includes(value)
}
