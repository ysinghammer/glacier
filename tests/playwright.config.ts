import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  globalSetup: './src/globalSetup.ts',
  fullyParallel: false,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:8080'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
