import type { AuditListParams } from '../types/api'
import {
  isDateOnly,
  readPageSize,
  readPositiveInt,
  setOrDeleteParam,
} from '../utils/urlParams'

export const DEFAULT_AUDIT_PAGE_SIZE = 20
export const AUDIT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export function readAuditParams(params: URLSearchParams): AuditListParams {
  const action = params.get('action')
  const actorId = params.get('actorId')
  const from = params.get('from')
  const to = params.get('to')

  return {
    page: readPositiveInt(params.get('page'), 1),
    pageSize: readPageSize(params.get('pageSize'), DEFAULT_AUDIT_PAGE_SIZE),
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
    ...(isDateOnly(from) ? { from } : {}),
    ...(isDateOnly(to) ? { to } : {}),
  }
}

export function withAuditPagination(
  params: URLSearchParams,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'page', page > 1 ? String(page) : undefined)
  setOrDeleteParam(
    next,
    'pageSize',
    pageSize !== DEFAULT_AUDIT_PAGE_SIZE ? String(pageSize) : undefined,
  )
  return next
}

export function withAuditFilters(
  params: URLSearchParams,
  filters: Pick<AuditListParams, 'action' | 'actorId' | 'from' | 'to'>,
): URLSearchParams {
  const next = new URLSearchParams(params)
  setOrDeleteParam(next, 'action', filters.action)
  setOrDeleteParam(next, 'actorId', filters.actorId)
  setOrDeleteParam(next, 'from', filters.from)
  setOrDeleteParam(next, 'to', filters.to)
  next.delete('page')
  return next
}
