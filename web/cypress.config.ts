import { exec } from 'node:child_process'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    // Cypress moves the previous run's screenshots/downloads to the OS Recycle Bin by
    // default (via the `trash` package). Keep them in place and delete them with
    // `pnpm --filter web cy:clean` instead, which uses fs.rm and never touches the bin.
    trashAssetsBeforeRuns: false,
    setupNodeEvents(on) {
      on('task', {
        resetDemoData() {
          return new Promise((resolve, reject) => {
            exec(
              'pnpm db:reset',
              { cwd: '..', timeout: 180_000 },
              (error, stdout, stderr) => {
                if (error) {
                  reject(error)
                  return
                }
                resolve({ stdout, stderr })
              },
            )
          })
        },
      })
    },
  },
})
