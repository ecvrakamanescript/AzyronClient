import { defineConfig } from 'vitest/config';

// Unit tests for the launcher logic (no Electron needed). Run with: npm test
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
