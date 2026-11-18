import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import { ProCard, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import {
  Alert,
  App,
  Button,
  DatePicker,
  Empty,
  Flex,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { accountQueryOptions } from '../services/accounts'
import {
  fetchAllTransactions,
  transactionsQueryOptions,
} from '../services/transactions'
import type { AccountTransaction, TransactionDirection } from '../types/api'
import { formatDateTime, formatMoney, maskAccountNumber } from '../utils/format'
import { downloadTextFile, toCsv } from '../utils/statement'
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
  const { locale, t } = useI18n()
  const { accountId = '' } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const listParams = readTransactionParams(searchParams)

  const account = useQuery(accountQueryOptions(accountId))
  const transactions = useQuery(transactionsQueryOptions(accountId, listParams))

  const { type, from, to } = listParams
  const hasFilters = Boolean(type || from || to)

  const { message } = App.useApp()
  const [exporting, setExporting] = useState(false)
  const [printRows, setPrintRows] = useState<AccountTransaction[] | null>(null)
  const [now] = useState(() => new Date())

  useEffect(() => {
    if (printRows) window.print()
  }, [printRows])

  function statementRows(rows: AccountTransaction[]): string[][] {
    return rows.map((transaction) => [
      transaction.createdAt,
      transaction.reference,
      directionOf(transaction, accountId) === 'INCOMING'
        ? t('transactions.incoming')
        : t('transactions.outgoing'),
      transaction.amount,
      transaction.currency,
      transaction.status === 'COMPLETED'
        ? t('enum.transactionStatus.COMPLETED')
        : t('enum.transactionStatus.FAILED'),
      transaction.note ?? '',
    ])
  }

  function statementHeaders(): string[] {
    return [
      t('transactions.column.date'),
      t('transactions.column.reference'),
      t('transactions.column.direction'),
      t('transactions.column.amount'),
      t('dashboard.currency'),
      t('transactions.column.status'),
      t('transactions.column.note'),
    ]
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = await fetchAllTransactions(accountId, listParams)
      const csv = toCsv(statementHeaders(), statementRows(rows))
      downloadTextFile(
        `minibank-statement-${account.data?.accountNumber ?? accountId}.csv`,
        csv,
      )
      message.success(t('transactions.exportDone', { count: rows.length }))
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('transactions.exportFailed'),
      )
    } finally {
      setExporting(false)
    }
  }

  async function printStatement() {
    setExporting(true)
    try {
      setPrintRows(await fetchAllTransactions(accountId, listParams))
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('transactions.exportFailed'),
      )
    } finally {
      setExporting(false)
    }
  }

  function updateFilters(filters: {
    type?: TransactionDirection
    from?: string
    to?: string
  }) {
    setSearchParams(withTransactionFilters(searchParams, filters))
  }

  const columns: ProColumns<AccountTransaction>[] = [
    {
      title: t('transactions.column.date'),
      dataIndex: 'createdAt',
      align: 'center',
      width: 190,
      render: (_, transaction) => formatDateTime(transaction.createdAt, locale),
    },
    {
      title: t('transactions.column.reference'),
      dataIndex: 'reference',
      align: 'center',
      width: 170,
      render: (_, transaction) => <Text code>{transaction.reference}</Text>,
    },
    {
      title: t('transactions.column.direction'),
      align: 'center',
      width: 120,
      render: (_, transaction) => {
        const direction = directionOf(transaction, accountId)
        return (
          <Tag color={direction === 'INCOMING' ? 'green' : 'orange'}>
            {direction === 'INCOMING'
              ? t('transactions.incoming')
              : t('transactions.outgoing')}
          </Tag>
        )
      },
    },
    {
      title: t('transactions.column.amount'),
      dataIndex: 'amount',
      align: 'center',
      width: 150,
      render: (_, transaction) => {
        const direction = directionOf(transaction, accountId)
        return (
          <Text strong type={direction === 'INCOMING' ? 'success' : 'danger'}>
            {direction === 'INCOMING' ? '+' : '-'}
            {formatMoney(transaction.amount, transaction.currency, locale)}
          </Text>
        )
      },
    },
    {
      title: t('transactions.column.status'),
      dataIndex: 'status',
      align: 'center',
      width: 120,
      render: (_, transaction) => (
        <Tag color={transaction.status === 'COMPLETED' ? 'green' : 'red'}>
          {transaction.status === 'COMPLETED'
            ? t('enum.transactionStatus.COMPLETED')
            : t('enum.transactionStatus.FAILED')}
        </Tag>
      ),
    },
    {
      title: t('transactions.column.note'),
      dataIndex: 'note',
      align: 'center',
      ellipsis: { showTitle: false },
      render: (_, transaction) =>
        transaction.note ? (
          <Tooltip placement="topLeft" title={transaction.note}>
            <span>{transaction.note}</span>
          </Tooltip>
        ) : (
          '—'
        ),
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
            {t('transactions.title')}
          </Title>
          <Text type="secondary">{t('transactions.subtitle')}</Text>
        </div>
        <Space size={8} wrap>
          <Button
            icon={<DownloadOutlined aria-hidden="true" />}
            loading={exporting}
            onClick={exportCsv}
          >
            {t('transactions.exportCsv')}
          </Button>
          <Button
            icon={<PrinterOutlined aria-hidden="true" />}
            loading={exporting}
            onClick={printStatement}
          >
            {t('transactions.printStatement')}
          </Button>
          <Button
            icon={<ArrowLeftOutlined aria-hidden="true" />}
            onClick={() => navigate('/accounts')}
          >
            {t('transactions.backToAccounts')}
          </Button>
        </Space>
      </Flex>

      {account.isLoading ? (
        <ProCard bordered loading style={{ marginBottom: 16 }} />
      ) : account.data ? (
        <ProCard bordered style={{ marginBottom: 16 }}>
          <Flex wrap gap={16} align="center" justify="space-between">
            <Space size={12} wrap>
              <Tag color={account.data.type === 'CHECKING' ? 'blue' : 'purple'}>
                {account.data.type === 'CHECKING'
                  ? t('enum.accountType.CHECKING')
                  : t('enum.accountType.SAVINGS')}
              </Tag>
              <Text code>{maskAccountNumber(account.data.accountNumber)}</Text>
              <Tag>{account.data.currency}</Tag>
            </Space>
            <div>
              <Text type="secondary">{t('transactions.currentBalance')}</Text>
              <div>
                <Text strong style={{ fontSize: 24 }}>
                  {formatMoney(
                    account.data.balance,
                    account.data.currency,
                    locale,
                  )}
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
            {t('transactions.dateRange')}
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
            {t('transactions.direction')}
          </Text>
          <Select<TransactionDirection>
            allowClear
            aria-label={t('transactions.direction')}
            placeholder={t('transactions.allDirections')}
            value={type}
            onChange={(value) => updateFilters({ from, to, type: value })}
            style={{ width: 170 }}
            options={[
              { value: 'INCOMING', label: t('transactions.incoming') },
              { value: 'OUTGOING', label: t('transactions.outgoing') },
            ]}
          />
        </div>
        <Button disabled={!hasFilters} onClick={() => updateFilters({})}>
          {t('transactions.clearFilters')}
        </Button>
      </Flex>

      {transactions.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('transactions.loading')}
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : transactions.isError ? (
        <Alert
          type="error"
          showIcon
          message={t('transactions.errorTitle')}
          description={
            transactions.error instanceof Error
              ? transactions.error.message
              : t('errors.generic')
          }
          action={
            <Button size="small" onClick={() => transactions.refetch()}>
              {t('transfer.tryAgain')}
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
            showTotal: (total, range) =>
              t('transactions.range', {
                from: range[0],
                to: range[1],
                total,
              }),
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
              withTransactionPagination(searchParams, nextPage, nextPageSize),
            )
          }}
          locale={{
            emptyText: <Empty description={t('transactions.empty')} />,
          }}
        />
      )}

      {printRows ? (
        <div className="print-sheet">
          <h1>{t('transactions.statementTitle')}</h1>
          <p>
            {account.data?.accountNumber ?? accountId} ·{' '}
            {account.data?.currency ?? ''} ·{' '}
            {t('transactions.statementGenerated')}{' '}
            {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              now,
            )}
          </p>
          <p>{t('transactions.statementCount', { count: printRows.length })}</p>
          {printRows.length === 0 ? (
            <p>{t('transactions.statementEmpty')}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {statementHeaders().map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printRows.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.createdAt, locale)}</td>
                    <td>{transaction.reference}</td>
                    <td>
                      {directionOf(transaction, accountId) === 'INCOMING'
                        ? t('transactions.incoming')
                        : t('transactions.outgoing')}
                    </td>
                    <td>
                      {formatMoney(
                        transaction.amount,
                        transaction.currency,
                        locale,
                      )}
                    </td>
                    <td>{transaction.currency}</td>
                    <td>
                      {transaction.status === 'COMPLETED'
                        ? t('enum.transactionStatus.COMPLETED')
                        : t('enum.transactionStatus.FAILED')}
                    </td>
                    <td>{transaction.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  )
}
