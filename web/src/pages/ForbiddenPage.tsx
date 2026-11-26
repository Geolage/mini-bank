import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/types'
import type { Role } from '../types/api'

const ROLE_KEYS: Record<Role, MessageKey> = {
  OPERATOR: 'enum.role.OPERATOR',
  VIEWER: 'enum.role.VIEWER',
  CHECKER: 'enum.role.CHECKER',
}

export function ForbiddenPage({
  requiredRole,
}: {
  requiredRole?: Role | Role[]
}) {
  const navigate = useNavigate()
  const { t } = useI18n()

  const roles = requiredRole
    ? Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole]
    : []

  const subTitle =
    roles.length > 0
      ? t('errors.forbiddenRole', {
          role: roles.map((role) => t(ROLE_KEYS[role])).join(' / '),
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
