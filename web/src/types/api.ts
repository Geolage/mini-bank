export type Role = 'VIEWER' | 'OPERATOR'
export type Currency = 'USD' | 'HKD' | 'CNY'
export type AccountType = 'CHECKING' | 'SAVINGS'
export type TransactionStatus = 'COMPLETED' | 'FAILED'
export type TransactionDirection = 'INCOMING' | 'OUTGOING'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: Role
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface Account {
  id: string
  accountNumber: string
  type: AccountType
  currency: Currency
  balance: string
}

export interface AccountTransaction {
  id: string
  reference: string
  fromAccountId: string
  toAccountId: string
  amount: string
  currency: Currency
  status: TransactionStatus
  note: string | null
  createdAt: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface TransactionListParams {
  page: number
  pageSize: number
  type?: TransactionDirection
  from?: string
  to?: string
}

export interface TransferInput {
  fromAccountId: string
  toAccountNumber: string
  amount: string
  note?: string
}

export interface TransferResult {
  id: string
  reference: string
}

export interface AuditActor {
  id: string
  name: string
  email: string
}

export interface AuditLog {
  id: string
  actor: AuditActor
  action: string
  resourceType: string
  resourceId: string | null
  metadata: unknown
  createdAt: string
}

export interface AuditListParams {
  page: number
  pageSize: number
  action?: string
  actorId?: string
  from?: string
  to?: string
}

export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error?: string
}

export type PayeeSort = 'name' | 'nameDesc' | 'updated' | 'created'

export interface Payee {
  id: string
  name: string
  accountNumber: string
  bankName: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface PayeeListParams {
  page: number
  pageSize: number
  q?: string
  sort: PayeeSort
}

export interface PayeeInput {
  name: string
  accountNumber: string
  bankName?: string
  note?: string
}
