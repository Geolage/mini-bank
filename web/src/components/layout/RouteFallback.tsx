import { Skeleton } from 'antd'

export function RouteFallback() {
  return (
    <div role="status" style={{ padding: 24 }}>
      <span className="sr-only">Loading page…</span>
      <Skeleton active paragraph={{ rows: 6 }} aria-hidden="true" />
    </div>
  )
}
