import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferencesStore } from '../app/preferencesStore'
import { AppProviders } from '../app/AppProviders'
import { LanguageSwitcher } from './LanguageSwitcher'

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
})

describe('LanguageSwitcher', () => {
  it('shows the current language and switches to Chinese', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <LanguageSwitcher />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Language: English' }))
    await user.click(await screen.findByRole('menuitem', { name: '简体中文' }))

    expect(usePreferencesStore.getState().locale).toBe('zh-CN')
    expect(
      screen.getByRole('button', { name: '语言: 简体中文' }),
    ).toBeInTheDocument()
  })

  it('sets the document language for assistive tech', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <LanguageSwitcher />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Language: English' }))
    await user.click(await screen.findByRole('menuitem', { name: '简体中文' }))

    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
