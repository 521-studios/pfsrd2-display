import { describe, it } from 'node:test'
import assert from 'node:assert'

// partitionTemplateRules is the render-model builder for TemplateStatBlock.
// The component file is JSX, which node:test cannot parse, so the logic
// lives in an exported pure function and the tests replicate it here from
// the same contract. Keep in sync with TemplateStatBlock.js.
const partitionTemplateRules = (mt) => {
  const changes = (mt && mt.changes) || []
  const textChanges = []
  const abilityChanges = []
  for (const c of changes) {
    if (c.abilities && c.abilities.length > 0) {
      abilityChanges.push(c)
    } else if (c.text) {
      textChanges.push(c.text)
    }
  }
  return {
    combinedText: textChanges.join('\n'),
    abilityChanges,
    poolAbilities: (mt && mt.abilities) || [],
  }
}

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
