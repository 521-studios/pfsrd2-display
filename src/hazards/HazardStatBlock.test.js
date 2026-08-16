import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HazardStatBlock from './HazardStatBlock.js'

describe('HazardStatBlock', () => {
  it('renders a complex haunt with a stealth modifier and no physical defenses', () => {
    // Stonescale Spirits shape: a haunt has no AC/HP; stealth is a modifier (complex).
    const doc = {
      hazard: {
        name: 'Stonescale Spirits', level: 1, complexity: 'Complex',
        traits: [{ name: 'Haunt' }, { name: 'Magical' }],
        stealth: { value: 8, proficiency: 'trained' },
        description: 'Vengeful spirits.',
        disable: 'DC 18 Religion to quiet the spirits',
        routine: 'The spirits attack.',
        abilities: [{ ability_type: 'ability', name: 'Vengeful Assault', effect: 'psychic damage' }],
      },
    }
    const html = renderToStaticMarkup(React.createElement(HazardStatBlock, { data: doc }))
    assert.match(html, /Stonescale Spirits/)
    assert.match(html, /Hazard 1/)
    assert.match(html, /Stealth[^<]*<\/strong>\+8 \(trained\)/) // modifier form, signed
    assert.match(html, /Disable/)
    assert.match(html, /Vengeful Assault/) // ability rendered
    // No physical defenses → no AC/HP lines
    assert.doesNotMatch(html, /Monster__hazard-defense/)
  })

  it('renders a simple trap with a stealth DC, AC/HP/hardness/BT, and an attack', () => {
    const doc = {
      hazard: {
        name: 'Spike Launcher', level: 1, complexity: 'Simple',
        traits: [{ name: 'Trap' }, { name: 'Mechanical' }],
        stealth: { dc: 20, proficiency: 'trained' },
        disable: 'DC 16 Thievery',
        ac: 16, hardness: 8, hp: 32, bt: 16,
        saves: [{ name: 'Fort', value: 9 }, { name: 'Reflex', value: 12 }],
        attacks: [{ name: 'spike', attack_type: 'ranged', weapon: 'spike',
          bonus: { bonuses: [11] },
          damage: [{ formula: '2d6+3', damage_type: 'piercing' }] }],
      },
    }
    const html = renderToStaticMarkup(React.createElement(HazardStatBlock, { data: doc }))
    assert.match(html, /Stealth[^<]*<\/strong>DC 20/) // DC form
    assert.match(html, /AC[^<]*<\/strong>16/)
    assert.match(html, /Hardness[^<]*<\/strong>8/)
    assert.match(html, /HP[^<]*<\/strong>32 \(BT 16\)/)
    assert.match(html, /2d6\+3/) // attack damage rendered
  })

  it('accepts a top-level (unwrapped) hazard and returns null for no data', () => {
    const flat = { name: 'X', level: 3, traits: [], description: 'd' }
    assert.match(renderToStaticMarkup(React.createElement(HazardStatBlock, { data: flat })), /Hazard 3/)
    assert.equal(renderToStaticMarkup(React.createElement(HazardStatBlock, { data: null })), '')
  })
})
