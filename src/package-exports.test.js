// Regression test for the package resolution contract (exports map, main,
// dist/index.cjs rename). The original bug: without an exports map, bare
// imports resolved via main to dist/index.cjs.js, which "type": "module"
// made Node parse as ESM — `import { CreatureStatBlock }` threw. A
// file-existence check would NOT have caught it (the file existed); the
// entry tests resolve and load the built package via Node's resolver,
// using package self-reference (enabled by the exports map itself).
// Requires a built dist/ — `npm ci` builds it via the prepare script.
import { test } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pkg = '@521studios/pfsrd2-display'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('ESM entry resolves and exposes named exports', async () => {
  const mod = await import(pkg)
  assert.strictEqual(typeof mod.CreatureStatBlock, 'function')
  assert.ok(mod.DisplayProvider, 'DisplayProvider export missing')
  assert.strictEqual(typeof mod.Markdown, 'function', 'Markdown export missing')
  assert.strictEqual(typeof mod.CreatureSearch, 'function', 'CreatureSearch export missing')
  assert.strictEqual(typeof mod.ItemSearch, 'function', 'ItemSearch export missing')
  assert.strictEqual(typeof mod.TemplatePicker, 'function', 'TemplatePicker export missing')
  for (const fn of ['parseMultipartResponse', 'mergePatches', 'listTemplates', 'applyTemplate']) {
    assert.strictEqual(typeof mod[fn], 'function', `${fn} export missing`)
  }
})

test('CJS entry resolves and exposes named exports', () => {
  const require = createRequire(import.meta.url)
  const mod = require(pkg)
  assert.strictEqual(typeof mod.CreatureStatBlock, 'function')
  assert.strictEqual(typeof mod.Markdown, 'function', 'Markdown export missing')
  assert.strictEqual(typeof mod.CreatureSearch, 'function', 'CreatureSearch export missing')
  assert.strictEqual(typeof mod.ItemSearch, 'function', 'ItemSearch export missing')
  assert.strictEqual(typeof mod.TemplatePicker, 'function', 'TemplatePicker export missing')
  for (const fn of ['parseMultipartResponse', 'mergePatches', 'listTemplates', 'applyTemplate']) {
    assert.strictEqual(typeof mod[fn], 'function', `${fn} export missing`)
  }
})

test('subpaths resolve per the exports map AND exist on disk', () => {
  // import.meta.resolve never stats its target — style.css and fonts are
  // rollup plugin side effects (postcss extract, plugin-copy) that can stop
  // emitting without failing the build, so assert the files are really there.
  for (const sub of ['style.css', 'dist/style.css', 'dist/fonts/Pathfinder2eActions.ttf']) {
    const resolved = fileURLToPath(import.meta.resolve(`${pkg}/${sub}`))
    assert.ok(existsSync(resolved), `${pkg}/${sub} resolves to ${resolved} but the file does not exist`)
  }
  assert.ok(fileURLToPath(import.meta.resolve(`${pkg}/style.css`)).endsWith('/dist/style.css'))
})

test('main/module fallback fields point at real files', () => {
  // Node ignores main/module once exports exists, but non-exports-aware
  // tooling (webpack 4, older jest) still reads them.
  const pj = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  for (const field of [pj.main, pj.module]) {
    assert.ok(existsSync(join(root, field)), `package.json points at missing file: ${field}`)
  }
})
