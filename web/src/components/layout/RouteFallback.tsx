import { Skeleton } from 'antd'
import { useI18n } from '../../i18n/useI18n'

export function RouteFallback() {
  const { t } = useI18n()

  return (
    <div role="status" style={{ padding: 24 }}>
      <span className="sr-only">{t('app.loadingPage')}</span>
      <Skeleton active paragraph={{ rows: 6 }} aria-hidden="true" />
    </div>
  )
}
