export type Role = 'VIEWER' | 'OPERATOR' | 'CHECKER'
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

export type TransferOrderStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type TransferResultStatus =
  'COMPLETED' | 'PENDING_APPROVAL' | 'REJECTED' | 'CANCELLED'

export interface TransferResult {
  id: string
  reference: string
  status: TransferResultStatus
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

export interface CurrencyTotal {
  currency: Currency
  balance: string
  accounts: number
}

export interface CurrencyFlow {
  currency: Currency
  incoming: string
  outgoing: string
}

export interface SeriesPoint {
  date: string
  incoming: string
  outgoing: string
}

export interface DashboardSeries {
  currency: Currency
  points: SeriesPoint[]
}

export interface RecentTransaction {
  id: string
  reference: string
  direction: TransactionDirection
  amount: string
  currency: Currency
  counterpartyAccountNumber: string
  accountId: string
  note: string | null
  createdAt: string
}

export interface DashboardOverview {
  totals: CurrencyTotal[]
  payeeCount: number
  month: CurrencyFlow[]
  series: DashboardSeries[]
  recent: RecentTransaction[]
}

export interface TransferOrderParty {
  id: string
  name: string
  username: string
}

export interface TransferOrderAccount {
  id: string
  accountNumber: string
  type: AccountType
}

export interface TransferOrder {
  id: string
  reference: string
  status: TransferOrderStatus
  amount: string
  currency: Currency
  note: string | null
  createdAt: string
  decidedAt: string | null
  decisionNote: string | null
  maker: TransferOrderParty
  checker: TransferOrderParty | null
  fromAccount: TransferOrderAccount
  toAccount: TransferOrderAccount
  transactionId: string | null
}

export interface TransferOrderListParams {
  page: number
  pageSize: number
  status?: TransferOrderStatus
}
