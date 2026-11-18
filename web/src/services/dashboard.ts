import { queryOptions } from '@tanstack/react-query'
import type { DashboardOverview } from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

export const dashboardQueryOptions = queryOptions({
  queryKey: queryKeys.dashboard,
  queryFn: () => apiFetch<DashboardOverview>('/dashboard/overview'),
})
