import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { sentryVitePlugin } from "@sentry/vite-plugin";

import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), sentryVitePlugin({
    org: "josh-t-g-s-organization",
    project: "javascript-react",
  })],
  optimizeDeps: {
    exclude: ['pdf-parse'],
  },
  resolve: {
    alias: {
      "fs": "memfs",
      "@": path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
})
