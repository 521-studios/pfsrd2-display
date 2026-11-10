import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CreatureStatBlock from './CreatureStatBlock.js'

// Bestiary's Wolf, trimmed. Optional sections (gear, grafts, family, interaction abilities,
// sections) are omitted so a renderer that stops tolerating their absence fails here.

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

  it('makes rolls clickable only when onRoll is wired', () => {
    const data = creature({ schema_version: 1.4 })
    assert.doesNotMatch(render(data), /Monster__roll/)
    assert.match(render(data, { onRoll: () => {} }), /Monster__roll">\+7</)
  })

  it('renders an applied template block per appliedTemplates entry', () => {
    const html = render(creature({ schema_version: 1.4 }), { appliedTemplates: [{ name: 'Elite' }] })
    assert.match(html, /Monster__template-title[^>]*>.*Elite Template</)
    assert.doesNotMatch(render(creature({ schema_version: 1.4 })), /Monster__template/)
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

describe('CreatureStatBlock (render) — sections and sidebars', () => {
  const sidebar = (name, sidebar_heading, sidebar_type) =>
    ({ type: 'section', subtype: 'sidebar', name, sidebar_heading, sidebar_type, text: 'Sidebar body.' })
  // Shapes from pfsrd2-data: the description section is named after the creature;
  // sidebars nest under it.
  const withSections = (...sidebars) => creature({
    schema_version: 1.4,
    sections: [{ type: 'section', name: 'Test Wolf', text: 'Wolves hunt in packs.', sections: sidebars }],
  })

  it('renders the creature description open, without a title', () => {
    const html = render(withSections())
    assert.match(html, /Monster__section-text"><span class="Markdown">Wolves hunt in packs\./)
    assert.doesNotMatch(html, /Monster__section-title/)
  })

  it('shows a sidebar under its own title with the type label above it', () => {
    const html = render(withSections(sidebar('Pools of Blood', 'Related Creatures', 'related_creatures')))
    assert.match(
      html,
      /class="Monster__sidebar Monster__sidebar--related_creatures"><button[^>]*class="Monster__sidebar-heading[^"]*"[^>]*><span[^>]*><\/span><span class="Monster__sidebar-type">Related Creatures<\/span>Pools of Blood</,
    )
    assert.doesNotMatch(html, /Sidebar body/) // collapsed until clicked
  })

  it('omits the type label when it would repeat the title', () => {
    const html = render(withSections(sidebar('Locations', 'Locations', 'locations')))
    assert.match(html, /Monster__sidebar--locations/)
    assert.doesNotMatch(html, /Monster__sidebar-type/)
  })

  it('renders a sidebar with no type data under its plain title', () => {
    const html = render(withSections(sidebar('Pack Tactics')))
    assert.match(html, /class="Monster__sidebar"><button[^>]*><span[^>]*><\/span>Pack Tactics</)
  })

  it('renders sidebars and titled prose sections side by side', () => {
    const data = withSections(sidebar('Pools of Blood', 'Related Creatures', 'related_creatures'))
    data.sections.push({ type: 'section', name: 'Ecology', text: 'Lives in forests.' })
    const html = render(data)
    assert.match(html, /Pools of Blood/)
    assert.match(html, /Monster__section-title[^>]*><span[^>]*><\/span>Ecology</)
  })
})

describe('CreatureStatBlock (render) — collapsible headers', () => {
  const cases = {
    'Monster__sidebar-heading': [creature({
      schema_version: 1.4,
      sections: [{ type: 'section', name: 'Test Wolf', sections: [{ type: 'section', subtype: 'sidebar', name: 'Pack Tactics', text: 'Body.' }] }],
    })],
    'Monster__section-title': [creature({ schema_version: 1.4, sections: [{ type: 'section', name: 'Ecology', text: 'Body.' }] })],
    'Monster__family-title': [(() => {
      const data = creature({ schema_version: 1.4 })
      data.stat_block.creature_type.family = { name: 'Wolves', text: 'Body.' }
      return data
    })()],
    'Monster__template-title': [creature({ schema_version: 1.4 }), { appliedTemplates: [{ name: 'Elite', text: 'Body.' }] }],
  }

  for (const [cls, [data, opts]] of Object.entries(cases)) {
    it(`renders ${cls} as a collapsed button`, () => {
      const html = render(data, opts)
      assert.match(html, new RegExp(`<button type="button" class="${cls} Monster__collapsible" aria-expanded="false"><span class="Monster__collapse-icon" aria-hidden="true">`))
      assert.doesNotMatch(html, /aria-controls/)
      assert.doesNotMatch(html, /Body\./)
    })
  }
})
