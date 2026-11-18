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
import { useEffect, useState } from 'react'
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
  const [form] = Form.useForm<TransferFormValues>()
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
          Transfer
        </Title>
        <Text type="secondary">Move money between MiniBank accounts.</Text>
      </div>

      {accounts.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            Loading accounts…
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : accounts.isError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load accounts"
          description={
            accounts.error instanceof Error
              ? accounts.error.message
              : 'Something went wrong. Please try again.'
          }
          action={
            <Button size="small" onClick={() => accounts.refetch()}>
              Try again
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
                toAccountNumber: '',
                amount: '',
                note: '',
              }}
              onFinish={(values) => {
                setReceipt(null)
                transfer.mutate(values)
              }}
            >
              <Form.Item
                label="From account"
                name="fromAccountId"
                extra="Transfers require the operator demo account."
                // AntD puts aria-required on the Select wrapper div, where ARIA forbids it.
                required={false}
                rules={[{ required: true, message: 'Choose an account' }]}
              >
                <Select
                  placeholder="Select an account"
                  loading={accounts.isFetching}
                  options={(accounts.data ?? []).map((account) => ({
                    value: account.id,
                    label: `${maskAccountNumber(account.accountNumber)} · ${formatMoney(
                      account.balance,
                      account.currency,
                    )} · ${account.currency}`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="To account number"
                name="toAccountNumber"
                rules={[
                  {
                    required: true,
                    message: 'Enter the recipient account number',
                  },
                  { min: 4, message: 'Enter the recipient account number' },
                  { max: 32, message: 'Account number is too long' },
                ]}
              >
                <Input placeholder="MB-2001-0001" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                extra="Up to 2 decimal places. Currency follows the source account."
                rules={[
                  {
                    required: true,
                    message: 'Enter a positive amount with up to 2 decimal places',
                  },
                  {
                    pattern: /^\d{1,12}(\.\d{1,2})?$/,
                    message: 'Enter a positive amount with up to 2 decimal places',
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
                label="Note (optional)"
                name="note"
                rules={[
                  { max: 140, message: 'Note must be 140 characters or fewer' },
                ]}
              >
                <Input placeholder="Rent share" autoComplete="off" />
              </Form.Item>

              {transfer.isError ? (
                <Alert
                  type="error"
                  showIcon
                  message={
                    transfer.error instanceof Error
                      ? transfer.error.message
                      : 'The transfer could not be completed.'
                  }
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              {receipt ? (
                <Alert
                  type="success"
                  showIcon
                  message="Transfer submitted"
                  description={
                    <span>
                      Reference: <Text code>{receipt.reference}</Text>
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
                Submit transfer
              </Button>
            </Form>
          </ProCard>

          <ProCard
            bordered
            title={
              <Space size={8}>
                <KeyOutlined aria-hidden="true" />
                <span>Idempotency-Key</span>
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
                Regenerate
              </Button>
            </div>
            <Text
              type="secondary"
              style={{ display: 'block', fontSize: 12, marginTop: 12 }}
            >
              Repeating a request with the same key returns the original transfer
              instead of moving money twice.
            </Text>
          </ProCard>
        </Flex>
      )}
    </div>
  )
}
