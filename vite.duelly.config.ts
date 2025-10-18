import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';

// DUELLY minimal config: no vite-plugin-checker; aims to compile even with TS type errors.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  build: {
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: false
  }
});
