import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/Application.bootstrap.ts'],
  outDir: './dist',
  sourcemap: true,
  dts: false,
  deps: {
    alwaysBundle: () => true
  }
});
