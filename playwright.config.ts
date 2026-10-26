import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

/**
 * Projects:
 *  - api:      REST API tests, no browser at all
 *  - chromium, firefox, webkit: the UI tests, once per browser engine
 *
 * Run one project with --project, e.g.  npx playwright test --project=chromium
 * Tests that need a logged-in user get it through the API per test
 * (test.use({ loggedIn: true }), see src/fixtures/test.ts), so there is no setup project.
 */
export default defineConfig({
  testDir: './tests',
  // Every test is independent, so tests inside one file may run in parallel too.
  fullyParallel: true,
  // A stray test.only must never pass CI silently by skipping the rest of the suite.
  forbidOnly: env.isCI,
  // Public demo site: retry on CI to tell a real failure from a one-off network hiccup.
  retries: env.isCI ? 2 : 0,
  // The shared demo site rate-limits hard bursts; a few workers are fast and polite.
  workers: env.isCI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 10_000 },

  // On CI every job writes a blob report (named after the job, so they don't collide);
  // a final job merges them into one HTML report for all browsers. Locally: list + HTML.
  reporter: env.isCI
    ? [
        ['github'],
        ['list'],
        ['blob', { fileName: `report-${process.env.BLOB_NAME ?? 'all'}.zip` }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        // JUnit records a test that passed on a retry as plain passed; the JSON report keeps every
        // attempt, so Quality Intelligence can show such tests as flaky
        ['json', { outputFile: 'test-results/results.json' }],
      ]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: env.baseUrl,
    // The shop marks its elements with data-test="...", so getByTestId() reads that attribute.
    testIdAttribute: 'data-test',
    // Evidence for failures only: keeps passing runs fast and the report small.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Video only when a test is retried. 'retain-on-failure' records every test and
    // encodes the video at teardown, which made each test ~25 s slower locally.
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      // No browser settings: API tests use the apiRequest fixture (bound to env.apiUrl).
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/ui',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
