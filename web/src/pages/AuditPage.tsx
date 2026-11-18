import { ProCard, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Flex,
  Input,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { auditQueryOptions } from '../services/audit'
import type { AuditListParams, AuditLog } from '../types/api'
import { formatDateTime } from '../utils/format'
import {
  AUDIT_PAGE_SIZE_OPTIONS,
  readAuditParams,
  withAuditFilters,
  withAuditPagination,
} from './auditSearchParams'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function describeMetadata(metadata: unknown): string {
  if (!metadata) return '—'
  if (typeof metadata === 'string') return metadata
  try {
    return JSON.stringify(metadata)
  } catch {
    return '—'
  }
}

export function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const listParams = readAuditParams(searchParams)
  const audit = useQuery(auditQueryOptions(listParams))

  const { action, actorId, from, to } = listParams
  const hasFilters = Boolean(action || actorId || from || to)

  function updateFilters(
    filters: Pick<AuditListParams, 'action' | 'actorId' | 'from' | 'to'>,
  ) {
    setSearchParams(withAuditFilters(searchParams, filters))
  }

  const columns: ProColumns<AuditLog>[] = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      width: 190,
      render: (_, log) => formatDateTime(log.createdAt),
    },
    {
      title: 'Actor',
      width: 200,
      render: (_, log) => (
        <Space direction="vertical" size={0}>
          <Text>{log.actor.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {log.actor.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 220,
      render: (_, log) => <Tag>{log.action}</Tag>,
    },
    {
      title: 'Resource',
      width: 220,
      render: (_, log) =>
        log.resourceId
          ? `${log.resourceType} · ${log.resourceId.slice(0, 8)}…`
          : log.resourceType,
    },
    {
      title: 'Details',
      dataIndex: 'metadata',
      ellipsis: true,
      render: (_, log) => <Text code>{describeMetadata(log.metadata)}</Text>,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={1} style={{ margin: 0, fontSize: 24 }}>
          Audit log
        </Title>
        <Text type="secondary">
          Who did what, and when. Visible to operators only.
        </Text>
      </div>

      <Flex wrap gap={12} align="flex-end" style={{ marginBottom: 16 }}>
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 4 }}
          >
            Action
          </Text>
          <Input.Search
            key={action ?? 'all-actions'}
            defaultValue={action}
            placeholder="TRANSFER_CREATED"
            allowClear
            style={{ width: 240 }}
            onSearch={(value) =>
              updateFilters({
                action: value.trim() || undefined,
                actorId,
                from,
                to,
              })
            }
          />
        </div>
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
                action,
                actorId,
                from: dates?.[0]?.format('YYYY-MM-DD'),
                to: dates?.[1]?.format('YYYY-MM-DD'),
              })
            }
            style={{ width: 260 }}
          />
        </div>
        <Button disabled={!hasFilters} onClick={() => updateFilters({})}>
          Clear filters
        </Button>
      </Flex>

      {audit.isLoading ? (
        <div>
          <span role="status" className="sr-only">
            Loading audit logs…
          </span>
          <ProCard bordered aria-hidden="true">
            <Skeleton active paragraph={{ rows: 6 }} />
          </ProCard>
        </div>
      ) : audit.isError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load audit logs"
          description={
            audit.error instanceof Error
              ? audit.error.message
              : 'Something went wrong. Please try again.'
          }
          action={
            <Button size="small" onClick={() => audit.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <ProTable<AuditLog>
          rowKey="id"
          columns={columns}
          dataSource={audit.data?.items ?? []}
          loading={audit.isFetching}
          search={false}
          options={false}
          cardBordered
          scroll={{ x: 900 }}
          pagination={{
            current: listParams.page,
            pageSize: listParams.pageSize,
            total: audit.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [...AUDIT_PAGE_SIZE_OPTIONS],
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
              withAuditPagination(searchParams, nextPage, nextPageSize),
            )
          }}
          locale={{
            emptyText: <Empty description="No audit entries match these filters." />,
          }}
        />
      )}
    </div>
  )
}
