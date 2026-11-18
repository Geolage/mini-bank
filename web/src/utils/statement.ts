/** RFC 4180 quoting plus a UTF-8 BOM so Excel opens Chinese notes correctly. */
export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

  return (
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n') +
    '\r\n'
  )
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
