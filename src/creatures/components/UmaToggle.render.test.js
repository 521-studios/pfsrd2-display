import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SpecialSense from './SpecialSense.js'
import InlineAbility from './InlineAbility.js'

// 1ro0: inline UMA names are native disclosure buttons; the parent owns the
// expanded state and passes it down as umaExpanded.
const uma = { name: 'Scent', text: 'x' }

describe('inline UMA toggles', () => {
  for (const [label, render] of [
    ['SpecialSense', (expanded) => React.createElement(SpecialSense, { specialSense: { name: 'Scent', universal_monster_ability: uma }, onToggleUMA: () => {}, umaExpanded: expanded })],
    ['InlineAbility', (expanded) => React.createElement(InlineAbility, { ability: { name: 'Scent', universal_monster_ability: uma }, onToggleUMA: () => {}, umaExpanded: expanded })],
  ]) {
    it(`${label} reflects umaExpanded in aria-expanded`, () => {
      assert.match(renderToStaticMarkup(render(false)), /<button type="button" class="Monster__uma-toggle" aria-expanded="false">Scent<\/button>/)
      assert.match(renderToStaticMarkup(render(true)), /<button type="button" class="Monster__uma-toggle" aria-expanded="true">Scent<\/button>/)
    })
  }
})
