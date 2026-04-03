import { transform } from 'esbuild'

// Custom plugin to force .js files through JSX transform before import analysis.
// Components use .js extension (ported from lets-roll); Vite's default esbuild
// pipeline doesn't apply JSX transform to .js files.
export function jsxInJs() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (/\/src\/.*\.js$/.test(id) && code.includes('<')) {
        const result = await transform(code, {
          loader: 'jsx',
          jsx: 'automatic',
          sourcefile: id,
        })
        return { code: result.code, map: result.map || null }
      }
    },
  }
}
