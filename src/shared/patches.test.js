import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildChangedPaths, changeSources, isPathAdded, isPathChanged } from './patches.js'

describe('buildChangedPaths', () => {
  it('returns null for null input', () => {
    assert.strictEqual(buildChangedPaths(null), null)
  })

  it('returns null for empty array', () => {
    assert.strictEqual(buildChangedPaths([]), null)
  })

  it('returns null for groups with no operations', () => {
    assert.strictEqual(buildChangedPaths([{ change_category: 'level' }]), null)
  })

  it('collects paths from operations', () => {
    const patches = [
      {
        change_category: 'combat_stats',
        operations: [
          { op: 'replace', path: '/stat_block/defense/ac/value', value: 17 },
          { op: 'replace', path: '/stat_block/defense/saves/fort/value', value: 8 },
        ],
      },
    ]
    const result = buildChangedPaths(patches)
    assert.ok(result instanceof Set)
    assert.strictEqual(result.size, 2)
    assert.ok(result.has('/stat_block/defense/ac/value'))
    assert.ok(result.has('/stat_block/defense/saves/fort/value'))
  })

  it('merges paths across multiple groups', () => {
    const patches = [
      {
        change_category: 'level',
        operations: [{ op: 'replace', path: '/stat_block/creature_type/level' }],
      },
      {
        change_category: 'hit_points',
        operations: [{ op: 'replace', path: '/stat_block/defense/hitpoints/0/hp' }],
      },
    ]
    const result = buildChangedPaths(patches)
    assert.ok(result.has('/stat_block/creature_type/level'))
    assert.ok(result.has('/stat_block/defense/hitpoints/0/hp'))
  })

  it('does not store bare array path for append operations', () => {
    const patches = [
      {
        change_category: 'damage',
        operations: [
          { op: 'add', path: '/items/-' },
        ],
      },
    ]
    // Without creature data, no indexed paths can be computed, returns null
    const result = buildChangedPaths(patches)
    assert.strictEqual(result, null)
  })

  it('computes indexed paths for appended array items using creature data', () => {
    const patches = [
      {
        change_category: 'languages',
        operations: [
          { op: 'add', path: '/langs/-', value: { name: 'Necril' } },
        ],
      },
    ]
    // Creature has 2 languages — the append added the second one (index 1)
    const creature = { langs: ['Jotun', 'Necril'] }
    const result = buildChangedPaths(patches, creature)
    assert.ok(!result.has('/langs'))     // bare array path NOT stored for appends
    assert.ok(result.has('/langs/1'))    // newly appended item
    assert.ok(!result.has('/langs/0'))   // original item NOT highlighted
  })

  it('handles multiple appends to same array', () => {
    const patches = [
      {
        change_category: 'traits',
        operations: [
          { op: 'add', path: '/types/-', value: 'Ghost' },
          { op: 'add', path: '/types/-', value: 'Spirit' },
          { op: 'add', path: '/types/-', value: 'Undead' },
        ],
      },
    ]
    const creature = { types: ['Animal', 'Ghost', 'Spirit', 'Undead'] }
    const result = buildChangedPaths(patches, creature)
    assert.ok(!result.has('/types/0'))   // original
    assert.ok(result.has('/types/1'))    // appended
    assert.ok(result.has('/types/2'))    // appended
    assert.ok(result.has('/types/3'))    // appended
  })

  it('deduplicates identical paths', () => {
    const patches = [
      { change_category: 'a', operations: [{ op: 'replace', path: '/foo' }] },
      { change_category: 'b', operations: [{ op: 'replace', path: '/foo' }] },
    ]
    const result = buildChangedPaths(patches)
    assert.strictEqual(result.size, 1)
  })
})

