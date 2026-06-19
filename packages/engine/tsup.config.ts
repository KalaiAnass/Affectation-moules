import { defineConfig } from 'tsup';

/**
 * Dual-format build: ESM (.js) for bundlers / modern Node and CJS (.cjs) for the
 * NestJS API, with type declarations. Source stays ESM-first with explicit .js
 * import specifiers (NodeNext style).
 */
export default defineConfig({
  entry: ['src/index.ts', 'src/data.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
});
