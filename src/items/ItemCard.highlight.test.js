import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ItemCard from './ItemCard.js'

// A customized weapon: Striking bumped the dice (2d6) and Potency added an item
// attack bonus. ItemCard must render the offense (so the change is visible) and
// highlight exactly the fields the patches touched.
const rapier = {
  name: 'Sting',
  stat_block: {
    traits: [{ name: 'Finesse', classes: ['trait'] }],
    offense: {
      weapon_modes: [
        {
          hands: '1',
          damage: [{ damage_type: 'piercing', dice_count: 2, die_size: 6, formula: '2d6' }],
          modifiers: [{ type: 'bonus', subtype: 'attack', bonus_type: 'item', bonus_value: 1 }],
        },
      ],
    },
  },
}

const patches = [
  {
    change_category: 'rune',
    template_name: 'Striking',
    operations: [{ op: 'replace', path: '/stat_block/offense/weapon_modes/0/damage/0/formula', value: '2d6' }],
  },
  {
    change_category: 'rune',
    template_name: 'Weapon Potency (+1)',
    operations: [{ op: 'add', path: '/stat_block/offense/weapon_modes/0/modifiers/-' }],
  },
]

describe('ItemCard offense rendering + highlighting', () => {
  it('renders the damage line and attack bonus', () => {
    const html = renderToStaticMarkup(React.createElement(ItemCard, { data: rapier }))
    assert.match(html, /Damage/)
    assert.match(html, /2d6 piercing/)
    assert.match(html, /Attack/)
    assert.match(html, /\+1 item/)
  })

  it('highlights the damage formula and the attack modifier when patched', () => {
    const html = renderToStaticMarkup(React.createElement(ItemCard, { data: rapier, patches }))
    // Both the striking-changed formula and the potency-added modifier carry the
    // change class; the un-patched name/traits do not.
    const changedCount = (html.match(/Monster__changed/g) || []).length
    assert.ok(changedCount >= 2, `expected >=2 highlighted fields, got ${changedCount}: ${html}`)
    // The striking-changed damage carries the highlight (attributed to Striking).
    assert.match(html, /Monster__changed" title="Modified by Striking"/)
    assert.match(html, /Monster__changed" title="Modified by Weapon Potency \(\+1\)"/)
  })

  it('renders nothing highlighted without patches', () => {
    const html = renderToStaticMarkup(React.createElement(ItemCard, { data: rapier }))
    assert.doesNotMatch(html, /Monster__changed/)
  })

  it('renders a holder’s slotted spell', () => {
    const wand = {
      name: 'Wand of Fireball',
      stat_block: { traits: [], spell_slots: { holder: 'wand', spell: { name: 'Fireball', rank: 3 } } },
    }
    const html = renderToStaticMarkup(React.createElement(ItemCard, { data: wand }))
    assert.match(html, /Spell/)
    assert.match(html, /Fireball/)
    assert.match(html, /rank 3/)
  })

  it('omits offense/spell sections for a plain item', () => {
    const gear = { name: 'Backpack', stat_block: { traits: [], bulk: { text: '1' } } }
    const html = renderToStaticMarkup(React.createElement(ItemCard, { data: gear }))
    assert.doesNotMatch(html, /Monster__weapon-mode/)
    assert.doesNotMatch(html, /Monster__spell-slot/)
  })
})
