import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import type { Role } from '../types/api'

export function ForbiddenPage({ requiredRole }: { requiredRole?: Role }) {
  const navigate = useNavigate()
  const { t } = useI18n()

  const subTitle = requiredRole
    ? t('errors.forbiddenRole', {
        role:
          requiredRole === 'OPERATOR'
            ? t('enum.role.OPERATOR')
            : t('enum.role.VIEWER'),
      })
    : t('errors.forbiddenBody')

  return (
    <>
      <h1 className="sr-only">{t('errors.forbiddenTitle')}</h1>
      <Result
        status="403"
        title="403"
        subTitle={subTitle}
        extra={
          <Button type="primary" onClick={() => navigate('/accounts')}>
            {t('errors.backToAccounts')}
          </Button>
        }
      />
    </>
  )
}
