import { BankOutlined, DownOutlined, LogoutOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Avatar, Breadcrumb, Button, Dropdown, Grid, Space, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/authStore'
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

  function handleLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

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
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out' },
  ]

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <ProLayout
        title="MiniBank"
        logo={<BankOutlined style={{ color: '#047857' }} />}
        layout="side"
        navTheme="light"
        fixedHeader
        fixSiderbar
        siderWidth={224}
        token={{
          bgLayout: '#f1f5f9',
          sider: {
            colorBgMenuItemHover: '#f8fafc',
            colorBgMenuItemSelected: '#ecfdf5',
            colorTextMenuSelected: '#047857',
            colorTextMenuActive: '#047857',
          },
        }}
        route={{ path: '/', routes: buildMenuRoutes(user?.role ?? null) }}
        location={{ pathname: location.pathname }}
        selectedKeys={getSelectedMenuKeys(location.pathname)}
        pageTitleRender={() => {
          const currentPage = breadcrumbTrail.at(-1)?.label
          return currentPage ? `${currentPage} - MiniBank` : 'MiniBank'
        }}
        menuHeaderRender={(logo, title) => (
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
          >
            {logo}
            {title}
          </span>
        )}
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
          <Dropdown
            key="user-menu"
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
              aria-label="Account menu"
              style={{ height: 40, paddingInline: 8 }}
            >
              <Space size={8}>
                <Avatar size="small" style={{ backgroundColor: '#047857' }}>
                  {initial}
                </Avatar>
                {screens.sm ? <span>{user?.name}</span> : null}
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>,
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
                    <Link to={item.to}>{item.label}</Link>
                  ) : (
                    item.label
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
