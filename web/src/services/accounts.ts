import { queryOptions } from '@tanstack/react-query'
import type { Account } from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

export const accountsQueryOptions = queryOptions({
  queryKey: queryKeys.accounts,
  queryFn: () => apiFetch<Account[]>('/accounts'),
})

export const accountQueryOptions = (accountId: string) =>
  queryOptions({
    queryKey: queryKeys.account(accountId),
    queryFn: () =>
      apiFetch<Account>(`/accounts/${encodeURIComponent(accountId)}`),
    enabled: Boolean(accountId),
  })
