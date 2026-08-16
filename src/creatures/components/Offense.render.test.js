import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Offense from './Offense.js'

// llu: Offense dispatched offensive_action_type through an if/else-if chain; it now uses
// a component map. These tests lock that each type still routes to the right renderer,
// an unknown type renders nothing, and the speed line always shows.

const wrap = (offensive_actions, speed = [{ movement_type: 'walk', value: 25 }]) => ({ speed, offensive_actions })
const render = (offense) => renderToStaticMarkup(<Offense offense={offense} />)

describe('Offense (render) — dispatch by offensive_action_type', () => {
  it('routes attack → Attack (wrapped in a Changed block)', () => {
    const html = render(wrap([{ offensive_action_type: 'attack', attack: { name: 'Jaws', weapon: 'jaws', bonus: { bonuses: [10, 5, 0] }, damage: [{ formula: '1d6', damage_type: 'piercing' }] } }]))
    assert.match(html, /<strong class="Monster__ability-name">Jaws/)
    assert.match(html, /1d6/)
  })
  it('routes spells → Spells', () => {
    const html = render(wrap([{ offensive_action_type: 'spells', spells: { name: 'Arcane Spells', spell_list: [] } }]))
    assert.match(html, /<strong class="Monster__ability-name">Arcane Spells/)
  })
  it('routes affliction → Affliction', () => {
    const html = render(wrap([{ offensive_action_type: 'affliction', affliction: { name: 'Venom', saving_throw: { save_type: 'Fortitude', dc: 18 } } }]))
    assert.match(html, /<strong class="Monster__ability-name">Venom/)
  })
  it('routes ability → Ability', () => {
    const html = render(wrap([{ offensive_action_type: 'ability', ability: { name: 'Grab', text: 'grabs' } }]))
    assert.match(html, /<strong class="Monster__ability-name">Grab/)
  })
  it('routes mythic_ability → MythicAbility', () => {
    const html = render(wrap([{ offensive_action_type: 'mythic_ability', mythic_ability: { name: 'Mythic Power', ability: { name: 'Mythic Power', text: 'x' } } }]))
    assert.match(html, /Mythic Power/)
  })
})

describe('Offense (render) — edges', () => {
  it('renders nothing for an unknown offensive_action_type (but keeps the speed line)', () => {
    const html = render(wrap([{ offensive_action_type: 'nonsense', x: 1 }]))
    assert.doesNotMatch(html, /Monster__ability-name/) // no action component rendered
    assert.match(html, /class="Monster__offense"/)
  })
  it('renders the speed line and an empty action list without crashing', () => {
    const html = renderToStaticMarkup(<Offense offense={{ speed: [{ movement_type: 'fly', value: 60 }] }} />)
    assert.match(html, /class="Monster__offense"/)
  })
})

import { DisplayProvider } from '../../context/DisplayContext'
import { buildChangedPaths } from '../../shared/patches'

describe('Offense (render) — tee: appended actions highlight', () => {
  const withChanges = (offense, patches) => {
    const changedPaths = buildChangedPaths(patches, { stat_block: { offense } })
    return renderToStaticMarkup(
      <DisplayProvider value={{ changedPaths }}>
        <Offense offense={offense} />
      </DisplayProvider>,
    )
  }

  it('highlights an APPENDED affliction action (Snow Spray-style) at the action index', () => {
    const offense = {
      offensive_actions: [
        { offensive_action_type: 'attack', attack: { name: 'Bite', weapon: 'bite', bonus: { bonuses: [10, 5, 0] }, damage: [{ formula: '1d6', damage_type: 'piercing' }] } },
        { offensive_action_type: 'affliction', affliction: { name: 'Snow Spray', onset: '1 round' } },
      ],
    }
    // The append patch (/-) resolves to index 1 → that action is marked added.
    const html = withChanges(offense, [{ operations: [{ op: 'add', path: '/stat_block/offense/offensive_actions/-' }] }])
    assert.match(html, /Monster__changed--block[\s\S]{0,80}Snow Spray/) // the affliction is wrapped in a block highlight
  })

  it('does not highlight a non-appended affliction (no patch touches it)', () => {
    const offense = { offensive_actions: [{ offensive_action_type: 'affliction', affliction: { name: 'Old Venom' } }] }
    const html = withChanges(offense, []) // no changes
    assert.match(html, /Old Venom/)
    assert.doesNotMatch(html, /Monster__changed/)
  })
})
