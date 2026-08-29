import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Testet e2e ndajnë të njëjtin Postgres/Redis dev (s'ka DB test i
    // veçantë, shih test/utils/create-test-app.ts) — ekzekutimi paralel do
    // t'i bënte jo-deterministike (p.sh. dritaret e rate-limit të /auth/login
    // do të mbivendoseshin mes skedarëve).
    fileParallelism: false,
    testTimeout: 15000,
  },
});
