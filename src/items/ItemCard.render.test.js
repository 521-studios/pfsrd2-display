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
    assert.doesNotMatch(html, /Item 5\+/) // the "+" is only for version families
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

  it('shows the full choice (nothing checked) until a version is picked', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={-1} onVariantChange={() => {}} />)
    assert.match(html, /role="radiogroup"/)
    assert.equal(checkedCount(html), 0) // require-a-pick
    assert.doesNotMatch(html, /Monster__variant-change/) // nothing to reopen yet
  })

  it('locks in: collapses to just the chosen version (as the item) with a change control', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={2} onVariantChange={() => {}} />)
    assert.match(html, /Striking \(Major\)/) // header = the chosen version
    assert.match(html, /Item 19/) // its own level (no "+")
    assert.match(html, /31,065 gp/) // its price
    assert.doesNotMatch(html, /Item 4\+/) // not the family header
    assert.doesNotMatch(html, /role="radiogroup"/) // collapsed — no list
    assert.doesNotMatch(html, /Striking \(Greater\)/) // other versions hidden
    assert.match(html, /Monster__variant-change/) // a way back to the choice
    assert.match(html, />change version</)
  })

  it('read-only: a chosen version collapses to just it, with no change control', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={1} />)
    assert.match(html, /Striking \(Greater\)/)
    assert.match(html, /Item 12/)
    assert.doesNotMatch(html, /role="radiogroup"/) // collapsed
    assert.doesNotMatch(html, /Monster__variant-change/) // not selectable → no reopen
    assert.doesNotMatch(html, /Striking \(Major\)/) // others hidden
  })

  it('read-only with no pick lists every version (reference)', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} variant={-1} />)
    assert.match(html, /role="list"/)
    assert.match(html, /Item 12/)
    assert.match(html, /Item 19/)
  })

  it('marks the radiogroup required and labels each radio by its version name only', () => {
    const html = renderToStaticMarkup(<ItemCard data={runeItem} onVariantChange={() => {}} />)
    assert.match(html, /aria-required="true"/)
    assert.equal((html.match(/aria-labelledby="/g) || []).length, 3) // one per radio
  })

  it('renders per-version text when a version has it, and omits the block when none do', () => {
    const withText = {
      name: 'Armor Potency',
      stat_block: {
        level: 5,
        traits: [{ name: 'Magical', classes: ['trait'] }],
        variants: [
          { name: 'Armor Potency (+1)', level: 5, price: { text: '160 gp' } },
          { name: 'Armor Potency (+2)', level: 11, price: { text: '1,060 gp' }, text: 'Increase the item bonus to AC by 2.' }
        ]
      }
    }
    const withHtml = renderToStaticMarkup(<ItemCard data={withText} onVariantChange={() => {}} />)
    assert.match(withHtml, /Monster__variant-text/)
    assert.match(withHtml, /item bonus to AC by 2/)
    // the runeItem versions carry no text → no per-version text block at all
    const withoutHtml = renderToStaticMarkup(<ItemCard data={runeItem} onVariantChange={() => {}} />)
    assert.doesNotMatch(withoutHtml, /Monster__variant-text/)
  })

  it('locked: renders the chosen version rules text alongside the shared flavor', () => {
    const withText = {
      name: 'Armor Potency',
      stat_block: {
        level: 5,
        traits: [{ name: 'Magical', classes: ['trait'] }],
        text: 'Magic wards deflect attacks.',
        variants: [
          { name: 'Armor Potency (+1)', level: 5, price: { text: '160 gp' } },
          { name: 'Armor Potency (+2)', level: 11, price: { text: '1,060 gp' }, text: 'Increase the item bonus to AC by 2.' }
        ]
      }
    }
    const html = renderToStaticMarkup(<ItemCard data={withText} variant={1} onVariantChange={() => {}} />)
    assert.match(html, /Armor Potency \(\+2\)/) // collapsed to the chosen version
    assert.match(html, /Magic wards deflect attacks/) // shared flavor still shows
    assert.match(html, /item bonus to AC by 2/) // the +2 version's own text
    assert.doesNotMatch(html, /role="radiogroup"/) // collapsed
  })

  it('derives the header level from the versions when the base level is absent', () => {
    const noBaseLevel = {
      name: 'Weapon Potency',
      stat_block: {
        traits: [{ name: 'Magical', classes: ['trait'] }],
        variants: [
          { name: 'Weapon Potency (+1)', level: 6, price: { text: '35 gp' } },
          { name: 'Weapon Potency (+2)', level: 10, price: { text: '935 gp' } }
        ]
      }
    }
    const html = renderToStaticMarkup(<ItemCard data={noBaseLevel} onVariantChange={() => {}} />)
    assert.match(html, /Item 6\+/) // min of [6, 10], not the (absent) base level
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

describe('ItemCard "Varies" price (render)', () => {
  // A value:null / text:'-' price (e.g. an alchemical bomb, a rune family base)
  // must still render its text — itemPrice keeps the price object for display,
  // even though itemPriceCp returns null for summing. Guards the refactor from
  // silently blanking such prices.
  const varies = {
    name: 'Alchemical Bomb',
    stat_block: { level: 1, price: { value: null, text: '-' }, text: 'Boom.' }
  }
  it('still shows the price line for a "Varies" (value null) price', () => {
    const html = renderToStaticMarkup(<ItemCard data={varies} />)
    assert.match(html, /class="Monster__price"/) // price line rendered, not blanked
    assert.match(html, /Alchemical Bomb/)
  })
})
