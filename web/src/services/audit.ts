import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { AuditListParams, AuditLog, Paginated } from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

function auditListPath(params: AuditListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.action) search.set('action', params.action)
  if (params.actorId) search.set('actorId', params.actorId)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)

  return `/audit-logs?${search.toString()}`
}

export const auditQueryOptions = (params: AuditListParams) =>
  queryOptions({
    queryKey: queryKeys.audit(params),
    queryFn: () => apiFetch<Paginated<AuditLog>>(auditListPath(params)),
    placeholderData: keepPreviousData,
  })
