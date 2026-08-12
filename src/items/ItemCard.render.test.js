import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ItemCard from './ItemCard.js'

// Render-level tests (JSX transformed via test/support/jsx-loader.mjs). Unlike
// the pure-logic tests, these render the real component, so a regression that
// leaked a masked item's identity into the DOM would fail here.
const item = {
  name: 'Wand of Fireball',
  stat_block: {
    level: 5,
    price: { text: '340 gp', value: 340 },
    traits: [{ name: 'Evocation', classes: ['trait'] }],
    text: 'A wand that casts fireball.'
  }
}

describe('ItemCard masked variant (render)', () => {
  it('leaks none of the real item identity when masked', () => {
    const html = renderToStaticMarkup(
      <ItemCard data={item} masked maskLabel='unidentified wand' />
    )
    assert.match(html, /unidentified wand/)
    // The security contract: real name, traits, price, and description must
    // never reach the DOM for an unidentified item.
    assert.doesNotMatch(html, /Wand of Fireball/)
    assert.doesNotMatch(html, /Evocation/)
    assert.doesNotMatch(html, /340 gp/)
    assert.doesNotMatch(html, /casts fireball/)
  })

  it('falls back to a generic label when maskLabel is absent, still no leak', () => {
    const html = renderToStaticMarkup(<ItemCard data={item} masked />)
    assert.match(html, /Unidentified Item/)
    assert.doesNotMatch(html, /Wand of Fireball/)
  })
})

describe('ItemCard unmasked variant (render)', () => {
  it('renders the real fields', () => {
    const html = renderToStaticMarkup(<ItemCard data={item} />)
    assert.match(html, /Wand of Fireball/)
    assert.match(html, /Item 5/)
    assert.match(html, /340 gp/)
    assert.match(html, /casts fireball/)
  })

  it('renders a level-0 item but suppresses the level line for null/undefined', () => {
    assert.match(renderToStaticMarkup(<ItemCard data={{ name: 'X', stat_block: { level: 0 } }} />), /Item 0/)
    assert.doesNotMatch(renderToStaticMarkup(<ItemCard data={{ name: 'X', stat_block: {} }} />), /Item /)
  })

  it('degrades a structured price with no display text (constructed item) instead of a bare Price label', () => {
    const html = renderToStaticMarkup(
      <ItemCard data={{ name: 'X', stat_block: { price: { value: 5, currency: 'gp' } } }} />
    )
    assert.doesNotMatch(html, /Price/)
  })
})

// A Striking rune: one item, three variants each with its own level + price.
const runeItem = {
  name: 'Striking',
  stat_block: {
    level: 4,
    price: { text: '65 gp', value: 65 },
    traits: [{ name: 'Magical', classes: ['trait'] }],
    text: 'A striking rune stores destructive magic.',
    variants: [
      { name: 'Striking', level: 4, price: { text: '65 gp' } },
      { name: 'Striking (Greater)', level: 12, price: { text: '1,065 gp' } },
      { name: 'Striking (Major)', level: 19, price: { text: '31,065 gp' } }
    ]
  }
}

describe('ItemCard variants (render)', () => {
  it('renders a variant selector with one option per variant', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} onVariantChange={() => {}} />)
    assert.match(html, /aria-label="variant"/)
    assert.match(html, /Striking \(Greater\) \(Lvl 12\)/)
    assert.match(html, /Striking \(Major\) \(Lvl 19\)/)
  })

  it('shows the base variant (index 0) by default: level 4 / 65 gp', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} />)
    assert.match(html, /Item 4/)
    assert.match(html, /65 gp/)
    assert.doesNotMatch(html, /31,065 gp/)
  })

  it('renders the selected variant name/level/price when variant is set', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={2} onVariantChange={() => {}} />)
    // header shows the Major variant
    assert.match(html, /Striking \(Major\)/)
    assert.match(html, /Item 19/)
    assert.match(html, /31,065 gp/)
    assert.doesNotMatch(html, /Item 4</) // not the base level in the header
  })

  it('has no selector for a plain item (no variants)', () => {
    const html = renderToStaticMarkup(<ItemCard data={item} />)
    assert.doesNotMatch(html, /aria-label="variant"/)
  })

  it('clamps an out-of-range variant index back to the base rather than crashing', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={99} onVariantChange={() => {}} />)
    assert.match(html, /Item 4/) // fell back to base
  })
})
