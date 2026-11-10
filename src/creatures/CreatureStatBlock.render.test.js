import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CreatureStatBlock from './CreatureStatBlock.js'

// d31m: render the full creature stat block (router → V1_2 / V1_3) against a minimal fixture.
// The fixture is Bestiary's Wolf cut down to the schema-required fields (perception, skills,
// ability mods, AC/saves/HP, speed, one Strike). Optional sections (gear, grafts, family,
// interaction abilities, sections) are omitted so a renderer that stops tolerating their
// absence fails here.

const creature = (overrides = {}) => ({
  name: 'Test Wolf',
  type: 'creature',
  edition: 'legacy',
  stat_block: {
    creature_type: {
      level: 1,
      traits: [{ name: 'Animal' }],
      creature_types: ['Animal'],
    },
    senses: { perception: { value: 7 } },
    statistics: {
      str: 2, dex: 4, con: 1, int: -4, wis: 2, cha: -2,
      skills: [{ name: 'Acrobatics', value: 7 }],
    },
    defense: {
      ac: { value: 15 },
      saves: {
        fort: { name: 'Fort', value: 6 },
        ref: { name: 'Ref', value: 9 },
        will: { name: 'Will', value: 5 },
      },
      hitpoints: [{ hp: 24 }],
    },
    offense: {
      speed: { movement: [{ movement_type: 'walk', name: '35 feet', value: 35 }] },
      offensive_actions: [{
        name: 'Melee',
        offensive_action_type: 'attack',
        attack: {
          name: 'Melee',
          weapon: 'jaws',
          attack_type: 'melee',
          action_type: { name: 'One Action' },
          bonus: { bonuses: [9, 4, -1] },
          damage: [{ formula: '1d6+2', damage_type: 'piercing' }],
        },
      }],
    },
  },
  ...overrides,
})

const render = (data, props = {}) => renderToStaticMarkup(<CreatureStatBlock data={data} {...props} />)

describe('CreatureStatBlock (render)', () => {
  it('renders nothing without data', () => {
    assert.strictEqual(render(null), '')
  })

  it('routes legacy data with no schema_version to V1_2 (no edition label)', () => {
    const html = render(creature())
    assert.match(html, /Monster__name">Test Wolf</)
    assert.match(html, /Monster__level">Creature 1/)
    assert.doesNotMatch(html, /Monster__edition/)
  })

  it('renders the core stat lines from the stat block', () => {
    const html = render(creature({ schema_version: 1.4 }))
    assert.match(html, /Perception<\/strong> <span>\+7</)
    assert.match(html, /Acrobatics\s<span>\+7</) // Skill joins name/value with &nbsp;
    assert.match(html, /Dex<\/strong> <span>\+4</)
    assert.match(html, /AC <\/strong>15/)
    assert.match(html, /Ref<\/strong> <span>\+9</)
    assert.match(html, /HP<\/strong> 24/)
    assert.match(html, /35 feet/)
    assert.match(html, /jaws <span>\+9<\/span> \[<span>\+4<\/span>\/<span>-1<\/span>\]/)
    assert.match(html, /1d6\+2<\/span> piercing/)
  })

  for (const schema_version of [1.3, 1.4, '1.4']) {
    it(`routes schema_version ${JSON.stringify(schema_version)} to V1_3 (edition label)`, () => {
      const html = render(creature({ schema_version }))
      assert.match(html, /Monster__level">Creature 1/)
      assert.match(html, /Monster__edition"> \(Legacy\)/)
    })
  }

  it('shows the alternate-edition link only when onLoadMonster is wired', () => {
    const data = creature({
      schema_version: 1.4,
      alternate_link: { 'game-obj': 'Monsters', aonid: 42, alternate_type: 'remastered' },
    })
    assert.doesNotMatch(render(data), /Monster__alternateLink/)
    assert.match(render(data, { onLoadMonster: () => {} }), /Monster__alternateLink"> → Remastered/)
  })

  it('renders the traits row', () => {
    assert.match(render(creature({ schema_version: 1.4 })), /Monster__trait[^>]*>Animal/)
  })

  it('highlights the level when a template patch changed it', () => {
    const patches = [{ operations: [{ op: 'replace', path: '/stat_block/creature_type/level', value: 2 }] }]
    const data = creature({ schema_version: 1.4 })
    data.stat_block.creature_type.level = 2
    assert.match(render(data, { patches }), /Monster__changed[^>]*>2</)
    assert.doesNotMatch(render(creature({ schema_version: 1.4 })), /Monster__changed/)
  })
})
