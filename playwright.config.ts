import { defineConfig } from '@playwright/test';
const previewPort = Number(process.env.FF_PREVIEW_PORT ?? 4173);
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${previewPort}`,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `npm run preview -- --port ${previewPort} --strictPort`,
    url: `http://127.0.0.1:${previewPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
