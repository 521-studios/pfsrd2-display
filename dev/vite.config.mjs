import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to force .js files through JSX transform before import analysis
function jsxInJs() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (/\/src\/.*\.js$/.test(id) && code.includes('<')) {
        const esbuild = await import('esbuild')
        const result = await esbuild.transform(code, {
          loader: 'jsx',
          jsx: 'automatic',
          sourcefile: id,
        })
        return { code: result.code, map: result.map }
      }
    },
  }
}

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