describe('isPathChanged', () => {
  it('returns false for null changedPaths', () => {
    assert.strictEqual(isPathChanged(null, '/foo'), false)
  })

  it('matches exact path', () => {
    const paths = new Set(['/foo/bar'])
    assert.strictEqual(isPathChanged(paths, '/foo/bar'), true)
  })

  it('matches parent of changed child', () => {
    const paths = new Set(['/foo/bar/baz'])
    assert.strictEqual(isPathChanged(paths, '/foo/bar'), true)
  })

  it('does not match sibling', () => {
    const paths = new Set(['/foo/bar'])
    assert.strictEqual(isPathChanged(paths, '/foo/baz'), false)
  })

  it('matches child of changed parent (whole-array set)', () => {
    // If /immunities was set as a whole, /immunities/3 is also changed
    const paths = new Set(['/stat_block/defense/hitpoints/0/immunities'])
    assert.strictEqual(isPathChanged(paths, '/stat_block/defense/hitpoints/0/immunities/3'), true)
    assert.strictEqual(isPathChanged(paths, '/stat_block/defense/hitpoints/0/immunities/0'), true)
  })

  it('does not match unrelated paths for whole-array set', () => {
    const paths = new Set(['/stat_block/defense/hitpoints/0/immunities'])
    assert.strictEqual(isPathChanged(paths, '/stat_block/defense/hitpoints/0/weaknesses/0'), false)
  })

  it('returns false for null path', () => {
    const paths = new Set(['/foo'])
    assert.strictEqual(isPathChanged(paths, null), false)
    assert.strictEqual(isPathChanged(paths, ''), false)
  })

  it('returns null for append ops with unresolvable creature path', () => {
    const patches = [
      { change_category: 'x', operations: [{ op: 'add', path: '/missing/array/-' }] },
    ]
    const creature = { other: 'stuff' }
    const result = buildChangedPaths(patches, creature)
    // Path doesn't resolve to an array — no indexed paths added, returns null
    assert.strictEqual(result, null)
  })
})

describe('changeSources attribution', () => {
  it('names the template for replace ops and indexed appends', () => {
    const groups = [
      {
        change_category: 'traits',
        template_name: 'Catfolk',
        operations: [
          { op: 'replace', path: '/stat_block/creature_type/creature_types/0', value: 'Catfolk' },
          { op: 'add', path: '/stat_block/senses/special_senses/-', value: { name: 'Low-Light Vision' } },
        ],
      },
      {
        change_category: 'level',
        template_name: 'Elite',
        operations: [{ op: 'replace', path: '/stat_block/creature_type/level', value: 5 }],
      },
    ]
    const creature = {
      stat_block: { senses: { special_senses: [{ name: 'darkvision' }, { name: 'Low-Light Vision' }] } },
    }
    const paths = buildChangedPaths(groups, creature)
    assert.ok(paths.has('/stat_block/senses/special_senses/1'))
    assert.deepStrictEqual(changeSources(paths, '/stat_block/senses/special_senses/1'), ['Catfolk'])
    assert.deepStrictEqual(changeSources(paths, '/stat_block/creature_type/level'), ['Elite'])
    // unattributed path -> []
    assert.deepStrictEqual(changeSources(paths, '/stat_block/defense/ac/value'), [])
  })

  it('stacked templates touching the same path both attribute', () => {
    const groups = [
      { template_name: 'Elite', operations: [{ op: 'replace', path: '/stat_block/defense/ac/value', value: 20 }] },
      { template_name: 'Ghost', operations: [{ op: 'replace', path: '/stat_block/defense/ac/value', value: 22 }] },
    ]
    const paths = buildChangedPaths(groups, null)
    assert.deepStrictEqual(changeSources(paths, '/stat_block/defense/ac/value').sort(), ['Elite', 'Ghost'])
  })
})

describe('isPathAdded', () => {
  it('appended index counts as added, and its children too', () => {
    const paths = new Set(['/stat_block/offense/offensive_actions/2'])
    assert.strictEqual(isPathAdded(paths, '/stat_block/offense/offensive_actions/2'), true)
    assert.strictEqual(isPathAdded(paths, '/stat_block/offense/offensive_actions/2/ability/text'), true)
  })

  it('modified child does NOT mark the parent entry as added', () => {
    // Broodpiercer on Stingray: venom DC replaced in place — the whole
    // ability block must not read as added
    const paths = new Set(['/stat_block/offense/offensive_actions/1/ability/saving_throw/0/dc'])
    assert.strictEqual(isPathAdded(paths, '/stat_block/offense/offensive_actions/1'), false)
    // but isPathChanged still sees the inner field (its own highlight)
    assert.strictEqual(isPathChanged(paths, '/stat_block/offense/offensive_actions/1/ability/saving_throw/0/dc'), true)
  })

  it('whole-array add marks every child as added', () => {
    const paths = new Set(['/stat_block/defense/automatic_abilities'])
    assert.strictEqual(isPathAdded(paths, '/stat_block/defense/automatic_abilities/0'), true)
  })

  it('index prefixes do not collide (/arr/1 vs /arr/10)', () => {
    const paths = new Set(['/stat_block/offense/offensive_actions/1'])
    assert.strictEqual(isPathAdded(paths, '/stat_block/offense/offensive_actions/10'), false)
  })

  it('null inputs are safe', () => {
    assert.strictEqual(isPathAdded(null, '/x'), false)
    assert.strictEqual(isPathAdded(new Set(['/x']), null), false)
  })
})
