import type { TransferInput, TransferResult } from '../types/api'
import { apiFetch } from './http'

export function transferAccount(
  input: TransferInput,
  idempotencyKey: string,
): Promise<TransferResult> {
  return apiFetch<TransferResult>('/transfers', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(input),
  })
}
