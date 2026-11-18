import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Grid,
  Input,
  Row,
  Space,
  Typography,
} from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../app/authStore'
import { login } from '../services/auth'
import type { LoginRequest } from '../types/api'

const { Paragraph, Text, Title } = Typography

export function LoginPage() {
  const [form] = Form.useForm<LoginRequest>()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const token = useAuthStore((state) => state.token)
  const signIn = useAuthStore((state) => state.signIn)

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/accounts'

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      signIn(result)
      navigate(redirectTo, { replace: true })
    },
  })

  if (token) {
    return <Navigate to={redirectTo} replace />
  }

  const errorMessage = loginMutation.error
    ? loginMutation.error.message
    : null

  function fillDemo(role: 'operator' | 'viewer') {
    form.setFieldsValue({
      email: `${role}@minibank.dev`,
      password: 'Password123!',
    })
  }

  const heroPanel = Boolean(screens.lg)

  const brandMark = (size: number, background: string) => (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: 12,
        background,
        color: '#34d399',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" width={size * 0.55} height={size * 0.55}>
        <path d="M3 9.5 12 4l9 5.5V11H3V9.5Z" fill="currentColor" />
        <path d="M5 13h3v6H5zm5.5 0h3v6h-3zM16 13h3v6h-3z" fill="currentColor" />
        <path d="M3 20h18v2H3z" fill="currentColor" />
      </svg>
    </span>
  )

  return (
    <Row style={{ minHeight: '100vh' }}>
      {heroPanel ? (
        <Col
          xs={24}
          lg={12}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 48,
            padding: 48,
            background: '#020617',
            color: '#f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {brandMark(44, 'rgba(16, 185, 129, 0.15)')}
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>MiniBank</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Account Console</div>
            </div>
          </div>

          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}>
              Banking operations, without the noise.
            </div>
            <Paragraph style={{ marginTop: 16, fontSize: 16, color: '#cbd5e1' }}>
              A full-stack demo covering authentication, account balances, transfers,
              audit trails and WCAG AA accessibility.
            </Paragraph>
          </div>

          <Flex vertical gap={12} style={{ fontSize: 14, color: '#cbd5e1' }}>
            {[
              'React + TypeScript + TanStack Query',
              'NestJS + PostgreSQL + Prisma',
              'Ant Design, tested and CI-ready',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#34d399',
                  }}
                  aria-hidden="true"
                />
                {item}
              </div>
            ))}
          </Flex>
        </Col>
      ) : null}

      <Col
        xs={24}
        lg={12}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: heroPanel ? 40 : 24,
        }}
      >
        <main style={{ width: '100%', maxWidth: 420 }}>
          {heroPanel ? null : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              {brandMark(40, '#020617')}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>MiniBank</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Account Console</div>
              </div>
            </div>
          )}

          <Title level={1} style={{ margin: 0, fontSize: 24 }}>
            Sign in
          </Title>
          <Paragraph style={{ marginTop: 4, color: '#475569' }}>
            Use a demo account to explore the console.
          </Paragraph>

          <Card style={{ marginTop: 24 }}>
            <Form<LoginRequest>
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ email: '', password: '' }}
              onFinish={(values) => loginMutation.mutate(values)}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email address' },
                ]}
              >
                <Input
                  name="email"
                  type="email"
                  size="large"
                  autoComplete="email"
                  placeholder="you@minibank.dev"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Password must be at least 8 characters',
                  },
                  {
                    min: 8,
                    message: 'Password must be at least 8 characters',
                  },
                ]}
              >
                <Input.Password
                  name="password"
                  size="large"
                  autoComplete="current-password"
                  placeholder="At least 8 characters"
                />
              </Form.Item>

              {errorMessage ? (
                <Alert
                  type="error"
                  showIcon
                  message={errorMessage}
                  style={{ marginBottom: 16 }}
                />
              ) : null}

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loginMutation.isPending}
              >
                Sign in
              </Button>
            </Form>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <Text
                strong
                type="secondary"
                style={{ fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}
              >
                Demo accounts
              </Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap size={8}>
                  <Button size="small" onClick={() => fillDemo('operator')}>
                    Use operator
                  </Button>
                  <Button size="small" onClick={() => fillDemo('viewer')}>
                    Use viewer
                  </Button>
                </Space>
              </div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
                operator@minibank.dev · viewer@minibank.dev
                <br />
                Password: Password123!
              </Text>
            </div>
          </Card>
        </main>
      </Col>
    </Row>
  )
}
