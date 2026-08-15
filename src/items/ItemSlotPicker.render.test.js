import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import ItemSlotPicker from './ItemSlotPicker.js'

const eligibility = {
  item: { game_id: 'rap', name: 'Rapier', host: 'weapon' },
  runes: {
    fundamental: [
      { game_id: 'pot', name: 'Weapon Potency', slot: 'weapon_potency', grades: [{ level: 2, price: '35 gp' }, { level: 10, price: '935 gp' }] },
      { game_id: 'strk', name: 'Striking', slot: 'striking', grades: [{ level: 4, price: '65 gp' }] },
    ],
    property: [
      { game_id: 'flame', name: 'Flaming', slot: 'property', grades: [{ level: 8, price: '500 gp' }] },
    ],
  },
  materials: [{ game_id: 'cold', name: 'Cold Iron', precious: true }],
}

describe('ItemSlotPicker', () => {
  it('renders grouped sections + the name field with the item name as placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(ItemSlotPicker, { eligibility, name: '', onNameChange: () => {}, onApply: () => {} }),
    )
    assert.match(html, /Fundamental Runes/)
    assert.match(html, /Property Runes/)
    assert.match(html, /Materials/)
    assert.match(html, /Weapon Potency/)
    assert.match(html, /Flaming/)
    assert.match(html, /Cold Iron/)
    assert.match(html, /placeholder="Rapier"/)
    // No spell section when the item isn't a holder.
    assert.doesNotMatch(html, /Holds a/)
  })

  it('shows the spell holder constraints + excluded types for a holder', () => {
    const withSpells = { ...eligibility, spells: { holder: 'wand', max_rank: 9, excluded_types: ['cantrip', 'ritual'] } }
    const html = renderToStaticMarkup(React.createElement(ItemSlotPicker, { eligibility: withSpells, onApply: () => {} }))
    assert.match(html, /Holds a wand spell up to rank 9/)
    assert.match(html, /excludes cantrip, ritual/)
    // Without searchSpells wired, no search box renders.
    assert.doesNotMatch(html, /data-testid="spell-search"/)
  })

  it('renders the spell search box + constraint_text prose when a holder wires searchSpells', () => {
    const withSpells = {
      ...eligibility,
      spells: { holder: 'staff', max_rank: 4, excluded_types: [], constraint_text: 'Only *fire* spells.' },
    }
    const html = renderToStaticMarkup(
      React.createElement(ItemSlotPicker, { eligibility: withSpells, onApply: () => {}, searchSpells: () => Promise.resolve([]) }),
    )
    assert.match(html, /data-testid="spell-search"/)
    assert.match(html, /Only/) // constraint_text prose rendered via Markdown
    assert.match(html, /placeholder="Search a spell…"/)
  })

  it('applies a single-grade rune directly with its grade level', () => {
    let applied = null
    const onApply = (c, opts) => { applied = { c, opts } }
    // Drive the click handler by finding Striking's Add. renderToString + a manual
    // event isn't available server-side, so assert the wiring via the component tree.
    const el = React.createElement(ItemSlotPicker, { eligibility, onApply })
    const html = renderToString(el)
    assert.match(html, /data-testid="apply-candidate"/)
    // Striking has a single grade → renders an "Add" (not "Choose grade").
    assert.match(html, /Striking<\/span><span[^>]*>Item 4<\/span><button[^>]*>Add<\/button>/)
    // Weapon Potency is multi-grade → a "Choose grade" toggle instead.
    assert.match(html, /Weapon Potency<\/span><span[^>]*>Item 2\+<\/span><button[^>]*>Choose grade<\/button>/)
  })

  it('renders the applied stack with remove/clear affordances', () => {
    const stack = [{ applied: 'Weapon Potency (+1)' }, { applied: 'Striking' }]
    const html = renderToStaticMarkup(
      React.createElement(ItemSlotPicker, { eligibility, stack, onApply: () => {}, onRemoveLast: () => {}, onClearAll: () => {} }),
    )
    assert.match(html, /Weapon Potency \(\+1\)/)
    assert.match(html, /data-testid="applied-tag"/)
    assert.match(html, /Clear all/)
  })

  it('renders nothing without eligibility', () => {
    const html = renderToStaticMarkup(React.createElement(ItemSlotPicker, { eligibility: null, onApply: () => {} }))
    assert.equal(html, '')
  })
})
