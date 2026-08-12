import { defineConfig, devices } from '@playwright/test'

// Functional tests for the pfsrd2-display validation harness. By default they
// run against the DEPLOYED staging harness (display.pfsrd2.staging.521studios.com)
// — the same app consumers see — exercising the real library build + pfsrd2-data-api.
//
// Override DISPLAY_BASE_URL to point elsewhere. For LOCAL validation (before a
// change is deployed), start the dev server against the staging API and target it:
//   HARNESS_API_TARGET=https://display.pfsrd2.staging.521studios.com npm run dev
//   DISPLAY_BASE_URL=http://localhost:5173 npm run e2e
export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 20_000 }, // the API can be cold; give suggestions/statblocks room
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.DISPLAY_BASE_URL || 'https://display.pfsrd2.staging.521studios.com',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
