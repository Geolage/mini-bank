import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 16,
      }}
    >
      <h1 className="sr-only">{t('errors.notFoundTitle')}</h1>
      <Result
        status="404"
        title="404"
        subTitle={t('errors.notFoundBody')}
        extra={
          <Button type="primary" onClick={() => navigate('/accounts')}>
            {t('errors.backToAccounts')}
          </Button>
        }
      />
    </main>
  )
}
