import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@kakao-maple-bot/core': path.resolve('packages/core/src/index.ts'),
      '@kakao-maple-bot/providers': path.resolve('packages/providers/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts', 'apps/**/*.test.ts'],
  },
});
