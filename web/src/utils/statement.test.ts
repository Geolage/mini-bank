import { describe, expect, it } from 'vitest'
import { toCsv } from './statement'

describe('toCsv', () => {
  it('writes a BOM, CRLF rows and a header line', () => {
    const csv = toCsv(['Date', 'Note'], [['2026-11-05', 'Lunch']])

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toBe('\uFEFFDate,Note\r\n2026-11-05,Lunch\r\n')
  })

  it('quotes commas, quotes and newlines per RFC 4180', () => {
    const csv = toCsv(
      ['Note'],
      [['Dinner, split'], ['He said "hi"'], ['line one\nline two']],
    )

    expect(csv).toContain('"Dinner, split"')
    expect(csv).toContain('"He said ""hi"""')
    expect(csv).toContain('"line one\nline two"')
  })

  it('keeps empty fields as empty columns', () => {
    const csv = toCsv(['A', 'B', 'C'], [['1', '', '3']])

    expect(csv).toContain('1,,3')
  })
})
