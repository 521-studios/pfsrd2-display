import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseMultipartResponse,
  mergePatches,
  listTemplates,
  applyTemplate,
} from './templates.js'

// A minimal fake of the multipart body POST /templates/apply returns.
function fakeApplyResponse({ ok = true, status = 200, patches, creature } = {}) {
  const body = [
    '--BOUNDARY',
    'Content-Disposition: form-data; name="patches"',
    '',
    JSON.stringify(patches),
    '--BOUNDARY',
    'Content-Disposition: form-data; name="creature"',
    '',
    JSON.stringify(creature),
    '--BOUNDARY--',
  ].join('\n')
  return { ok, status, text: async () => body }
}

test('parseMultipartResponse pulls out the patches and creature parts', async () => {
  const res = fakeApplyResponse({
    patches: { applied_patches: [{ op: 'replace' }] },
    creature: { name: 'Elite Goblin' },
  })
  const { patches, creature } = await parseMultipartResponse(res)
  assert.deepEqual(patches, { applied_patches: [{ op: 'replace' }] })
  assert.deepEqual(creature, { name: 'Elite Goblin' })
})

test('mergePatches flattens the stack and tags each group with its template name', () => {
  const stack = [
    { template: { name: 'Elite' }, patches: { applied_patches: [{ path: '/a' }, { path: '/b' }] } },
    { template: { name: 'Fire' }, patches: { applied_patches: [{ path: '/c' }] } },
  ]
  const merged = mergePatches(stack)
  assert.equal(merged.length, 3)
  assert.deepEqual(merged.map((g) => g.template_name), ['Elite', 'Elite', 'Fire'])
  assert.deepEqual(merged.map((g) => g.path), ['/a', '/b', '/c'])
})

test('mergePatches returns null when nothing changed', () => {
  assert.equal(mergePatches([]), null)
  assert.equal(mergePatches(null), null)
  // an entry with no applied_patches contributes nothing
  assert.equal(mergePatches([{ template: { name: 'X' }, patches: {} }]), null)
})

test('listTemplates paginates until the reported total and sorts by name', async () => {
  const page1 = { results: [{ game_id: '3', name: 'Weak' }, { game_id: '1', name: 'Elite' }], total: 3 }
  const page2 = { results: [{ game_id: '2', name: 'Giant' }], total: 3 }
  const calls = []
  const get = async (path) => {
    calls.push(path)
    return path.includes('offset=0') ? page1 : page2
  }
  const out = await listTemplates({ get, edition: 'remastered', pageSize: 2 })
  assert.deepEqual(out.map((t) => t.name), ['Elite', 'Giant', 'Weak']) // sorted
  assert.equal(calls.length, 2) // two pages fetched
  assert.match(calls[0], /applicable_to=remastered/)
})

test('listTemplates stops when a short page arrives even if total is missing', async () => {
  let n = 0
  const get = async () => {
    n++
    return { results: [{ game_id: 'a', name: 'Only' }] } // 1 < pageSize, no total
  }
  const out = await listTemplates({ get, edition: 'legacy', pageSize: 20 })
  assert.equal(out.length, 1)
  assert.equal(n, 1) // did not loop forever on a missing total
})

test('applyTemplate posts the body and returns the parsed result; selections optional', async () => {
  let sent = null
  const post = async (body) => {
    sent = JSON.parse(body)
    return fakeApplyResponse({ patches: { applied_patches: [] }, creature: { name: 'Weak Goblin' } })
  }
  const { creature } = await applyTemplate({ post, creature: { name: 'Goblin' }, templateGameId: 'T:1' })
  assert.equal(creature.name, 'Weak Goblin')
  assert.deepEqual(sent, { creature: { name: 'Goblin' }, template_game_id: 'T:1' }) // no selections key
})

test('applyTemplate includes selections when provided', async () => {
  let sent = null
  const post = async (body) => {
    sent = JSON.parse(body)
    return fakeApplyResponse({ patches: {}, creature: {} })
  }
  await applyTemplate({ post, creature: { name: 'G' }, templateGameId: 'T:2', selections: [{ id: 's', pick: 1 }] })
  assert.deepEqual(sent.selections, [{ id: 's', pick: 1 }])
})

test('applyTemplate throws on a non-ok response', async () => {
  const post = async () => ({ ok: false, status: 403, text: async () => '' })
  await assert.rejects(
    () => applyTemplate({ post, creature: {}, templateGameId: 'T:3' }),
    /Template apply failed: 403/,
  )
})
