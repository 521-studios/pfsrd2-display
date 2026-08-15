import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchEligible, applyItemEffect, mergeItemPatches, customizedItem } from './items.js'

test('fetchEligible calls the eligible endpoint for the item', async () => {
  let called = ''
  const get = (path) => {
    called = path
    return Promise.resolve({ item: { name: 'Rapier' }, runes: {} })
  }
  const res = await fetchEligible({ get, itemGameId: 'rap' })
  assert.equal(called, '/entries/rap/eligible')
  assert.equal(res.item.name, 'Rapier')
})

test('applyItemEffect posts the in-progress item and adds ?grade when present', async () => {
  const calls = []
  const post = (path, body) => {
    calls.push({ path, body })
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ item: { name: 'X' }, applied: 'Weapon Potency (+1)', patches: [] }) })
  }
  const item = { name: 'Rapier', stat_block: {} }
  const out = await applyItemEffect({ post, itemGameId: 'rap', item, effectGameId: 'pot', grade: 2 })
  assert.equal(calls[0].path, '/entries/rap/apply/pot?grade=2')
  assert.deepEqual(JSON.parse(calls[0].body), item) // the whole in-progress item is sent
  assert.equal(out.applied, 'Weapon Potency (+1)')

  // No grade → no query string.
  await applyItemEffect({ post, itemGameId: 'rap', item, effectGameId: 'flaming' })
  assert.equal(calls[1].path, '/entries/rap/apply/flaming')
})

test('applyItemEffect surfaces a boundary refusal with status + body', async () => {
  const post = () => Promise.resolve({
    ok: false, status: 409,
    text: () => Promise.resolve('{"error":"ineligible: not eligible"}'),
  })
  await assert.rejects(
    () => applyItemEffect({ post, itemGameId: 'rap', item: {}, effectGameId: 'arm' }),
    (e) => e.status === 409 && e.body.includes('ineligible'),
  )
})

test('mergeItemPatches flattens + attributes; null when empty', () => {
  assert.equal(mergeItemPatches([]), null)
  const stack = [
    { applied: 'Weapon Potency (+1)', patches: [{ change_category: 'rune', operations: [{ op: 'add', path: '/a/-' }] }] },
    { applied: 'Striking', patches: [{ change_category: 'rune', operations: [{ op: 'replace', path: '/b' }] }] },
    { applied: 'No-op', patches: [] },
  ]
  const merged = mergeItemPatches(stack)
  assert.equal(merged.length, 2)
  assert.equal(merged[0].template_name, 'Weapon Potency (+1)')
  assert.equal(merged[1].template_name, 'Striking')
})

test('customizedItem: latest chained result wins, name overlays, blank falls back', () => {
  const base = { name: 'Rapier', stat_block: { x: 1 } }
  const stack = [{ item: { name: 'Rapier', stat_block: { x: 2 } } }]
  // No name → latest chained result (x:2), base name kept.
  assert.equal(customizedItem(base, stack, '').stat_block.x, 2)
  assert.equal(customizedItem(base, stack, '  ').name, 'Rapier')
  // Custom name overlays without mutating the underlying item.
  const named = customizedItem(base, stack, 'Sting')
  assert.equal(named.name, 'Sting')
  assert.equal(stack[0].item.name, 'Rapier')
  // No stack → base item.
  assert.equal(customizedItem(base, [], 'Q').stat_block.x, 1)
})
