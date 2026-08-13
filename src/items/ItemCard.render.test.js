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

const checkedCount = (html) => (html.match(/aria-checked="true"/g) || []).length

describe('ItemCard variants (render)', () => {
  it('stacks every version (book-style) with its own level + price', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} onVariantChange={() => {}} />)
    // the base header shows the family name + lowest level with a "+"
    assert.match(html, /Item 4\+/)
    // and every version is listed
    for (const [name, price] of [
      ['Striking', '65 gp'],
      ['Striking \\(Greater\\)', '1,065 gp'],
      ['Striking \\(Major\\)', '31,065 gp']
    ]) {
      assert.match(html, new RegExp(name))
      assert.match(html, new RegExp(price))
    }
  })

  it('is a keyboard radiogroup with a radio per version when selectable', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} onVariantChange={() => {}} />)
    assert.match(html, /role="radiogroup"/)
    assert.equal((html.match(/role="radio"/g) || []).length, 3)
  })

  it('marks exactly the selected version, and none when nothing is picked', () => {
    const picked = renderToStaticMarkup(<ItemCard data={runeItem} variant={2} onVariantChange={() => {}} />)
    assert.equal(checkedCount(picked), 1) // only the Major row
    assert.match(picked, /aria-checked="true"[\s\S]*Striking \(Major\)/)

    const none = renderToStaticMarkup(<ItemCard data={runeItem} variant={-1} onVariantChange={() => {}} />)
    assert.equal(checkedCount(none), 0) // require-a-pick: nothing selected by default
  })

  it('renders a read-only list (not a radiogroup) without onVariantChange, still showing every version', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={1} />)
    assert.doesNotMatch(html, /role="radiogroup"/)
    assert.doesNotMatch(html, /role="radio"/)
    assert.match(html, /role="list"/)
    assert.match(html, /Item 12/) // the Greater version still renders
    assert.match(html, /Item 19/) // and Major — all versions shown as reference
  })

  it('has no version list for a plain item (no variants)', () => {
    const html = renderToStaticMarkup(<ItemCard data={item} />)
    assert.doesNotMatch(html, /Monster__variants/)
  })
})

describe('ItemCard variants — masking safety', () => {
  it('a masked item with variants leaks no version name/level/price and shows no radiogroup', () => {
    const html = renderToStaticMarkup(
      <ItemCard data={runeItem} masked maskLabel='mystery rune' variant={2} onVariantChange={() => {}} />
    )
    assert.match(html, /mystery rune/)
    assert.doesNotMatch(html, /Striking/) // no base OR version name
    assert.doesNotMatch(html, /31,065 gp/) // no version price
    assert.doesNotMatch(html, /Item 19/) // no version level
    assert.doesNotMatch(html, /role="radiogroup"/)
  })
})
