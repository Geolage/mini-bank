import { KeyOutlined, ReloadOutlined } from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { accountsQueryOptions } from '../services/accounts'
import { queryKeys } from '../services/queryKeys'
import { transferAccount } from '../services/transfers'
import type { TransferResult } from '../types/api'
import { formatMoney, maskAccountNumber } from '../utils/format'

const { Title, Text } = Typography

interface TransferFormValues {
  fromAccountId: string
  toAccountNumber: string
  amount: string
  note?: string
}

export function TransferPage() {
  const { locale, t } = useI18n()
  const [form] = Form.useForm<TransferFormValues>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const accounts = useQuery(accountsQueryOptions)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const [receipt, setReceipt] = useState<TransferResult | null>(null)

  const transfer = useMutation({
    mutationFn: (values: TransferFormValues) =>
      transferAccount(
        {
          fromAccountId: values.fromAccountId,
          toAccountNumber: values.toAccountNumber,
          amount: values.amount,
          note: values.note || undefined,
        },
        idempotencyKey,
      ),
    onSuccess: (result) => {
      setReceipt(result)
      form.setFieldsValue({ toAccountNumber: '', amount: '', note: '' })
      setIdempotencyKey(crypto.randomUUID())
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      queryClient.invalidateQueries({ queryKey: queryKeys.auditAll })
    },
  })

  useEffect(() => {
    const list = accounts.data
    if (list && list.length > 0 && !form.getFieldValue('fromAccountId')) {
      form.setFieldsValue({ fromAccountId: list[0].id })
    }
  }, [accounts.data, form])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ margin: 0, fontSize: 24 }}>
          {t('transfer.title')}
        </Title>
        <Text type="secondary">{t('transfer.subtitle')}</Text>
      </div>

      {accounts.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('transfer.loading')}
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : accounts.isError ? (
        <Alert
          type="error"
          showIcon
          message={t('transfer.errorLoadAccounts')}
          description={
            accounts.error instanceof Error
              ? accounts.error.message
              : t('errors.generic')
          }
          action={
            <Button size="small" onClick={() => accounts.refetch()}>
              {t('transfer.tryAgain')}
            </Button>
          }
        />
      ) : (
        <Flex wrap gap={16} align="flex-start">
          <ProCard bordered style={{ flex: '1.4 1 320px' }}>
            <Form<TransferFormValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{
                fromAccountId: '',
                toAccountNumber: searchParams.get('to') ?? '',
                amount: '',
                note: '',
              }}
              onFinish={(values) => {
                setReceipt(null)
                transfer.mutate(values)
              }}
            >
              <Form.Item
                label={t('transfer.from')}
                name="fromAccountId"
                extra={t('transfer.fromExtra')}
                // AntD puts aria-required on the Select wrapper div, where ARIA forbids it.
                required={false}
                rules={[{ required: true, message: t('transfer.fromRequired') }]}
              >
                <Select
                  placeholder={t('transfer.selectAccount')}
                  loading={accounts.isFetching}
                  options={(accounts.data ?? []).map((account) => ({
                    value: account.id,
                    label: `${maskAccountNumber(account.accountNumber)} · ${formatMoney(
                      account.balance,
                      account.currency,
                      locale,
                    )}`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={t('transfer.to')}
                name="toAccountNumber"
                rules={[
                  { required: true, message: t('transfer.toRequired') },
                  { min: 4, message: t('transfer.toLength') },
                  { max: 32, message: t('transfer.tooLong') },
                ]}
              >
                <Input placeholder="MB-2001-0001" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label={t('transfer.amount')}
                name="amount"
                extra={t('transfer.amountExtra')}
                rules={[
                  { required: true, message: t('transfer.amountInvalid') },
                  {
                    pattern: /^\d{1,12}(\.\d{1,2})?$/,
                    message: t('transfer.amountInvalid'),
                  },
                ]}
              >
                <Input
                  inputMode="decimal"
                  placeholder="120.50"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                label={t('transfer.note')}
                name="note"
                rules={[{ max: 140, message: t('transfer.noteTooLong') }]}
              >
                <Input
                  placeholder={t('transfer.notePlaceholder')}
                  autoComplete="off"
                />
              </Form.Item>

              {transfer.isError ? (
                <Alert
                  type="error"
                  showIcon
                  message={
                    transfer.error instanceof Error
                      ? transfer.error.message
                      : t('transfer.errorTitle')
                  }
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              {receipt ? (
                <Alert
                  type="success"
                  showIcon
                  message={t('transfer.success')}
                  description={
                    <span>
                      {t('transfer.reference')}{' '}
                      <Text code>{receipt.reference}</Text>
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={transfer.isPending}
              >
                {t('transfer.submit')}
              </Button>
            </Form>
          </ProCard>

          <ProCard
            bordered
            title={
              <Space size={8}>
                <KeyOutlined aria-hidden="true" />
                <span>{t('transfer.idempotencyKey')}</span>
              </Space>
            }
            style={{ height: 'fit-content', flex: '1 1 240px' }}
          >
            <Text code style={{ wordBreak: 'break-all' }}>
              {idempotencyKey}
            </Text>
            <div style={{ marginTop: 12 }}>
              <Button
                size="small"
                icon={<ReloadOutlined aria-hidden="true" />}
                onClick={() => setIdempotencyKey(crypto.randomUUID())}
              >
                {t('transfer.regenerate')}
              </Button>
            </div>
            <Text
              type="secondary"
              style={{ display: 'block', fontSize: 12, marginTop: 12 }}
            >
              {t('transfer.idempotencyHint')}
            </Text>
          </ProCard>
        </Flex>
      )}
    </div>
  )
}
