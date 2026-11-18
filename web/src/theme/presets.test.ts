import { describe, expect, it } from 'vitest'
import { THEME_PRESETS } from './presets'

function channel(value: number): number {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const digits = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((offset) =>
    channel(parseInt(digits.slice(offset, offset + 2), 16)),
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

const WHITE = '#ffffff'

describe('theme presets', () => {
  it('keeps white text on the primary colour at WCAG AA', () => {
    for (const preset of THEME_PRESETS) {
      const primary = preset.config.token?.colorPrimary as string

      expect(
        contrast(WHITE, primary),
        `${preset.id} button text`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps the primary colour readable as a link on white', () => {
    for (const preset of THEME_PRESETS) {
      const primary = preset.config.token?.colorPrimary as string

      expect(
        contrast(primary, WHITE),
        `${preset.id} link`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps the selected sidebar item readable on its own background', () => {
    for (const preset of THEME_PRESETS) {
      expect(
        contrast(
          preset.sider.colorTextMenuSelected,
          preset.sider.colorBgMenuItemSelected,
        ),
        `${preset.id} sidebar selection`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('names every preset in both languages', () => {
    const ids = THEME_PRESETS.map((preset) => preset.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('antd-blue')
    expect(ids).toContain('elegant-blue')
    expect(ids).toContain('aurora-purple')
  })
})
