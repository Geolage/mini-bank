import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import { Alert, Button, Col, Empty, Flex, Row, Space, Tag, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { accountsQueryOptions } from '../services/accounts'
import { useTheme } from '../theme/useTheme'
import { formatMoney, maskAccountNumber } from '../utils/format'

const { Title, Text } = Typography

export function AccountsPage() {
  const { locale, t } = useI18n()
  const theme = useTheme()
  const {
    data: accounts,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(accountsQueryOptions)

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
            {t('accounts.title')}
          </Title>
          <Text type="secondary">{t('accounts.subtitle')}</Text>
        </div>
        <Button
          icon={<ReloadOutlined aria-hidden="true" />}
          onClick={() => refetch()}
          loading={isFetching}
        >
          {t('accounts.refresh')}
        </Button>
      </Flex>

      {isLoading ? (
        <div>
          <span role="status" className="sr-only">
            {t('accounts.loading')}
          </span>
          <Row gutter={[16, 16]} aria-hidden="true">
            <Col xs={24} sm={12}>
              <ProCard loading bordered />
            </Col>
            <Col xs={24} sm={12}>
              <ProCard loading bordered />
            </Col>
          </Row>
        </div>
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message={t('accounts.errorTitle')}
          description={
            error instanceof Error ? error.message : t('errors.generic')
          }
          action={
            <Button size="small" onClick={() => refetch()}>
              {t('transfer.tryAgain')}
            </Button>
          }
        />
      ) : !accounts || accounts.length === 0 ? (
        <ProCard bordered>
          <Empty description={t('accounts.emptyTitle')}>
            <Text type="secondary">{t('accounts.emptyHint')}</Text>
          </Empty>
        </ProCard>
      ) : (
        <Row gutter={[16, 16]}>
          {accounts.map((account) => (
            <Col key={account.id} xs={24} sm={12}>
              <ProCard
                bordered
                headerBordered
                title={
                  <Space size={8} wrap>
                    <Tag color={account.type === 'CHECKING' ? 'blue' : 'purple'}>
                      {account.type}
                    </Tag>
                    <Text code>{maskAccountNumber(account.accountNumber)}</Text>
                  </Space>
                }
                extra={<Tag>{account.currency}</Tag>}
              >
                <Text type="secondary">{t('accounts.availableBalance')}</Text>
                <div style={{ margin: '4px 0 12px' }}>
                  <Text strong style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
                    {formatMoney(account.balance, account.currency, locale)}
                  </Text>
                </div>
                <Link
                  to={`/accounts/${account.id}/transactions`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    color: theme.config.token?.colorLink,
                  }}
                >
                  {t('accounts.viewTransactions')}
                  <ArrowRightOutlined aria-hidden="true" />
                </Link>
              </ProCard>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
