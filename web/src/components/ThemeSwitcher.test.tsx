import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePreferencesStore } from '../app/preferencesStore'
import { AppProviders } from '../app/AppProviders'
import { ThemeSwitcher } from './ThemeSwitcher'

beforeEach(() => {
  localStorage.clear()
  usePreferencesStore.setState({ locale: 'en-US', themeId: 'antd-blue' })
})

function renderSwitcher() {
  return render(
    <AppProviders>
      <ThemeSwitcher />
    </AppProviders>,
  )
}

describe('ThemeSwitcher', () => {
  it('names the current palette in the accessible label', () => {
    renderSwitcher()

    expect(
      screen.getByRole('button', { name: 'Theme: Calm Blue' }),
    ).toBeInTheDocument()
  })

  it('lists every palette and stores the one picked', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('button', { name: 'Theme: Calm Blue' }))

    for (const name of [
      'Calm Blue',
      'Elegant Blue',
      'Aurora Purple',
      'Emerald',
      'Volcano',
      'Slate',
    ]) {
      expect(
        await screen.findByRole('menuitem', { name }),
      ).toBeInTheDocument()
    }

    await user.click(screen.getByRole('menuitem', { name: 'Elegant Blue' }))

    expect(usePreferencesStore.getState().themeId).toBe('elegant-blue')
    expect(
      screen.getByRole('button', { name: 'Theme: Elegant Blue' }),
    ).toBeInTheDocument()
  })

  it('marks the active palette in the menu', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('button', { name: 'Theme: Calm Blue' }))

    // AntD flags the selection with its own class rather than aria-selected; the state is
    // announced through the trigger label, which the test above covers.
    expect(
      await screen.findByRole('menuitem', { name: 'Calm Blue' }),
    ).toHaveClass('ant-dropdown-menu-item-selected')
  })
})
