import { BankOutlined, DownOutlined, LogoutOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Avatar, Breadcrumb, Button, Dropdown, Flex, Grid, Space, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/authStore'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { useI18n } from '../../i18n/useI18n'
import { useTheme } from '../../theme/useTheme'
import { RouteFallback } from './RouteFallback'
import {
  buildMenuRoutes,
  getBreadcrumbTrail,
  getSelectedMenuKeys,
} from './navigation'

const identityLabelStyle = { color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }
const identityMetaStyle = { color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const { t } = useI18n()
  const preset = useTheme()

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  const menuRoutes = buildMenuRoutes(user?.role ?? null).map((route) => ({
    path: route.path,
    name: t(route.nameKey),
    icon: route.icon,
  }))
  const breadcrumbTrail = getBreadcrumbTrail(location.pathname)
  const initial = user?.name.trim().charAt(0).toUpperCase() || '?'

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'identity',
      disabled: true,
      label: (
        <div style={{ paddingBlock: 4 }}>
          <div style={identityLabelStyle}>{user?.name}</div>
          <div style={identityMetaStyle}>{user?.email}</div>
          <Tag
            color={user?.role === 'OPERATOR' ? 'green' : undefined}
            style={{ marginTop: 8 }}
          >
            {user?.role}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('app.signOut') },
  ]

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t('app.skipToMain')}
      </a>

      <ProLayout
        title={t('app.name')}
        logo={<BankOutlined style={{ color: preset.config.token?.colorPrimary }} />}
        layout="mix"
        navTheme="light"
        fixedHeader
        fixSiderbar
        siderWidth={224}
        token={{
          bgLayout: '#f1f5f9',
          sider: preset.sider,
        }}
        route={{ path: '/', routes: menuRoutes }}
        location={{ pathname: location.pathname }}
        selectedKeys={getSelectedMenuKeys(location.pathname)}
        pageTitleRender={() => {
          const currentPage = breadcrumbTrail.at(-1)
          return currentPage
            ? `${t(currentPage.labelKey)} - ${t('app.name')}`
            : t('app.name')
        }}
        menuHeaderRender={(logo, title) => (
          <Link
            to="/accounts"
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
          >
            {logo}
            {title}
          </Link>
        )}
        onMenuHeaderClick={() => navigate('/accounts')}
        menuItemRender={(item, dom) =>
          item.path ? (
            <Link
              to={item.path}
              onClick={() => {
                if (!screens.md) item.onClick()
              }}
            >
              {dom}
            </Link>
          ) : (
            dom
          )
        }
        actionsRender={() => [
          // One row, pushed to the right edge of the header and vertically centred in its
          // 56px band, so the three controls cannot drift apart as their labels change.
          <Flex
            key="actions"
            align="center"
            gap={4}
            style={{ marginInlineStart: 'auto', height: 56 }}
          >
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout()
                },
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                aria-label={t('app.accountMenu')}
                style={{ height: 40, paddingInline: 8 }}
              >
                <Space size={8}>
                  <Avatar
                    size="small"
                    style={{ backgroundColor: preset.config.token?.colorPrimary }}
                  >
                    {initial}
                  </Avatar>
                  {screens.sm ? <span>{user?.name}</span> : null}
                  <DownOutlined style={{ fontSize: 10 }} />
                </Space>
              </Button>
            </Dropdown>
          </Flex>,
        ]}
        contentStyle={{ padding: 0 }}
        footerRender={false}
      >
        <main
          id="main-content"
          style={{
            minHeight: 'calc(100vh - 56px)',
            paddingInline: screens.lg ? 40 : screens.sm ? 24 : 16,
            paddingBlock: screens.lg ? 32 : 24,
          }}
        >
          <div style={{ marginInline: 'auto', maxWidth: 1024, width: '100%' }}>
            {breadcrumbTrail.length > 0 ? (
              <Breadcrumb
                items={breadcrumbTrail.map((item) => ({
                  title: item.to ? (
                    <Link to={item.to}>{t(item.labelKey)}</Link>
                  ) : (
                    t(item.labelKey)
                  ),
                }))}
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </ProLayout>
    </>
  )
}
