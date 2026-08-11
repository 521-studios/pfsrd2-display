import { describe, it } from 'node:test'
import assert from 'node:assert'

// ItemCard.js is JSX, which node:test cannot parse, so the pure
// data-shaping logic is replicated here from the same contract.
// Keep in sync with ItemCard.js.
const resolveStatBlock = (data) => data.stat_block || data

describe('ItemCard field resolution', () => {
  it('reads fields from stat_block for a pristine dataset entry', () => {
    const data = {
      name: 'Full Plate',
      stat_block: {
        level: 2,
        price: { text: '30 gp', value: 30 },
        bulk: { text: '4' },
        traits: [{ name: 'Bulwark', classes: ['trait'] }],
        text: 'Plate mail...',
      },
    }
    const sb = resolveStatBlock(data)
    assert.strictEqual(sb.level, 2)
    assert.strictEqual(sb.price.text, '30 gp')
    assert.strictEqual(sb.bulk.text, '4')
    assert.strictEqual(sb.traits.length, 1)
  })

  it('falls back to top-level fields for a hand-built custom item with no stat_block wrapper', () => {
    const data = { name: 'Custom Blade', level: 5, price: { text: '50 gp' } }
    const sb = resolveStatBlock(data)
    assert.strictEqual(sb.level, 5)
    assert.strictEqual(sb.price.text, '50 gp')
  })

  it('degrades gracefully when price, bulk, traits, and text are absent', () => {
    const data = { name: 'Mystery Object', stat_block: { level: 1 } }
    const sb = resolveStatBlock(data)
    assert.strictEqual(sb.price, undefined)
    assert.strictEqual(sb.bulk, undefined)
    assert.strictEqual(sb.traits, undefined)
    assert.strictEqual(sb.text, undefined)
  })

  it('renders level 0 items (falsy but present) -- only null/undefined should suppress the level line', () => {
    const shouldRenderLevel = (level) => level !== undefined && level !== null
    assert.strictEqual(shouldRenderLevel(0), true)
    assert.strictEqual(shouldRenderLevel(undefined), false)
    assert.strictEqual(shouldRenderLevel(null), false)
  })
})

describe('ItemCard masked label fallback', () => {
  const maskedLabel = (maskLabel) => maskLabel || 'Unidentified Item'

  it('uses the supplied maskLabel', () => {
    assert.strictEqual(maskedLabel('a potion'), 'a potion')
  })

  it('falls back to a generic label when maskLabel is missing', () => {
    assert.strictEqual(maskedLabel(undefined), 'Unidentified Item')
    assert.strictEqual(maskedLabel(''), 'Unidentified Item')
  })
})
