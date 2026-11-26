import { exec } from 'node:child_process'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
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
