import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    define: {
      __JATA_EXTENSION_CONFIGURED_WEB_APP_ORIGIN__: JSON.stringify(
        env.VITE_JATA_WEB_APP_URL || ''
      ),
      'import.meta.env.VITE_VERCEL_BRANCH_URL': JSON.stringify(
        env.VITE_VERCEL_BRANCH_URL || env.VERCEL_BRANCH_URL || ''
      ),
      'import.meta.env.VITE_VERCEL_URL': JSON.stringify(
        env.VITE_VERCEL_URL || env.VERCEL_URL || ''
      ),
      'import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL': JSON.stringify(
        env.VITE_VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_PROJECT_PRODUCTION_URL || ''
      ),
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.',
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          popup: path.resolve(__dirname, 'index.html'),
          background: path.resolve(__dirname, 'src/background.ts'),
          scraper: path.resolve(__dirname, 'src/contentScripts/scraper.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'scraper') {
              return 'src/contentScripts/[name].js';
            }
            return 'src/[name].js';
          },
        }
      },
    },
  };
});
