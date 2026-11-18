import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

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
      <h1 className="sr-only">Page not found</h1>
      <Result
        status="404"
        title="404"
        subTitle="The page you requested does not exist or has moved."
        extra={
          <Button type="primary" onClick={() => navigate('/accounts')}>
            Back to accounts
          </Button>
        }
      />
    </main>
  )
}
