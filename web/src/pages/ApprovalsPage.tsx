import { ProCard, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import {
  Alert,
  App,
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../app/authStore'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/types'
import { queryKeys } from '../services/queryKeys'
import {
  approveTransferOrder,
  cancelTransferOrder,
  rejectTransferOrder,
  transferOrdersQueryOptions,
} from '../services/transferOrders'
import type { TransferOrder, TransferOrderStatus } from '../types/api'
import { formatDateTime, formatMoney, maskAccountNumber } from '../utils/format'
import {
  APPROVAL_PAGE_SIZE_OPTIONS,
  type ApprovalStatusFilter,
  readApprovalParams,
  readApprovalStatusFilter,
  withApprovalPagination,
  withApprovalStatus,
} from './approvalsSearchParams'

const { Title, Text } = Typography

const STATUS_KEYS: Record<TransferOrderStatus, MessageKey> = {
  PENDING: 'enum.transferOrderStatus.PENDING',
  APPROVED: 'enum.transferOrderStatus.APPROVED',
  REJECTED: 'enum.transferOrderStatus.REJECTED',
  CANCELLED: 'enum.transferOrderStatus.CANCELLED',
}

const STATUS_COLORS: Record<TransferOrderStatus, string> = {
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
}

interface DecisionFormValues {
  decisionNote?: string
}

interface Decision {
  mode: 'approve' | 'reject'
  order: TransferOrder
}

export function ApprovalsPage() {
  const { locale, t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const listParams = readApprovalParams(searchParams)
  const statusFilter = readApprovalStatusFilter(searchParams)
  const orders = useQuery(transferOrdersQueryOptions(listParams))
  const queryClient = useQueryClient()
  const { message, modal } = App.useApp()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [form] = Form.useForm<DecisionFormValues>()

  function invalidateApprovalQueries() {
    queryClient.invalidateQueries({ queryKey: queryKeys.transferOrdersAll })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.auditAll })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  }

  function closeDecision() {
    setDecision(null)
    form.resetFields()
  }

  const approve = useMutation({
    mutationFn: ({
      order,
      decisionNote,
    }: {
      order: TransferOrder
      decisionNote?: string
    }) => approveTransferOrder(order.id, decisionNote),
    onSuccess: () => {
      message.success(t('approvals.approved'))
      closeDecision()
      invalidateApprovalQueries()
    },
    onError: (error) =>
      message.error(
        error instanceof Error ? error.message : t('errors.generic'),
      ),
  })

  const reject = useMutation({
    mutationFn: ({
      order,
      decisionNote,
    }: {
      order: TransferOrder
      decisionNote: string
    }) => rejectTransferOrder(order.id, decisionNote),
    onSuccess: () => {
      message.success(t('approvals.rejected'))
      closeDecision()
      invalidateApprovalQueries()
    },
    onError: (error) =>
      message.error(
        error instanceof Error ? error.message : t('errors.generic'),
      ),
  })

  const cancel = useMutation({
    mutationFn: (order: TransferOrder) => cancelTransferOrder(order.id),
    onSuccess: () => {
      message.success(t('approvals.cancelled'))
      invalidateApprovalQueries()
    },
    onError: (error) =>
      message.error(
        error instanceof Error ? error.message : t('errors.generic'),
      ),
  })

  function openDecision(mode: Decision['mode'], order: TransferOrder) {
    setDecision({ mode, order })
    form.resetFields()
  }

  function submitDecision(values: DecisionFormValues) {
    if (!decision) return

    const note = values.decisionNote?.trim()
    if (decision.mode === 'approve') {
      approve.mutate({
        order: decision.order,
        decisionNote: note || undefined,
      })
    } else {
      reject.mutate({ order: decision.order, decisionNote: note ?? '' })
    }
  }

  function confirmCancel(order: TransferOrder) {
    modal.confirm({
      title: t('approvals.cancelConfirm'),
      content: t('approvals.cancelConfirmBody'),
      okText: t('approvals.cancelOk'),
      cancelText: t('approvals.cancelDismiss'),
      onOk: () => cancel.mutateAsync(order),
    })
  }

  const statusOptions: { value: ApprovalStatusFilter; label: string }[] = [
    { value: 'PENDING', label: t('enum.transferOrderStatus.PENDING') },
    { value: 'APPROVED', label: t('enum.transferOrderStatus.APPROVED') },
    { value: 'REJECTED', label: t('enum.transferOrderStatus.REJECTED') },
    { value: 'CANCELLED', label: t('enum.transferOrderStatus.CANCELLED') },
    { value: 'ALL', label: t('approvals.statusAll') },
  ]

  const columns: ProColumns<TransferOrder>[] = [
    {
      title: t('approvals.column.created'),
      dataIndex: 'createdAt',
      align: 'center',
      width: 190,
      render: (_, order) => formatDateTime(order.createdAt, locale),
    },
    {
      title: t('approvals.column.reference'),
      dataIndex: 'reference',
      align: 'center',
      width: 190,
      render: (_, order) => <Text code>{order.reference}</Text>,
    },
    {
      title: t('approvals.column.maker'),
      align: 'center',
      width: 150,
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Text>{order.maker.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {order.maker.username}
          </Text>
        </Space>
      ),
    },
    {
      title: t('approvals.column.from'),
      align: 'center',
      width: 140,
      render: (_, order) => (
        <Text code>{maskAccountNumber(order.fromAccount.accountNumber)}</Text>
      ),
    },
    {
      title: t('approvals.column.to'),
      align: 'center',
      width: 140,
      render: (_, order) => (
        <Text code>{maskAccountNumber(order.toAccount.accountNumber)}</Text>
      ),
    },
    {
      title: t('approvals.column.amount'),
      dataIndex: 'amount',
      align: 'center',
      width: 150,
      render: (_, order) => (
        <Text strong>{formatMoney(order.amount, order.currency, locale)}</Text>
      ),
    },
    {
      title: t('approvals.column.status'),
      dataIndex: 'status',
      align: 'center',
      width: 140,
      render: (_, order) => (
        <Tag color={STATUS_COLORS[order.status]}>
          {t(STATUS_KEYS[order.status])}
        </Tag>
      ),
    },
    {
      title: t('approvals.column.decided'),
      align: 'center',
      width: 190,
      render: (_, order) =>
        order.decidedAt ? (
          <Space direction="vertical" size={0}>
            <Text>{formatDateTime(order.decidedAt, locale)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {order.checker?.name ?? '—'}
            </Text>
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: t('approvals.column.actions'),
      align: 'center',
      width: 200,
      render: (_, order) => {
        if (order.status !== 'PENDING') return '—'

        const canDecide = user?.role === 'CHECKER'
        const canCancel =
          user?.role === 'OPERATOR' && order.maker.id === user.id

        if (!canDecide && !canCancel) return '—'

        return (
          <Space size={4} wrap>
            {canDecide ? (
              <>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => openDecision('approve', order)}
                >
                  {t('approvals.approve')}
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => openDecision('reject', order)}
                >
                  {t('approvals.reject')}
                </Button>
              </>
            ) : null}
            {canCancel ? (
              <Button size="small" onClick={() => confirmCancel(order)}>
                {t('approvals.cancel')}
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ margin: 0, fontSize: 24 }}>
          {t('approvals.title')}
        </Title>
        <Text type="secondary">
          {t(
            user?.role === 'CHECKER'
              ? 'approvals.subtitleChecker'
              : 'approvals.subtitleOperator',
          )}
        </Text>
      </div>

      <Flex wrap gap={12} align="flex-end" style={{ marginBottom: 16 }}>
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
          >
            {t('approvals.status')}
          </Text>
          <Select<ApprovalStatusFilter>
            aria-label={t('approvals.status')}
            value={statusFilter}
            onChange={(value) =>
              setSearchParams(withApprovalStatus(searchParams, value))
            }
            style={{ width: 200 }}
            options={statusOptions}
          />
        </div>
      </Flex>

      {orders.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('approvals.loading')}
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : orders.isError ? (
        <Alert
          type="error"
          showIcon
          message={t('approvals.errorTitle')}
          description={
            orders.error instanceof Error
              ? orders.error.message
              : t('errors.generic')
          }
          action={
            <Button size="small" onClick={() => orders.refetch()}>
              {t('transfer.tryAgain')}
            </Button>
          }
        />
      ) : (
        <ProTable<TransferOrder>
          rowKey="id"
          columns={columns}
          dataSource={orders.data?.items ?? []}
          loading={orders.isFetching}
          search={false}
          options={false}
          cardBordered
          scroll={{ x: 1100 }}
          pagination={{
            current: listParams.page,
            pageSize: listParams.pageSize,
            total: orders.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [...APPROVAL_PAGE_SIZE_OPTIONS],
            showTotal: (total, range) =>
              t('approvals.range', {
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
              withApprovalPagination(searchParams, nextPage, nextPageSize),
            )
          }}
          locale={{
            emptyText: <Empty description={t('approvals.empty')} />,
          }}
        />
      )}

      <Modal
        open={decision !== null}
        title={
          decision?.mode === 'approve'
            ? t('approvals.approveTitle')
            : t('approvals.rejectTitle')
        }
        okText={
          decision?.mode === 'approve'
            ? t('approvals.submitApprove')
            : t('approvals.submitReject')
        }
        cancelText={t('payees.cancel')}
        confirmLoading={approve.isPending || reject.isPending}
        onCancel={closeDecision}
        onOk={() => form.submit()}
      >
        {decision ? (
          <div style={{ marginBottom: 16 }}>
            <Text strong>
              {formatMoney(
                decision.order.amount,
                decision.order.currency,
                locale,
              )}
            </Text>
            <div>
              <Text type="secondary">
                {maskAccountNumber(decision.order.fromAccount.accountNumber)} →{' '}
                {maskAccountNumber(decision.order.toAccount.accountNumber)} ·{' '}
                {decision.order.maker.name}
              </Text>
            </div>
          </div>
        ) : null}
        <Form<DecisionFormValues>
          form={form}
          layout="vertical"
          onFinish={submitDecision}
        >
          <Form.Item
            name="decisionNote"
            label={
              decision?.mode === 'reject'
                ? t('approvals.decisionNote')
                : t('approvals.decisionNoteOptional')
            }
            rules={
              decision?.mode === 'reject'
                ? [
                    {
                      required: true,
                      message: t('approvals.reasonRequired'),
                    },
                    { max: 200, message: t('approvals.noteTooLong') },
                  ]
                : [{ max: 200, message: t('approvals.noteTooLong') }]
            }
          >
            <Input.TextArea
              rows={3}
              placeholder={t('approvals.decisionNotePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
