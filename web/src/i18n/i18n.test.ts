import { describe, expect, it } from 'vitest'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'
import { resolveMessage } from './translate'

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  )
}

function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }

  const out: Record<string, string> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    Object.assign(out, leaves(child, prefix ? `${prefix}.${key}` : key))
  }
  return out
}

describe('message catalogues', () => {
  it('have identical keys in English and Chinese', () => {
    expect(keys(zhCN).sort()).toEqual(keys(enUS).sort())
  })

  it('have no empty translations', () => {
    for (const [key, text] of Object.entries(leaves(zhCN))) {
      expect(text, key).not.toBe('')
    }
  })

  it('interpolate variables', () => {
    expect(resolveMessage(enUS, 'accounts.balanceOf', { name: 'Admin' })).toBe(
      'Balance for Admin',
    )
    expect(resolveMessage(zhCN, 'accounts.balanceOf', { name: 'Admin' })).toBe(
      'Admin 的余额',
    )
  })

  it('return a visible marker for an unknown key', () => {
    expect(resolveMessage(enUS, 'does.not.exist')).toBe('[does.not.exist]')
  })

  it('leave the placeholder intact when a variable is missing', () => {
    expect(resolveMessage(enUS, 'accounts.balanceOf')).toBe('Balance for {name}')
  })
})
