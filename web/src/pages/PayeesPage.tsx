import { useEffect, useState } from 'react'
import { ProCard, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import {
  Alert,
  App,
  Avatar,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { CheckboxProps } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../app/authStore'
import { useI18n } from '../i18n/useI18n'
import {
  createPayee,
  deletePayee,
  payeesQueryOptions,
  updatePayee,
} from '../services/payees'
import { queryKeys } from '../services/queryKeys'
import { useTheme } from '../theme/useTheme'
import type { Paginated, Payee, PayeeInput } from '../types/api'
import { formatDateTime, maskAccountNumber } from '../utils/format'
import {
  PAYEE_PAGE_SIZE_OPTIONS,
  PAYEE_SORTS,
  readPayeeParams,
  withPayeeFilters,
  withPayeePagination,
} from './payeesSearchParams'

const { Title, Text } = Typography

type DrawerState =
  | { mode: 'create' }
  | { mode: 'edit'; payee: Payee }
  | { mode: 'detail'; payee: Payee }
  | null

export function PayeesPage() {
  const { locale, t } = useI18n()
  const preset = useTheme()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const listParams = readPayeeParams(searchParams)
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const role = useAuthStore((state) => state.user?.role)

  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [form] = Form.useForm<PayeeInput>()

  const payees = useQuery(payeesQueryOptions(listParams))

  useEffect(() => {
    if (drawer?.mode === 'edit') {
      form.setFieldsValue({
        name: drawer.payee.name,
        accountNumber: drawer.payee.accountNumber,
        bankName: drawer.payee.bankName,
        note: drawer.payee.note ?? undefined,
      })
    }
    if (drawer?.mode === 'create') form.resetFields()
  }, [drawer, form])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.payeesAll })
  }

  const saveMutation = useMutation({
    mutationFn: (input: PayeeInput) =>
      drawer?.mode === 'edit'
        ? updatePayee(drawer.payee.id, input)
        : createPayee(input),
    onSuccess: () => {
      message.success(
        drawer?.mode === 'edit' ? t('payees.updated') : t('payees.created'),
      )
      setDrawer(null)
      invalidate()
    },
    onError: (error: Error) => message.error(error.message),
  })

  function restore(removed: Payee[]) {
    Promise.all(
      removed.map((payee) =>
        createPayee({
          name: payee.name,
          accountNumber: payee.accountNumber,
          bankName: payee.bankName,
          note: payee.note ?? undefined,
        }),
      ),
    )
      .then(() => {
        message.success(t('payees.restored'))
        invalidate()
      })
      .catch((error: Error) => {
        message.error(error.message)
        invalidate()
      })
  }

  function removePayees(ids: string[]) {
    const removed = (payees.data?.items ?? []).filter((payee) =>
      ids.includes(payee.id),
    )

    queryClient.setQueriesData(
      { queryKey: queryKeys.payeesAll },
      (old: Paginated<Payee> | undefined) =>
        old
          ? {
              ...old,
              items: old.items.filter((payee) => !ids.includes(payee.id)),
              total: Math.max(0, old.total - ids.length),
            }
          : old,
    )
    setSelectedKeys((keys) => keys.filter((key) => !ids.includes(key)))
    if (drawer?.mode === 'detail' && ids.includes(drawer.payee.id)) {
      setDrawer(null)
    }

    Promise.all(ids.map((id) => deletePayee(id)))
      .then(() => {
        const label =
          removed.length === 1
            ? t('payees.deleted', { name: removed[0].name })
            : t('payees.bulkDeleted', { count: removed.length })
        message.open({
          key: 'payee-delete',
          duration: 6,
          content: (
            <Space size={8}>
              <span>{label}</span>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  message.destroy('payee-delete')
                  restore(removed)
                }}
              >
                {t('payees.undo')}
              </Button>
            </Space>
          ),
        })
        invalidate()
      })
      .catch((error: Error) => {
        message.error(error.message)
        invalidate()
      })
  }

  const columns: ProColumns<Payee>[] = [
    {
      title: t('payees.column.name'),
      dataIndex: 'name',
      align: 'center',
      width: 220,
      render: (_, payee) => (
        <Space size={8}>
          <Avatar size="small" style={{ backgroundColor: preset.config.token?.colorPrimary }}>
            {payee.name.slice(0, 1).toUpperCase()}
          </Avatar>
          <Text strong>{payee.name}</Text>
        </Space>
      ),
    },
    {
      title: t('payees.column.account'),
      dataIndex: 'accountNumber',
      align: 'center',
      width: 190,
      render: (_, payee) => (
        <Text
          code
          copyable={{
            text: payee.accountNumber,
            tooltips: [t('payees.copyAccount'), t('payees.copied')],
          }}
        >
          {maskAccountNumber(payee.accountNumber)}
        </Text>
      ),
    },
    {
      title: t('payees.column.bank'),
      dataIndex: 'bankName',
      align: 'center',
      width: 140,
      render: (_, payee) => <Tag>{payee.bankName}</Tag>,
    },
    {
      title: t('payees.column.note'),
      dataIndex: 'note',
      align: 'center',
      ellipsis: { showTitle: false },
      render: (_, payee) =>
        payee.note ? (
          <Tooltip placement="topLeft" title={payee.note}>
            <span>{payee.note}</span>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: t('payees.column.updated'),
      dataIndex: 'updatedAt',
      align: 'center',
      width: 190,
      render: (_, payee) => formatDateTime(payee.updatedAt, locale),
    },
    {
      title: t('payees.column.actions'),
      align: 'center',
      width: 150,
      render: (_, payee) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              setDrawer({ mode: 'edit', payee })
            }}
          >
            {t('payees.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={(event) => {
              event.stopPropagation()
              removePayees([payee.id])
            }}
          >
            {t('payees.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  const hasFilters = Boolean(listParams.q) || listParams.sort !== 'name'

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
            {t('payees.title')}
          </Title>
          <Text type="secondary">{t('payees.subtitle')}</Text>
        </div>
        <Button type="primary" onClick={() => setDrawer({ mode: 'create' })}>
          {t('payees.new')}
        </Button>
      </Flex>

      <Flex wrap gap={12} align="flex-end" style={{ marginBottom: 16 }}>
        <Input.Search
          key={listParams.q ?? 'all'}
          defaultValue={listParams.q}
          allowClear
          placeholder={t('payees.searchPlaceholder')}
          style={{ width: 280 }}
          onSearch={(value) =>
            setSearchParams(
              withPayeeFilters(searchParams, {
                q: value.trim() || undefined,
                sort: listParams.sort,
              }),
            )
          }
        />
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
          >
            {t('payees.sortLabel')}
          </Text>
          <Select
            aria-label={t('payees.sortLabel')}
            value={listParams.sort}
            style={{ width: 180 }}
            onChange={(sort) =>
              setSearchParams(
                withPayeeFilters(searchParams, { q: listParams.q, sort }),
              )
            }
            options={PAYEE_SORTS.map((sort) => ({
              value: sort,
              label: t(`payees.sort.${sort}`),
            }))}
          />
        </div>
        <Button
          disabled={!hasFilters}
          onClick={() => setSearchParams(withPayeeFilters(searchParams, {}))}
        >
          {t('transactions.clearFilters')}
        </Button>
        {selectedKeys.length > 0 ? (
          <Space size={8}>
            <Text type="secondary">
              {t('payees.selected', { count: selectedKeys.length })}
            </Text>
            <Button danger onClick={() => removePayees(selectedKeys)}>
              {t('payees.deleteSelected')}
            </Button>
          </Space>
        ) : null}
      </Flex>

      {payees.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('payees.loading')}
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : payees.isError ? (
        <Alert
          type="error"
          showIcon
          message={t('payees.errorTitle')}
          description={
            payees.error instanceof Error
              ? payees.error.message
              : 'Something went wrong. Please try again.'
          }
          action={
            <Button size="small" onClick={() => payees.refetch()}>
              {t('transfer.tryAgain')}
            </Button>
          }
        />
      ) : (
        <ProTable<Payee>
          rowKey="id"
          columns={columns}
          dataSource={payees.data?.items ?? []}
          loading={payees.isFetching}
          search={false}
          options={false}
          cardBordered
          scroll={{ x: 900 }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys as string[]),
            preserveSelectedRowKeys: true,
            getCheckboxProps: (payee) =>
              ({
                'aria-label': t('payees.selectRow', { name: payee.name }),
              }) as CheckboxProps,
            columnTitle: (
              <Checkbox
                aria-label={t('payees.selectAll')}
                checked={
                  (payees.data?.items.length ?? 0) > 0 &&
                  (payees.data?.items ?? []).every((payee) =>
                    selectedKeys.includes(payee.id),
                  )
                }
                indeterminate={
                  (payees.data?.items ?? []).some((payee) =>
                    selectedKeys.includes(payee.id),
                  ) &&
                  !(payees.data?.items ?? []).every((payee) =>
                    selectedKeys.includes(payee.id),
                  )
                }
                onChange={(event) =>
                  setSelectedKeys((keys) => {
                    const pageIds = (payees.data?.items ?? []).map(
                      (payee) => payee.id,
                    )
                    return event.target.checked
                      ? [...new Set([...keys, ...pageIds])]
                      : keys.filter((key) => !pageIds.includes(key))
                  })
                }
              />
            ),
          }}
          onRow={(payee) => ({
            onClick: () => setDrawer({ mode: 'detail', payee }),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: listParams.page,
            pageSize: listParams.pageSize,
            total: payees.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [...PAYEE_PAGE_SIZE_OPTIONS],
            showTotal: (total, range) =>
              t('payees.range', { from: range[0], to: range[1], total }),
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
              withPayeePagination(searchParams, nextPage, nextPageSize),
            )
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  listParams.q ? t('payees.emptySearch') : t('payees.empty')
                }
              >
                {listParams.q ? null : (
                  <Text type="secondary">{t('payees.emptyHint')}</Text>
                )}
              </Empty>
            ),
          }}
        />
      )}

      <Drawer
        open={drawer?.mode === 'create' || drawer?.mode === 'edit'}
        onClose={() => setDrawer(null)}
        width={440}
        title={drawer?.mode === 'edit' ? t('payees.edit') : t('payees.new')}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={() => setDrawer(null)}>{t('payees.cancel')}</Button>
            <Button
              type="primary"
              loading={saveMutation.isPending}
              onClick={() => form.submit()}
            >
              {t('payees.save')}
            </Button>
          </Flex>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Form.Item
            label={t('payees.form.name')}
            name="name"
            rules={[
              { required: true, message: t('payees.form.nameRequired') },
              { max: 60 },
            ]}
          >
            <Input placeholder={t('payees.form.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('payees.form.account')}
            name="accountNumber"
            rules={[
              {
                required: true,
                pattern: /^MB-\d{4}-\d{4}$/,
                message: t('payees.form.accountRequired'),
              },
            ]}
          >
            <Input placeholder={t('payees.form.accountPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('payees.form.bank')} name="bankName">
            <Input placeholder={t('payees.form.bankPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('payees.form.note')} name="note">
            <Input.TextArea
              rows={3}
              maxLength={140}
              placeholder={t('payees.form.notePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        open={drawer?.mode === 'detail'}
        onClose={() => setDrawer(null)}
        width={440}
        title={t('payees.detail')}
        footer={
          drawer?.mode === 'detail' ? (
            <Flex justify="space-between" gap={8}>
              <Button
                danger
                onClick={() => removePayees([drawer.payee.id])}
              >
                {t('payees.delete')}
              </Button>
              <Space size={8}>
                <Button
                  onClick={() =>
                    setDrawer({ mode: 'edit', payee: drawer.payee })
                  }
                >
                  {t('payees.edit')}
                </Button>
                {role === 'OPERATOR' ? (
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/transfer?to=${encodeURIComponent(drawer.payee.accountNumber)}`,
                      )
                    }
                  >
                    {t('payees.transferTo')}
                  </Button>
                ) : null}
              </Space>
            </Flex>
          ) : null
        }
      >
        {drawer?.mode === 'detail' ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('payees.column.name')}>
              {drawer.payee.name}
            </Descriptions.Item>
            <Descriptions.Item label={t('payees.fullAccount')}>
              <Text code copyable={{ text: drawer.payee.accountNumber }}>
                {drawer.payee.accountNumber}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payees.column.bank')}>
              {drawer.payee.bankName}
            </Descriptions.Item>
            <Descriptions.Item label={t('payees.column.note')}>
              {drawer.payee.note ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payees.addedOn')}>
              {formatDateTime(drawer.payee.createdAt, locale)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payees.column.updated')}>
              {formatDateTime(drawer.payee.updatedAt, locale)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  )
}
