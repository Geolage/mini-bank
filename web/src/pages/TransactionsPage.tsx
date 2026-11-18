import { ArrowLeftOutlined } from '@ant-design/icons'
import { ProCard, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Flex,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { accountQueryOptions } from '../services/accounts'
import { transactionsQueryOptions } from '../services/transactions'
import type {
  AccountTransaction,
  TransactionDirection,
} from '../types/api'
import { formatDateTime, formatMoney, maskAccountNumber } from '../utils/format'
import {
  readTransactionParams,
  TRANSACTION_PAGE_SIZE_OPTIONS,
  withTransactionFilters,
  withTransactionPagination,
} from './transactionsSearchParams'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function directionOf(
  transaction: AccountTransaction,
  accountId: string,
): TransactionDirection {
  return transaction.fromAccountId === accountId ? 'OUTGOING' : 'INCOMING'
}

export function TransactionsPage() {
  const { accountId = '' } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const listParams = readTransactionParams(searchParams)

  const account = useQuery(accountQueryOptions(accountId))
  const transactions = useQuery(
    transactionsQueryOptions(accountId, listParams),
  )

  const { type, from, to } = listParams
  const hasFilters = Boolean(type || from || to)

  function updateFilters(filters: {
    type?: TransactionDirection
    from?: string
    to?: string
  }) {
    setSearchParams(withTransactionFilters(searchParams, filters))
  }

  const columns: ProColumns<AccountTransaction>[] = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 190,
      render: (_, transaction) => formatDateTime(transaction.createdAt),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      width: 170,
      render: (_, transaction) => <Text code>{transaction.reference}</Text>,
    },
    {
      title: 'Direction',
      width: 120,
      render: (_, transaction) => {
        const direction = directionOf(transaction, accountId)
        return (
          <Tag color={direction === 'INCOMING' ? 'green' : 'orange'}>
            {direction === 'INCOMING' ? 'Incoming' : 'Outgoing'}
          </Tag>
        )
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      width: 150,
      render: (_, transaction) => {
        const direction = directionOf(transaction, accountId)
        return (
          <Text strong type={direction === 'INCOMING' ? 'success' : 'danger'}>
            {direction === 'INCOMING' ? '+' : '-'}
            {formatMoney(transaction.amount, transaction.currency)}
          </Text>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (_, transaction) => (
        <Tag color={transaction.status === 'COMPLETED' ? 'green' : 'red'}>
          {transaction.status}
        </Tag>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      ellipsis: true,
      render: (_, transaction) => transaction.note ?? '—',
    },
  ]

  return (
    <div>
      <Flex
        wrap
        gap={16}
        justify="space-between"
        align="flex-end"
        style={{ marginBottom: 24 }}
      >
        <div>
          <Title level={1} style={{ margin: 0, fontSize: 24 }}>
            Transaction history
          </Title>
          <Text type="secondary">Statement lines for one account.</Text>
        </div>
        <Button
          icon={<ArrowLeftOutlined aria-hidden="true" />}
          onClick={() => navigate('/accounts')}
        >
          Back to accounts
        </Button>
      </Flex>

      {account.isLoading ? (
        <ProCard bordered loading style={{ marginBottom: 16 }} />
      ) : account.data ? (
        <ProCard bordered style={{ marginBottom: 16 }}>
          <Flex wrap gap={16} align="center" justify="space-between">
            <Space size={12} wrap>
              <Tag
                color={account.data.type === 'CHECKING' ? 'blue' : 'purple'}
              >
                {account.data.type}
              </Tag>
              <Text code>{maskAccountNumber(account.data.accountNumber)}</Text>
              <Tag>{account.data.currency}</Tag>
            </Space>
            <div>
              <Text type="secondary">Current balance</Text>
              <div>
                <Text strong style={{ fontSize: 24 }}>
                  {formatMoney(account.data.balance, account.data.currency)}
                </Text>
              </div>
            </div>
          </Flex>
        </ProCard>
      ) : null}

      <Flex wrap gap={12} align="flex-end" style={{ marginBottom: 16 }}>
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
          >
            Date range
          </Text>
          <RangePicker
            value={from && to ? [dayjs(from), dayjs(to)] : null}
            onChange={(dates) =>
              updateFilters({
                type,
                from: dates?.[0]?.format('YYYY-MM-DD'),
                to: dates?.[1]?.format('YYYY-MM-DD'),
              })
            }
            style={{ width: 260 }}
          />
        </div>
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
          >
            Direction
          </Text>
          <Select<TransactionDirection>
            allowClear
            aria-label="Direction"
            placeholder="All directions"
            value={type}
            onChange={(value) => updateFilters({ from, to, type: value })}
            style={{ width: 170 }}
            options={[
              { value: 'INCOMING', label: 'Incoming' },
              { value: 'OUTGOING', label: 'Outgoing' },
            ]}
          />
        </div>
        <Button disabled={!hasFilters} onClick={() => updateFilters({})}>
          Clear filters
        </Button>
      </Flex>

      {transactions.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            Loading transactions…
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : transactions.isError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load transactions"
          description={
            transactions.error instanceof Error
              ? transactions.error.message
              : 'Something went wrong. Please try again.'
          }
          action={
            <Button size="small" onClick={() => transactions.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <ProTable<AccountTransaction>
          rowKey="id"
          columns={columns}
          dataSource={transactions.data?.items ?? []}
          loading={transactions.isFetching}
          search={false}
          options={false}
          cardBordered
          scroll={{ x: 760 }}
          pagination={{
            current: listParams.page,
            pageSize: listParams.pageSize,
            total: transactions.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [...TRANSACTION_PAGE_SIZE_OPTIONS],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          }}
          onChange={(pagination) => {
            const nextPageSize = pagination.pageSize ?? listParams.pageSize
            const nextPage =
              nextPageSize !== listParams.pageSize
                ? 1
                : (pagination.current ?? 1)

            if (
              nextPage === listParams.page &&
              nextPageSize === listParams.pageSize
            ) {
              return
            }

            setSearchParams(
              withTransactionPagination(
                searchParams,
                nextPage,
                nextPageSize,
              ),
            )
          }}
          locale={{
            emptyText: (
              <Empty description="No transactions match these filters." />
            ),
          }}
        />
      )}
    </div>
  )
}
