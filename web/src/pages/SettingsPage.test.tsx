import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferencesStore } from '../app/preferencesStore'
import { AppProviders } from '../app/AppProviders'
import { SettingsPage } from './SettingsPage'

function renderSettings() {
  return render(
    <AppProviders>
      <SettingsPage />
    </AppProviders>,
  )
}

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
})

describe('SettingsPage', () => {
  it('lists every theme preset with the current one selected', () => {
    renderSettings()

    for (const name of [
      'Calm Blue',
      'Elegant Blue',
      'Aurora Purple',
      'Emerald',
      'Volcano',
      'Slate',
    ]) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: 'Calm Blue' })).toBeChecked()
  })

  it('switches the theme', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('radio', { name: 'Volcano' }))

    await waitFor(() =>
      expect(usePreferencesStore.getState().themeId).toBe('volcano'),
    )
    expect(screen.getByRole('radio', { name: 'Volcano' })).toBeChecked()
  })

  it('switches the language and re-renders in Chinese', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('radio', { name: '简体中文' }))

    expect(await screen.findByRole('heading', { name: '设置' })).toBeInTheDocument()
    expect(usePreferencesStore.getState().locale).toBe('zh-CN')
    expect(screen.getByRole('radio', { name: '翡翠绿' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '沉稳蓝' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '优雅蓝' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '极光紫' })).toBeInTheDocument()
  })

  it('restores both preferences', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('radio', { name: 'Aurora Purple' }))
    await user.click(screen.getByRole('radio', { name: '简体中文' }))
    await user.click(await screen.findByRole('button', { name: '恢复默认' }))

    await waitFor(() =>
      expect(usePreferencesStore.getState()).toMatchObject({
        locale: 'zh-CN',
        themeId: 'antd-blue',
      }),
    )
    expect(
      await screen.findByRole('heading', { name: '设置' }),
    ).toBeInTheDocument()
  })

  it('labels each option group so the controls are announced', () => {
    renderSettings()

    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
  })
})
