import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TemplateStatBlock, { partitionTemplateRules, TemplateChanges } from './TemplateStatBlock.js'

describe('partitionTemplateRules', () => {
  it('surfaces template-level pool abilities (Catfolk regression)', () => {
    // Catfolk: three text changes, Low-Light Vision at mt.abilities —
    // previously "Add the following abilities." rendered with nothing under
    // it because only changes[].abilities were rendered.
    const mt = {
      changes: [
        { text: '- Replace the human trait with the catfolk trait.' },
        { text: '- Add the Amurrun language.' },
        { text: '- Add the following abilities.' },
      ],
      abilities: [{ name: 'Low-Light Vision' }],
    }
    const rules = partitionTemplateRules(mt)
    assert.strictEqual(rules.poolAbilities.length, 1)
    assert.strictEqual(rules.poolAbilities[0].name, 'Low-Light Vision')
    assert.ok(rules.combinedText.includes('Add the following abilities'))
    assert.strictEqual(rules.abilityChanges.length, 0)
  })

  it('keeps change-embedded abilities on their change', () => {
    const mt = {
      changes: [
        {
          text: 'All host creatures gain the following abilities.',
          abilities: [{ name: 'Cold Stasis' }],
        },
      ],
    }
    const rules = partitionTemplateRules(mt)
    assert.strictEqual(rules.abilityChanges.length, 1)
    assert.strictEqual(rules.combinedText, '')
    assert.strictEqual(rules.poolAbilities.length, 0)
  })

  it('handles family rules objects and empty input', () => {
    assert.deepStrictEqual(partitionTemplateRules(null), {
      combinedText: '',
      abilityChanges: [],
      poolAbilities: [],
    })
  })
})

// Render-level: the real components, so a regression that computes the rules
// right but drops them from the DOM (the Catfolk bug) fails here.
const renderRules = (mt) => renderToStaticMarkup(<TemplateChanges {...partitionTemplateRules(mt)} />)

describe('TemplateChanges (render)', () => {
  it('renders the template-level ability pool under the text changes (Catfolk)', () => {
    const html = renderRules({
      changes: [{ text: '- Add the following abilities.' }],
      abilities: [{ name: 'Low-Light Vision' }],
    })
    assert.match(html, /Add the following abilities.*Monster__template-abilities.*Low-Light Vision/s)
  })

  it('renders change-embedded abilities under their own change', () => {
    const html = renderRules({
      changes: [{ text: 'All host creatures gain the following abilities.', abilities: [{ name: 'Cold Stasis' }] }],
    })
    assert.match(html, /Monster__template-change.*All host creatures gain the following abilities.*Cold Stasis/s)
  })

  it('renders nothing when there are no rules', () => {
    assert.strictEqual(renderRules(null), '')
  })
})

describe('TemplateStatBlock (render)', () => {
  it('renders a collapsed "<name> Template" disclosure for templates and families', () => {
    for (const key of ['monster_template', 'monster_family']) {
      const html = renderToStaticMarkup(<TemplateStatBlock template={{ name: 'Cryptid', [key]: { changes: [] } }} />)
      assert.match(html, /aria-expanded="false"[^>]*>.*Cryptid Template<\/button>/)
      assert.doesNotMatch(html, /Monster__template-body/) // body unmounted while collapsed
    }
  })

  it('renders nothing without a template', () => {
    assert.strictEqual(renderToStaticMarkup(<TemplateStatBlock template={null} />), '')
  })
})
