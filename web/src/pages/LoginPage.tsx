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
import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../app/authStore'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/types'
import { login } from '../services/auth'
import type { LoginRequest } from '../types/api'

const { Paragraph, Text, Title } = Typography

const HERO_STACK_KEYS: MessageKey[] = [
  'auth.heroStackUi',
  'auth.heroStackApi',
  'auth.heroStackQuality',
]

export function LoginPage() {
  const [form] = Form.useForm<LoginRequest>()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const token = useAuthStore((state) => state.token)
  const signIn = useAuthStore((state) => state.signIn)
  const sessionExpired = useAuthStore((state) => state.sessionExpired)
  const dismissExpiredNotice = useAuthStore(
    (state) => state.dismissExpiredNotice,
  )
  const { t } = useI18n()

  // The shell owns the document title while signed in and the login page sits outside it,
  // so without this the tab keeps the previous page's name after being bounced back.
  const documentTitle = `${t('auth.signIn')} · ${t('app.name')}`
  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/dashboard'

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

  const errorMessage = loginMutation.error ? loginMutation.error.message : null

  function fillDemo(username: 'admin' | 'visitor') {
    form.setFieldsValue({
      identifier: username,
      password: username === 'admin' ? '11111111' : '00000000',
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width={size * 0.55}
        height={size * 0.55}
      >
        <path d="M3 9.5 12 4l9 5.5V11H3V9.5Z" fill="currentColor" />
        <path
          d="M5 13h3v6H5zm5.5 0h3v6h-3zM16 13h3v6h-3z"
          fill="currentColor"
        />
        <path d="M3 20h18v2H3z" fill="currentColor" />
      </svg>
    </span>
  )

  const brandBlock = (
    size: number,
    background: string,
    taglineColor: string,
  ) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {brandMark(size, background)}
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{t('app.name')}</div>
        <div style={{ fontSize: 12, color: taglineColor }}>
          {t('app.tagline')}
        </div>
      </div>
    </div>
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
          {brandBlock(44, 'rgba(16, 185, 129, 0.15)', '#94a3b8')}

          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}>
              {t('auth.heroTitle')}
            </div>
            <Paragraph
              style={{ marginTop: 16, fontSize: 16, color: '#cbd5e1' }}
            >
              {t('auth.heroBody')}
            </Paragraph>
          </div>

          <Flex vertical gap={12} style={{ fontSize: 14, color: '#cbd5e1' }}>
            {HERO_STACK_KEYS.map((labelKey) => (
              <div
                key={labelKey}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#34d399',
                  }}
                  aria-hidden="true"
                />
                {t(labelKey)}
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
          <Flex justify="flex-end" style={{ marginBottom: 8 }}>
            <LanguageSwitcher />
          </Flex>

          {heroPanel ? null : brandBlock(40, '#020617', '#475569')}

          <Title level={1} style={{ margin: 0, fontSize: 24 }}>
            {t('auth.signIn')}
          </Title>
          <Paragraph style={{ marginTop: 4, color: '#475569' }}>
            {t('auth.signInSubtitle')}
          </Paragraph>

          {sessionExpired ? (
            <Alert
              type="warning"
              showIcon
              closable
              message={t('auth.sessionExpired')}
              onClose={dismissExpiredNotice}
              style={{ marginTop: 16 }}
            />
          ) : null}

          <Card style={{ marginTop: 24 }}>
            <Form<LoginRequest>
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ identifier: '', password: '' }}
              onFinish={(values) => loginMutation.mutate(values)}
            >
              <Form.Item
                label={t('auth.identifier')}
                name="identifier"
                rules={[
                  { required: true, message: t('auth.identifierRequired') },
                ]}
              >
                <Input
                  name="identifier"
                  size="large"
                  autoComplete="username"
                  placeholder={t('auth.identifierPlaceholder')}
                />
              </Form.Item>

              <Form.Item
                label={t('auth.password')}
                name="password"
                rules={[
                  { required: true, message: t('auth.passwordRequired') },
                  { min: 8, message: t('auth.passwordRequired') },
                ]}
              >
                <Input.Password
                  name="password"
                  size="large"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
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
                {t('auth.signIn')}
              </Button>
            </Form>

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <Text
                strong
                type="secondary"
                style={{
                  fontSize: 12,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('auth.demoAccounts')}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap size={8}>
                  <Button size="small" onClick={() => fillDemo('admin')}>
                    {t('auth.useAdmin')}
                  </Button>
                  <Button size="small" onClick={() => fillDemo('visitor')}>
                    {t('auth.useVisitor')}
                  </Button>
                </Space>
              </div>
              <Text
                type="secondary"
                style={{ display: 'block', fontSize: 12, marginTop: 8 }}
              >
                {t('auth.demoHint')}
                <br />
                {t('auth.demoHintPassword')}
              </Text>
            </div>
          </Card>
        </main>
      </Col>
    </Row>
  )
}
