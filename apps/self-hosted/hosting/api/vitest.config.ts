import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: {} },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
  },
});
