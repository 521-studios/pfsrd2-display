// Regression test for the package resolution contract (exports map, main,
// dist/index.cjs rename). The original bug: without an exports map, bare
// imports resolved via main to dist/index.cjs.js, which "type": "module"
// made Node parse as ESM — `import { CreatureStatBlock }` threw. A
// file-existence check would NOT have caught it (the file existed); these
// assertions resolve and load the built package via Node's resolver,
// using package self-reference (enabled by the exports map itself).
import { test } from 'node:test'
import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pkg = '@521studios/pfsrd2-display'
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const built = existsSync(join(distDir, 'index.esm.js'))

test('ESM entry resolves and exposes named exports', { skip: !built && 'dist/ missing — run `npm run build` first' }, async () => {
  const mod = await import(pkg)
  assert.strictEqual(typeof mod.CreatureStatBlock, 'function')
  assert.ok(mod.DisplayProvider, 'DisplayProvider export missing')
})

test('CJS entry resolves and exposes named exports', { skip: !built && 'dist/ missing — run `npm run build` first' }, () => {
  const require = createRequire(import.meta.url)
  const mod = require(pkg)
  assert.strictEqual(typeof mod.CreatureStatBlock, 'function')
})

test('style.css subpaths resolve per the exports map', { skip: !built && 'dist/ missing — run `npm run build` first' }, () => {
  assert.ok(import.meta.resolve(`${pkg}/style.css`).endsWith('/dist/style.css'))
  assert.ok(import.meta.resolve(`${pkg}/dist/style.css`).endsWith('/dist/style.css'))
  assert.ok(import.meta.resolve(`${pkg}/dist/fonts/Pathfinder2eActions.ttf`).endsWith('/dist/fonts/Pathfinder2eActions.ttf'))
})
