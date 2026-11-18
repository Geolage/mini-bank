import type {
  AuditListParams,
  PayeeListParams,
  TransactionListParams,
} from '../types/api'

export const queryKeys = {
  accounts: ['accounts'] as const,
  account: (accountId: string) => ['accounts', accountId] as const,
  transactions: (accountId: string, params: TransactionListParams) =>
    ['accounts', accountId, 'transactions', params] as const,
  auditAll: ['audit'] as const,
  audit: (params: AuditListParams) => ['audit', params] as const,
  payeesAll: ['payees'] as const,
  payees: (params: PayeeListParams) => ['payees', params] as const,
  dashboard: ['dashboard'] as const,
} as const
