// Minimal ESM load hook so `node --test` can import the JSX components
// directly (they use `.js` with classic-runtime JSX). Only project src files
// are transformed; node_modules (react, react-dom) pass through untouched.
// preset-react rewrites JSX to React.createElement; ESM import/export is left
// to Node, so no preset-env is needed.
import { transformAsync } from '@babel/core'
import { fileURLToPath } from 'node:url'

// The components use extensionless relative imports (e.g. '../shared/Markdown'),
// which the bundler resolves but native ESM does not. Retry with a `.js`
// extension when a relative specifier fails to resolve.
export async function resolve (specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/.test(specifier)) {
      return nextResolve(specifier + '.js', context)
    }
    throw err
  }
}

export async function load (url, context, nextLoad) {
  if (url.startsWith('file:') && url.includes('/src/') && (url.endsWith('.js') || url.endsWith('.jsx'))) {
    const loaded = await nextLoad(url, { ...context, format: 'module' })
    const source = loaded.source.toString()
    const { code } = await transformAsync(source, {
      filename: fileURLToPath(url),
      presets: [['@babel/preset-react', { runtime: 'classic' }]],
      babelrc: false,
      configFile: false
    })
    return { format: 'module', source: code, shortCircuit: true }
  }
  return nextLoad(url, context)
}
