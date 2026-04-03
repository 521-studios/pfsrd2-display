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
      '/api/pfsrd2': {
        target: 'http://pfsrd2-api:8090',
        changeOrigin: true,
      },
    },
  },
  publicDir: path.resolve(__dirname, '../assets'),
})
