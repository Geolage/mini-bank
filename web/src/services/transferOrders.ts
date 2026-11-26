import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type {
  Paginated,
  TransferOrder,
  TransferOrderListParams,
  TransferResult,
} from '../types/api'
import { apiFetch } from './http'
import { queryKeys } from './queryKeys'

function transferOrdersPath(params: TransferOrderListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.status) search.set('status', params.status)

  return `/transfer-orders?${search.toString()}`
}

export const transferOrdersQueryOptions = (params: TransferOrderListParams) =>
  queryOptions({
    queryKey: queryKeys.transferOrders(params),
    queryFn: () =>
      apiFetch<Paginated<TransferOrder>>(transferOrdersPath(params)),
    placeholderData: keepPreviousData,
  })

export function approveTransferOrder(
  orderId: string,
  decisionNote?: string,
): Promise<TransferResult> {
  return apiFetch<TransferResult>(
    `/transfer-orders/${encodeURIComponent(orderId)}/approve`,
    {
      method: 'POST',
      body: JSON.stringify(decisionNote ? { decisionNote } : {}),
    },
  )
}

export function rejectTransferOrder(
  orderId: string,
  decisionNote: string,
): Promise<TransferResult> {
  return apiFetch<TransferResult>(
    `/transfer-orders/${encodeURIComponent(orderId)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ decisionNote }),
    },
  )
}

export function cancelTransferOrder(orderId: string): Promise<TransferResult> {
  return apiFetch<TransferResult>(
    `/transfer-orders/${encodeURIComponent(orderId)}/cancel`,
    { method: 'POST' },
  )
}
