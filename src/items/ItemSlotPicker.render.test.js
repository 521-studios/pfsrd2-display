import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import ItemSlotPicker, { materialGradeOptions } from './ItemSlotPicker.js'

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

  it('gives a material with several grade_prices a grade step; one without stays a direct Add (76bn)', () => {
    const duskwood = {
      game_id: 'dusk',
      name: 'Duskwood Weapon',
      grade_prices: [
        { grade: 'high', name: 'Duskwood Weapon (High-Grade)', level: 17, price_cp: 1350000, cp_per_bulk: 135000, per_bulk_text: '+1350 gp per Bulk' },
        { grade: 'standard', name: 'Duskwood Weapon (Standard-Grade)', level: 11, price_cp: 140000, cp_per_bulk: 14000, per_bulk_text: '+140 gp per Bulk' },
      ],
    }
    const html = renderToStaticMarkup(
      React.createElement(ItemSlotPicker, { eligibility: { ...eligibility, materials: [duskwood, ...eligibility.materials] }, onApply: () => {} }),
    )
    assert.match(html, /Duskwood Weapon<\/span><button[^>]*data-testid="grade-open"[^>]*>Choose grade<\/button>/)
    assert.match(html, /Cold Iron<\/span><span[^>]*>precious<\/span><button[^>]*data-testid="apply-candidate"[^>]*>Add<\/button>/)
  })

  it('materialGradeOptions sorts by level and labels grade, shield form and price (76bn)', () => {
    const opts = materialGradeOptions({
      grade_prices: [
        { grade: 'high', name: 'Duskwood Weapon (High-Grade)', level: 17, price_cp: 1350000, cp_per_bulk: 135000, per_bulk_text: '+1350 gp per Bulk' },
        { grade: 'standard', name: 'Duskwood Weapon (Standard-Grade)', level: 11, price_cp: 140000, cp_per_bulk: 14000, per_bulk_text: '+140 gp per Bulk' },
      ],
    })
    assert.deepStrictEqual(opts.map((o) => [o.label, o.price, o.grade]), [
      ['Standard · Item 11', '1,400 gp +140 gp per Bulk', 'standard'],
      ['High · Item 17', '13,500 gp +1350 gp per Bulk', 'high'],
    ])
    assert.equal(opts[0].row.cp_per_bulk, 14000) // the raw row reaches onApply as gradePrice
    const [buckler] = materialGradeOptions({
      grade_prices: [{ grade: 'standard', name: 'Duskwood Buckler (Standard-Grade)', level: 8, price_cp: 40000, form: 'tower_shield' }],
    })
    assert.deepStrictEqual([buckler.label, buckler.price], ['Standard tower shield · Item 8', '400 gp'])
    assert.deepStrictEqual(materialGradeOptions({ name: 'Cold Iron' }), []) // no grade_prices (older API)
  })

  it('renders nothing without eligibility', () => {
    const html = renderToStaticMarkup(React.createElement(ItemSlotPicker, { eligibility: null, onApply: () => {} }))
    assert.equal(html, '')
  })
})
