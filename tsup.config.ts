import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2020',
  external: ['react', 'react-dom'],
  banner: { js: '"use client";' },
  async onSuccess() {
    await copyFile('SmileedNexus.css', 'dist/styles.css');
  },
});