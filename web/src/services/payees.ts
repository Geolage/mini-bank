import { queryOptions } from '@tanstack/react-query'
import type {
  Paginated,
  Payee,
  PayeeInput,
  PayeeListParams,
} from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

export function payeeQueryString(params: PayeeListParams): string {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  search.set('sort', params.sort)
  if (params.q) search.set('q', params.q)
  return search.toString()
}

export function payeesQueryOptions(params: PayeeListParams) {
  return queryOptions({
    queryKey: queryKeys.payees(params),
    queryFn: () =>
      apiFetch<Paginated<Payee>>(`/payees?${payeeQueryString(params)}`),
  })
}

export function createPayee(input: PayeeInput): Promise<Payee> {
  return apiFetch<Payee>('/payees', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updatePayee(
  id: string,
  input: Partial<PayeeInput>,
): Promise<Payee> {
  return apiFetch<Payee>(`/payees/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deletePayee(id: string): Promise<Payee> {
  return apiFetch<Payee>(`/payees/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
