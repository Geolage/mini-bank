import { useState } from 'react'
import { ProCard } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  Col,
  Empty,
  Flex,
  List,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../app/authStore'
import { CashFlowChart } from '../components/CashFlowChart'
import { useI18n } from '../i18n/useI18n'
import { dashboardQueryOptions } from '../services/dashboard'
import type { Currency } from '../types/api'
import { formatDateTime, formatMoney, maskAccountNumber } from '../utils/format'

const { Title, Text } = Typography

export function DashboardPage() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const overview = useQuery(dashboardQueryOptions)
  const [currency, setCurrency] = useState<Currency | null>(null)

  const data = overview.data
  const activeCurrency =
    currency ?? data?.series[0]?.currency ?? data?.totals[0]?.currency ?? 'USD'
  const series = data?.series.find((entry) => entry.currency === activeCurrency)
  const month = data?.month.find((entry) => entry.currency === activeCurrency)

  const [now] = useState(() => new Date())
  const hour = now.getHours()
  const greetingKey =
    hour < 12
      ? 'dashboard.greetingMorning'
      : hour < 18
        ? 'dashboard.greetingAfternoon'
        : 'dashboard.greetingEvening'

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
            {t(greetingKey, { name: user?.name ?? '' })}
          </Title>
          <Text type="secondary">
            {new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(now)}
            {' · '}
            {t('dashboard.subtitle')}
          </Text>
        </div>
        <Space size={8} wrap>
          {user?.role === 'OPERATOR' ? (
            <Button type="primary" onClick={() => navigate('/transfer')}>
              {t('dashboard.quickTransfer')}
            </Button>
          ) : null}
          <Button onClick={() => navigate('/payees')}>
            {t('dashboard.quickPayees')}
          </Button>
          <Button onClick={() => navigate('/accounts')}>
            {t('dashboard.viewAll')}
          </Button>
        </Space>
      </Flex>

      {overview.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('dashboard.loading')}
          </span>
          <Row gutter={[16, 16]} aria-hidden="true">
            <Col xs={24} md={8}>
              <ProCard loading bordered />
            </Col>
            <Col xs={24} md={8}>
              <ProCard loading bordered />
            </Col>
            <Col xs={24} md={8}>
              <ProCard loading bordered />
            </Col>
          </Row>
        </div>
      ) : overview.isError ? (
        <Alert
          type="error"
          showIcon
          message={t('dashboard.errorTitle')}
          description={
            overview.error instanceof Error
              ? overview.error.message
              : 'Something went wrong. Please try again.'
          }
          action={
            <Button size="small" onClick={() => overview.refetch()}>
              {t('transfer.tryAgain')}
            </Button>
          }
        />
      ) : !data || data.totals.length === 0 ? (
        <ProCard bordered>
          <Empty description={t('dashboard.noAccounts')}>
            <Text type="secondary">{t('dashboard.noAccountsHint')}</Text>
          </Empty>
        </ProCard>
      ) : (
        <Flex vertical gap={16}>
          <Row gutter={[16, 16]}>
            {data.totals.map((total) => (
              <Col key={total.currency} xs={24} sm={12} lg={8}>
                <ProCard bordered>
                  <Flex justify="space-between" align="center">
                    <Text type="secondary">{t('dashboard.totalBalance')}</Text>
                    <Tag>{total.currency}</Tag>
                  </Flex>
                  <div style={{ margin: '4px 0 8px' }}>
                    <Text
                      strong
                      style={{ fontSize: 28, letterSpacing: '-0.02em' }}
                    >
                      {formatMoney(total.balance, total.currency, locale)}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('dashboard.accountsCount', { count: total.accounts })}
                  </Text>
                </ProCard>
              </Col>
            ))}
            <Col xs={24} sm={12} lg={8}>
              <ProCard bordered>
                <Flex justify="space-between" align="center">
                  <Text type="secondary">{t('dashboard.payees')}</Text>
                  <Tag>{data.payeeCount}</Tag>
                </Flex>
                <div style={{ margin: '4px 0 8px' }}>
                  <Link
                    to="/payees"
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: 'var(--accent-strong-color)',
                    }}
                  >
                    {t('dashboard.payeesHint')}
                  </Link>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('dashboard.subtitle')}
                </Text>
              </ProCard>
            </Col>
          </Row>

          <ProCard
            bordered
            title={t('dashboard.cashFlow')}
            extra={
              <Select
                aria-label={t('dashboard.currency')}
                value={activeCurrency}
                style={{ width: 110 }}
                onChange={(value) => setCurrency(value)}
                options={data.series.map((entry) => ({
                  value: entry.currency,
                  label: entry.currency,
                }))}
              />
            }
          >
            <Flex gap={24} wrap style={{ marginBottom: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('dashboard.monthIn')}
                </Text>
                <div>
                  <Text strong style={{ color: '#047857' }}>
                    +
                    {formatMoney(
                      month?.incoming ?? '0',
                      activeCurrency,
                      locale,
                    )}
                  </Text>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('dashboard.monthOut')}
                </Text>
                <div>
                  <Text strong style={{ color: '#d4380d' }}>
                    -
                    {formatMoney(
                      month?.outgoing ?? '0',
                      activeCurrency,
                      locale,
                    )}
                  </Text>
                </div>
              </div>
            </Flex>
            {series ? (
              <CashFlowChart
                points={series.points}
                currency={activeCurrency}
                locale={locale}
              />
            ) : null}
          </ProCard>

          <ProCard bordered title={t('dashboard.recent')}>
            {data.recent.length === 0 ? (
              <Empty description={t('dashboard.recentEmpty')} />
            ) : (
              <List
                dataSource={data.recent}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Link
                        key="statement"
                        to={`/accounts/${item.accountId}/transactions`}
                      >
                        {t('accounts.viewTransactions')}
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space size={8} wrap>
                          <Tag
                            color={
                              item.direction === 'INCOMING' ? 'green' : 'orange'
                            }
                          >
                            {item.direction === 'INCOMING'
                              ? t('transactions.incoming')
                              : t('transactions.outgoing')}
                          </Tag>
                          <Text code>{item.reference}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {maskAccountNumber(item.counterpartyAccountNumber)}
                          </Text>
                        </Space>
                      }
                      description={
                        <Space size={8} wrap>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDateTime(item.createdAt, locale)}
                          </Text>
                          {item.note ? (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.note}
                            </Text>
                          ) : null}
                        </Space>
                      }
                    />
                    <Text
                      strong
                      type={
                        item.direction === 'INCOMING' ? 'success' : 'danger'
                      }
                    >
                      {item.direction === 'INCOMING' ? '+' : '-'}
                      {formatMoney(item.amount, item.currency, locale)}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </ProCard>
        </Flex>
      )}
    </div>
  )
}
