import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Attack, { damageLabel } from './Attack.js'

// efi: Attack.js used to compute each damage entry's roll label by MUTATING the prop
// (setLabel wrote d.label onto the shared damage object during render). The label is
// now a pure function used at the read site. These tests lock (1) the label string is
// unchanged, and (2) rendering no longer mutates the props.

describe('damageLabel', () => {
  const attack = { weapon: 'jaws' }
  it('formats weapon + damage type', () => {
    assert.strictEqual(damageLabel(attack, { damage_type: 'piercing' }), 'jaws: (piercing)')
  })
  it('includes persistent and splash before the type, and notes after', () => {
    assert.strictEqual(
      damageLabel(attack, { persistent: true, damage_type: 'fire', splash: true, notes: 'plus 2' }),
      'jaws: (persistent fire splash) plus 2',
    )
  })
  it('omits the parenthetical when there are no types', () => {
    assert.strictEqual(damageLabel(attack, { notes: 'special' }), 'jaws: special')
    assert.strictEqual(damageLabel(attack, {}), 'jaws:')
  })
})

describe('Attack (render)', () => {
  const makeAttack = () => ({
    name: 'Jaws',
    weapon: 'jaws',
    bonus: { bonuses: [10, 5, 0] },
    damage: [{ formula: '1d6', damage_type: 'piercing', notes: 'plus poison' }],
  })

  it('does not mutate the attack prop (no d.label written) while rendering', () => {
    const attack = makeAttack()
    const before = JSON.parse(JSON.stringify(attack))
    renderToStaticMarkup(<Attack attack={attack} i={0} />)
    assert.deepStrictEqual(attack, before, 'render must not add a `label` to the damage prop')
    assert.ok(!('label' in attack.damage[0]), 'the damage entry gains no label key')
  })

  it('still renders the damage formula, type, and notes', () => {
    const html = renderToStaticMarkup(<Attack attack={makeAttack()} i={0} />)
    assert.match(html, /1d6/)
    assert.match(html, /piercing/)
    assert.match(html, /plus poison/)
    assert.match(html, /jaws/)
  })
})
