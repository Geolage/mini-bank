import axe from 'axe-core'

export async function expectNoAccessibilityViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
  })

  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'critical' || violation.impact === 'serious',
  )

  if (blocking.length > 0) {
    const details = blocking
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.help}\n` +
          violation.nodes
            .map(
              (node) =>
                `    ${node.target.join(' ')} → ${node.html.slice(0, 500)}`,
            )
            .join('\n'),
      )
      .join('\n')
    throw new Error(`Accessibility violations found:\n${details}`)
  }

  return results
}
