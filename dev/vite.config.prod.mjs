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
  publicDir: path.resolve(__dirname, '../assets'),
  build: {
    outDir: path.resolve(__dirname, '../dist-site'),
    emptyOutDir: true,
  },
})
