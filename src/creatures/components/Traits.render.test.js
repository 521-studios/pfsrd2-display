import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Traits from './Traits.js'
import { DisplayProvider } from '../../context/DisplayContext'
import { buildChangedPaths } from '../../shared/patches'

// tee: a size trait REPLACED by a template (Miniature's Small→Tiny) must highlight,
// keyed on its original creature_type.traits index — even though traitlist reorders the
// badges. A non-templated stat block renders the badges unwrapped (byte-identical).

const withChanges = (props, patches, creature) => {
  const changedPaths = buildChangedPaths(patches, creature)
  return renderToStaticMarkup(
    <DisplayProvider value={{ changedPaths }}>
      <Traits {...props} />
    </DisplayProvider>,
  )
}

describe('Traits (render) — tee: replaced size trait highlights', () => {
  it('highlights the size badge whose creature_type.traits index a template replaced', () => {
    // The final creature carries Tiny at traits[1]; the template replaced it (Small→Tiny).
    const creature = { stat_block: { creature_type: { traits: [{ name: 'Beast' }, { name: 'Tiny', classes: ['size'] }] } } }
    const html = withChanges(
      { traits: creature.stat_block.creature_type.traits, creatureTypes: [] },
      [{ operations: [{ op: 'replace', path: '/stat_block/creature_type/traits/1', value: { name: 'Tiny' } }] }],
      creature,
    )
    // The Tiny (size) badge is wrapped in a change highlight; Beast (traits[0], untouched) is not.
    assert.match(html, /Monster__changed[\s\S]{0,80}Monster__trait--size[^>]*>Tiny/)
    assert.doesNotMatch(html, /Monster__changed[\s\S]{0,40}Beast/)
  })

  it('renders the merged alignment abbreviation unwrapped even under an active changedPaths set', () => {
    // The alignment badge is a fusion of the alignment traits (LE), so it has no single
    // creature_type.traits index → trait.idx == null → it renders as a bare Fragment,
    // never wrapped in a Changed, regardless of what changed elsewhere.
    const creature = { stat_block: { creature_type: { traits: [{ name: 'Lawful', classes: ['alignment'] }, { name: 'Evil', classes: ['alignment'] }, { name: 'Tiny', classes: ['size'] }] } } }
    const html = withChanges(
      { traits: creature.stat_block.creature_type.traits, creatureTypes: [] },
      [{ operations: [{ op: 'replace', path: '/stat_block/creature_type/traits/2', value: { name: 'Tiny' } }] }],
      creature,
    )
    // LE alignment badge present but NOT wrapped in a change highlight.
    assert.match(html, /Monster__trait--alignment[^>]*>LE</)
    assert.doesNotMatch(html, /Monster__changed[\s\S]{0,40}>LE</)
  })

  it('renders badges unwrapped when nothing changed', () => {
    const traits = [{ name: 'Small', classes: ['size'] }, { name: 'Dragon' }]
    const html = renderToStaticMarkup(
      <DisplayProvider value={{ changedPaths: null }}>
        <Traits traits={traits} creatureTypes={[]} />
      </DisplayProvider>,
    )
    assert.match(html, /Monster__trait--size[^>]*>Small/)
    assert.doesNotMatch(html, /Monster__changed/)
  })
})
