import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), sentryVitePlugin({
    org: "kaze-keza",
    project: "4509889225883728",

    // Auth tokens are required for uploading source maps.
    authToken: process.env.SENTRY_AUTH_TOKEN,
  })],
  optimizeDeps: {
    exclude: ['pdf-parse'],
  },
  resolve: {
    alias: {
      "fs": "memfs",
    },
  },
  build: {
    sourcemap: true,
  },
})
