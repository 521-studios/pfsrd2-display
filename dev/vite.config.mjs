import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { jsxInJs } from './vite-plugins.mjs'

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    jsxInJs(),
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      // Defaults to the docker-compose API service. Override HARNESS_API_TARGET
      // to point the harness at another backend — e.g. the deployed staging
      // edge (https://display.pfsrd2.staging.521studios.com) when running the
      // e2e suite locally without docker.
      '/api/pfsrd2': {
        target: process.env.HARNESS_API_TARGET || 'http://pfsrd2-api:8090',
        changeOrigin: true,
      },
    },
  },
  publicDir: path.resolve(__dirname, '../assets'),
})
