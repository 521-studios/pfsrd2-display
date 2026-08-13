import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  itemPrice,
  itemPriceCp,
  priceToCp,
  coinsToCp,
  formatGp,
  creatureLevel,
  COIN_TO_CP,
} from './pf2e.js'

// A rune-style entry: base price null, priced variants (mirrors striking.json).
const striking = {
  game_id: 'g1',
  name: 'Striking',
  stat_block: {
    price: { value: null, text: '-' },
    variants: [
      { name: 'Striking', level: 4, price: { value: 65, currency: 'gp', text: '65 gp' } },
      { name: 'Striking (Greater)', level: 12, price: { value: 1065, currency: 'gp', text: '1,065 gp' } },
    ],
  },
}
// A plain magic item with a fixed price.
const wingsuit = { stat_block: { price: { value: 625, currency: 'gp', text: '625 gp' } } }
// A sp-priced mundane item (price not in gp).
const rope = { stat_block: { price: { value: 5, currency: 'sp', text: '5 sp' } } }

describe('itemPrice', () => {
  it('returns the base price object when no variant chosen', () => {
    assert.deepStrictEqual(itemPrice(wingsuit), { value: 625, currency: 'gp', text: '625 gp' })
  })
  it('selects a variant by name (matching TreasureLine.variant)', () => {
    assert.strictEqual(itemPrice(striking, 'Striking (Greater)').value, 1065)
  })
  it('selects a variant by index (matching ItemCard)', () => {
    assert.strictEqual(itemPrice(striking, 0).value, 65)
  })
  it('falls back to base for an unknown variant name / out-of-range index', () => {
    assert.strictEqual(itemPrice(wingsuit, 'Nope').value, 625)
    assert.strictEqual(itemPrice(wingsuit, 9).value, 625)
  })
  it('the -1 sentinel (ItemCard non-locked default) means base', () => {
    assert.strictEqual(itemPrice(wingsuit, -1).value, 625)
    assert.strictEqual(itemPrice(striking, -1).text, '-') // base "Varies" object
  })
  it('keeps the raw price object incl. text (so display can show "Varies")', () => {
    assert.strictEqual(itemPrice(striking).text, '-') // base "Varies" object, value null
  })
  it('tolerates a top-level (unwrapped) entry and missing price', () => {
    assert.strictEqual(itemPrice({ price: { value: 3, currency: 'gp' } }).value, 3)
    assert.strictEqual(itemPrice({}), null)
    assert.strictEqual(itemPrice(null), null)
  })
})

describe('priceToCp / itemPriceCp', () => {
  it('normalizes across currencies', () => {
    assert.strictEqual(priceToCp({ value: 1, currency: 'gp' }), 100)
    assert.strictEqual(priceToCp({ value: 5, currency: 'sp' }), 50)
    assert.strictEqual(priceToCp({ value: 2, currency: 'cp' }), 2)
    assert.strictEqual(priceToCp({ value: 1, currency: 'pp' }), 1000)
  })
  it('returns null for an unknown or missing currency (flag, do not guess gp)', () => {
    assert.strictEqual(priceToCp({ value: 1, currency: 'zorkmid' }), null)
    assert.strictEqual(priceToCp({ value: 5 }), null) // no currency
  })
  it('returns null for no fixed price (missing or value null)', () => {
    assert.strictEqual(priceToCp(null), null)
    assert.strictEqual(priceToCp({ value: null, text: '-' }), null)
    assert.strictEqual(priceToCp({ currency: 'gp' }), null)
  })
  it('value 0 is a real free item (0 cp), not conflated with "no price"', () => {
    assert.strictEqual(priceToCp({ value: 0, currency: 'gp' }), 0)
  })
  it('itemPriceCp sums a variant by name; null for the "Varies" base', () => {
    assert.strictEqual(itemPriceCp(striking, 'Striking (Greater)'), 106500)
    assert.strictEqual(itemPriceCp(wingsuit), 62500)
    assert.strictEqual(itemPriceCp(rope), 50)
    assert.strictEqual(itemPriceCp(striking), null) // base value null -> flag, don't sum
  })
  it('itemPriceCp flags a requested-but-unresolvable variant (does not fall back to base)', () => {
    // A saved TreasureLine.variant renamed/removed in data must NOT silently
    // reprice to the base item — return null so the caller flags it.
    assert.strictEqual(itemPriceCp(wingsuit, 'No Such Variant'), null)
    assert.strictEqual(itemPriceCp(wingsuit, 5), null) // out-of-range index
    // But "no variant requested" still means the base price.
    assert.strictEqual(itemPriceCp(wingsuit, -1), 62500)
    assert.strictEqual(itemPriceCp(wingsuit, ''), 62500)
  })
})

describe('coinsToCp', () => {
  it('normalizes a coin bag to copper', () => {
    assert.strictEqual(coinsToCp({ pp: 1, gp: 2, sp: 3, cp: 4 }), 1000 + 200 + 30 + 4)
  })
  it('tolerates missing fields / null', () => {
    assert.strictEqual(coinsToCp({ gp: 5 }), 500)
    assert.strictEqual(coinsToCp(null), 0)
  })
})

describe('formatGp', () => {
  it('formats whole gp with thousands separators', () => {
    assert.strictEqual(formatGp(106500), '1,065 gp')
    assert.strictEqual(formatGp(62500), '625 gp')
  })
  it('shows sub-gp as decimals', () => {
    assert.strictEqual(formatGp(150), '1.5 gp')
    assert.strictEqual(formatGp(5), '0.05 gp')
  })
  it('null in -> null out', () => {
    assert.strictEqual(formatGp(null), null)
    assert.strictEqual(formatGp(undefined), null)
  })
})

describe('creatureLevel', () => {
  it('reads stat_block.creature_type.level', () => {
    assert.strictEqual(creatureLevel({ stat_block: { creature_type: { level: 11 } } }), 11)
  })
  it('handles negative levels (PL-relative lackeys)', () => {
    assert.strictEqual(creatureLevel({ stat_block: { creature_type: { level: -1 } } }), -1)
  })
  it('tolerates unwrapped entry', () => {
    assert.strictEqual(creatureLevel({ creature_type: { level: 3 } }), 3)
  })
  it('null when absent/non-numeric (never uses stat_block.level)', () => {
    assert.strictEqual(creatureLevel({ stat_block: { level: null, creature_type: {} } }), null)
    assert.strictEqual(creatureLevel({}), null)
    assert.strictEqual(creatureLevel(null), null)
  })
})

describe('COIN_TO_CP', () => {
  it('encodes the PF2e exchange table', () => {
    assert.deepStrictEqual(COIN_TO_CP, { cp: 1, sp: 10, gp: 100, pp: 1000 })
  })
})
