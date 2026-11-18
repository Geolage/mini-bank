import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Role } from '../types/api'

export function ForbiddenPage({ requiredRole }: { requiredRole?: Role }) {
  const navigate = useNavigate()

  return (
    <>
      <h1 className="sr-only">Access denied</h1>
      <Result
        status="403"
        title="403"
        subTitle={
          requiredRole
            ? `You do not have permission to view this page. It requires the ${requiredRole.toLowerCase()} role.`
            : 'You do not have permission to view this page.'
        }
        extra={
          <Button type="primary" onClick={() => navigate('/accounts')}>
            Back to accounts
          </Button>
        }
      />
    </>
  )
}
