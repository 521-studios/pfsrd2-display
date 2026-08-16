import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsxInJs } from './vite-plugins.mjs'

// jsxInJs() forces .js files under src/ through esbuild's JSX transform (components
// use the .js extension, which Vite's default pipeline won't treat as JSX). Its
// transform hook fires only when BOTH parts of the guard hold — the id matches
// /\/src\/.*\.js$/ AND the code contains "<". These cases partition that guard: a
// src/*.js file with JSX (transform), a non-src path (skip), a src/*.js file with no
// "<" (skip), and a src/ file whose extension isn't .js (skip). (d2w)

const jsxSource = 'export const A = () => <div className="x">hi</div>\n'

test('jsxInJs transforms a src/*.js file that contains JSX', async () => {
  const out = await jsxInJs().transform(jsxSource, '/repo/src/components/A.js')
  assert.ok(out && typeof out.code === 'string', 'returns a transformed result')
  assert.doesNotMatch(out.code, /<div/, 'the JSX element is compiled away')
  assert.match(out.code, /jsx/i, 'emits automatic-runtime jsx calls')
})

test('jsxInJs skips a file outside src/ even when it contains JSX', async () => {
  const out = await jsxInJs().transform(jsxSource, '/repo/dev/scratch.js')
  assert.equal(out, undefined, 'non-src path is left untouched')
})

test('jsxInJs skips a src/*.js file that contains no "<" (no JSX to transform)', async () => {
  const out = await jsxInJs().transform('export const n = 1\n', '/repo/src/util/n.js')
  assert.equal(out, undefined, 'no "<" → the transform is not invoked')
})

test('jsxInJs skips a src/ file with a non-.js extension', async () => {
  const out = await jsxInJs().transform(jsxSource, '/repo/src/styles.css')
  assert.equal(out, undefined, 'only .js files are matched')
})
