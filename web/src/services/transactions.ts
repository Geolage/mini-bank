import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type {
  AccountTransaction,
  Paginated,
  TransactionListParams,
} from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

function transactionListPath(
  accountId: string,
  params: TransactionListParams,
): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.type) search.set('type', params.type)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)

  return `/accounts/${encodeURIComponent(accountId)}/transactions?${search.toString()}`
}

export const transactionsQueryOptions = (
  accountId: string,
  params: TransactionListParams,
) =>
  queryOptions({
    queryKey: queryKeys.transactions(accountId, params),
    queryFn: () =>
      apiFetch<Paginated<AccountTransaction>>(
        transactionListPath(accountId, params),
      ),
    enabled: Boolean(accountId),
    placeholderData: keepPreviousData,
  })
